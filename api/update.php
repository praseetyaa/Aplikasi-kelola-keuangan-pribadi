<?php
require_once 'db.php';

// update.php - Sistem Pembaruan via GitHub Releases
$action = $_GET['action'] ?? 'check';
$method = $_SERVER['REQUEST_METHOD'];

// Auto-create db_migrations table if not exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS db_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version INT NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}
catch (Exception $e) {
}

// ──────────────────────────────────────────────
// Helper: baca version.json lokal
// ──────────────────────────────────────────────
function getLocalVersion()
{
    $path = dirname(__DIR__) . '/version.json';
    if (!file_exists($path)) {
        return ['version' => '1.0.0', 'db_version' => 1, 'release_date' => '', 'github_repo' => ''];
    }
    return json_decode(file_get_contents($path), true);
}

// ──────────────────────────────────────────────
// Helper: cek GitHub Releases API
// ──────────────────────────────────────────────
function fetchGitHubLatest($repo)
{
    $url = "https://api.github.com/repos/{$repo}/releases/latest";
    $ctx = stream_context_create(['http' => [
            'timeout' => 8,
            'user_agent' => 'Mozilla/5.0 (Afina-UpdateChecker/1.0)',
            'ignore_errors' => true,
        ]]);
    $raw = @file_get_contents($url, false, $ctx);

    // Cek HTTP status code
    if (isset($http_response_header)) {
        foreach ($http_response_header as $header) {
            if (strpos($header, '404') !== false) {
                return ['_error' => "Belum ada rilis (release) yang dipublikasikan di GitHub repository '{$repo}'."];
            }
            if (strpos($header, '403') !== false) {
                return ['_error' => "Terkena limit API GitHub. Coba lagi nanti."];
            }
        }
    }

    if (!$raw)
        return ['_error' => 'Koneksi ke GitHub gagal/timeout.'];
    $data = json_decode($raw, true);

    if (isset($data['message']) && !isset($data['tag_name'])) {
        return ['_error' => "Pesan dari GitHub: " . $data['message']];
    }

    if (empty($data['tag_name'])) {
        return ['_error' => 'Format balasan GitHub tidak valid (tidak ada tag_name).'];
    }

    return $data;
}

// ──────────────────────────────────────────────
// Helper: bandingkan semver
// ──────────────────────────────────────────────
function versionCompare($local, $remote)
{
    $l = ltrim($local, 'v');
    $r = ltrim($remote, 'v');
    return version_compare($r, $l, '>');
}

// ──────────────────────────────────────────────
// Helper: scan & jalankan migrasi pending
// ──────────────────────────────────────────────
function runPendingMigrations($pdo)
{
    $migDir = __DIR__ . '/migrations';
    if (!is_dir($migDir))
        return ['applied' => [], 'errors' => []];

    // Versi yang sudah diaplikasikan
    $done = $pdo->query("SELECT version FROM db_migrations ORDER BY version")->fetchAll(PDO::FETCH_COLUMN);
    $done = array_map('intval', $done);

    // Scan file migrasi
    $files = glob($migDir . '/v*.php');
    sort($files);

    $applied = [];
    $errors = [];

    foreach ($files as $file) {
        $mig = include $file;
        if (!isset($mig['version']) || in_array((int)$mig['version'], $done))
            continue;

        $ver = (int)$mig['version'];
        try {
            foreach (($mig['sql'] ?? []) as $sql) {
                $pdo->exec($sql);
            }
            $ins = $pdo->prepare("INSERT IGNORE INTO db_migrations (version, name) VALUES (?, ?)");
            $ins->execute([$ver, $mig['name'] ?? "v{$ver}"]);
            $applied[] = "v{$ver}: " . ($mig['name'] ?? '');
        }
        catch (Exception $e) {
            $errors[] = "v{$ver} gagal: " . $e->getMessage();
        }
    }

    return ['applied' => $applied, 'errors' => $errors];
}

// ──────────────────────────────────────────────
// Helper: deteksi apakah auto-update tersedia
// ──────────────────────────────────────────────
function canAutoUpdate()
{
    $root = dirname(__DIR__);
    return is_writable($root) && function_exists('exec') && function_exists('file_put_contents');
}

// ──────────────────────────────────────────────
// ACTION: local_version
// ──────────────────────────────────────────────
if ($action === 'local_version') {
    $local = getLocalVersion();
    $migs = $pdo->query("SELECT version, name, applied_at FROM db_migrations ORDER BY version")->fetchAll();
    jsonResponse([
        'version' => $local['version'],
        'db_version' => $local['db_version'] ?? 1,
        'release_date' => $local['release_date'] ?? '',
        'github_repo' => $local['github_repo'] ?? '',
        'migrations' => $migs,
        'can_auto_update' => canAutoUpdate()
    ]);
}

// ──────────────────────────────────────────────
// ACTION: check — cek update dari GitHub
// ──────────────────────────────────────────────
if ($action === 'check') {
    $local = getLocalVersion();
    $repo = $local['github_repo'] ?? '';

    if (!$repo) {
        jsonResponse(['error' => 'github_repo tidak dikonfigurasi di version.json'], 422);
    }

    // Cache di session selama 1 jam
    if (!isset($_SESSION))
        session_start();
    $cacheKey = 'gh_latest_' . md5($repo);
    $cached = $_SESSION[$cacheKey] ?? null;

    if ($cached && (time() - $cached['ts']) < 3600) {
        $gh = $cached['data'];
    }
    else {
        $gh = fetchGitHubLatest($repo);
        if ($gh) {
            $_SESSION[$cacheKey] = ['ts' => time(), 'data' => $gh];
        }
    }

    if (isset($gh['_error'])) {
        jsonResponse([
            'current_version' => $local['version'],
            'latest_version' => null,
            'has_update' => false,
            'error' => $gh['_error'],
        ]);
    }

    $latestTag = $gh['tag_name'];
    $hasUpdate = versionCompare($local['version'], $latestTag);

    jsonResponse([
        'current_version' => $local['version'],
        'latest_version' => ltrim($latestTag, 'v'),
        'latest_tag' => $latestTag,
        'has_update' => $hasUpdate,
        'release_name' => $gh['name'] ?? $latestTag,
        'release_body' => $gh['body'] ?? '',
        'published_at' => $gh['published_at'] ?? '',
        'download_url' => $gh['zipball_url'] ?? '',
        'html_url' => $gh['html_url'] ?? '',
        'can_auto_update' => canAutoUpdate(),
    ]);
}

// ──────────────────────────────────────────────
// ACTION: migrate — jalankan migrasi DB pending
// ──────────────────────────────────────────────
if ($action === 'migrate' && $method === 'POST') {
    $result = runPendingMigrations($pdo);
    jsonResponse([
        'success' => empty($result['errors']),
        'applied' => $result['applied'],
        'errors' => $result['errors'],
        'message' => empty($result['applied'])
        ? 'Tidak ada migrasi baru'
        : 'Berhasil mengaplikasikan ' . count($result['applied']) . ' migrasi',
    ]);
}

// ──────────────────────────────────────────────
// ACTION: apply — download ZIP dari GitHub + extract + migrasi
// ──────────────────────────────────────────────
if ($action === 'apply' && $method === 'POST') {
    if (!canAutoUpdate()) {
        jsonResponse(['error' => 'Auto-update tidak tersedia di server ini.'], 422);
    }

    $d = getJsonBody();
    $url = $d['download_url'] ?? '';
    $tag = $d['latest_tag'] ?? '';

    if (!$url || !$tag) {
        jsonResponse(['error' => 'download_url dan latest_tag diperlukan'], 400);
    }

    $root = rtrim(dirname(__DIR__), '/\\');
    $tmpZip = sys_get_temp_dir() . '/afina_update_' . time() . '.zip';
    $tmpDir = sys_get_temp_dir() . '/afina_update_' . time();

    // Download ZIP (GitHub redirect — butuh follow_location)
    $ctxOpts = ['http' => [
            'timeout' => 60,
            'follow_location' => true,
            'user_agent' => 'Mozilla/5.0 (Afina-Updater/1.0)',
        ]];
    $zipData = @file_get_contents($url, false, stream_context_create($ctxOpts));
    if (!$zipData || strlen($zipData) < 1000) {
        jsonResponse(['error' => 'Gagal mengunduh file update dari GitHub'], 500);
    }

    file_put_contents($tmpZip, $zipData);

    // Extract ZIP
    $zip = new ZipArchive();
    if ($zip->open($tmpZip) !== true) {
        jsonResponse(['error' => 'Gagal membuka file ZIP update'], 500);
    }
    $zip->extractTo($tmpDir);
    $zip->close();
    @unlink($tmpZip);

    // Cari subfolder hasil extract (GitHub ZIP punya satu subfolder)
    $dirs = glob($tmpDir . '/*', GLOB_ONLYDIR);
    $srcDir = $dirs[0] ?? $tmpDir;

    // Salin file (preserve: api/config.php jika ada, folder uploads/)
    $preserve = ['uploads', 'api/config.php', '.htaccess'];

    // Copy rekursif
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($srcDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
        );

    $copied = 0;
    foreach ($iterator as $item) {
        $relPath = str_replace($srcDir . DIRECTORY_SEPARATOR, '', $item->getPathname());
        $relPath = str_replace('\\', '/', $relPath);
        $dest = $root . '/' . $relPath;

        // Skip preserved paths
        $skip = false;
        foreach ($preserve as $p) {
            if (strpos($relPath, $p) === 0) {
                $skip = true;
                break;
            }
        }
        if ($skip)
            continue;

        if ($item->isDir()) {
            @mkdir($dest, 0755, true);
        }
        else {
            @copy($item->getPathname(), $dest);
            $copied++;
        }
    }

    // Cleanup tmp
    $rmDir = function ($dir) use (&$rmDir) {
        if (!is_dir($dir))
            return;
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..')
                continue;
            $p = $dir . '/' . $f;
            is_dir($p) ? $rmDir($p) : @unlink($p);
        }
        @rmdir($dir);
    };
    $rmDir($tmpDir);

    // Update version.json
    $newVer = getLocalVersion();
    $newVer['version'] = ltrim($tag, 'v');
    $newVer['release_date'] = date('Y-m-d');
    file_put_contents($root . '/version.json', json_encode($newVer, JSON_PRETTY_PRINT));

    // Jalankan migrasi DB
    $migResult = runPendingMigrations($pdo);

    jsonResponse([
        'success' => true,
        'message' => "Berhasil update ke versi " . ltrim($tag, 'v'),
        'files_copied' => $copied,
        'migrations' => $migResult,
    ]);
}

jsonResponse(['error' => 'Action tidak dikenal'], 400);