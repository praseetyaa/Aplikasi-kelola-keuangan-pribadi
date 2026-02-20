<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM site_settings");
        $rows = $stmt->fetchAll();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        jsonResponse($settings);
        break;

    case 'POST':
        getAuthUser();

        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';

        if (strpos($contentType, 'multipart/form-data') !== false) {
            $appName = isset($_POST['app_name']) ? trim($_POST['app_name']) : null;
            $appTagline = isset($_POST['app_tagline']) ? trim($_POST['app_tagline']) : null;

            if ($appName !== null && $appName !== '') {
                $stmt = $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'app_name'");
                $stmt->execute([$appName]);
            }

            if ($appTagline !== null) {
                $stmt = $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'app_tagline'");
                $stmt->execute([$appTagline]);
            }

            $themeColor = isset($_POST['theme_color']) ? trim($_POST['theme_color']) : null;
            if ($themeColor !== null) {
                if ($themeColor === '' || preg_match('/^#[0-9a-fA-F]{6}$/', $themeColor)) {
                    $existing = $pdo->query("SELECT id FROM site_settings WHERE setting_key = 'theme_color'")->fetch();
                    if ($existing) {
                        $stmt = $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'theme_color'");
                    }
                    else {
                        $stmt = $pdo->prepare("INSERT INTO site_settings (setting_value, setting_key) VALUES (?, 'theme_color')");
                    }
                    $stmt->execute([$themeColor]);
                }
            }

            if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['logo'];
                $allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];

                if (!in_array($file['type'], $allowed)) {
                    jsonResponse(['error' => 'Format file tidak didukung. Gunakan PNG, JPG, GIF, SVG, atau WebP.'], 400);
                }

                if ($file['size'] > 2 * 1024 * 1024) {
                    jsonResponse(['error' => 'Ukuran file maksimal 2MB.'], 400);
                }

                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = 'logo_' . time() . '.' . $ext;
                $uploadDir = __DIR__ . '/../uploads/';

                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }

                $oldLogo = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'app_logo'")->fetch();
                if ($oldLogo && $oldLogo['setting_value']) {
                    $oldPath = __DIR__ . '/../' . $oldLogo['setting_value'];
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }

                if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                    $logoPath = 'uploads/' . $filename;
                    $stmt = $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'app_logo'");
                    $stmt->execute([$logoPath]);
                }
                else {
                    jsonResponse(['error' => 'Gagal mengupload file.'], 500);
                }
            }

            $removeLogo = isset($_POST['remove_logo']) ? $_POST['remove_logo'] : '';
            if ($removeLogo === '1') {
                $oldLogo = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'app_logo'")->fetch();
                if ($oldLogo && $oldLogo['setting_value']) {
                    $oldPath = __DIR__ . '/../' . $oldLogo['setting_value'];
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
                $pdo->exec("UPDATE site_settings SET setting_value = '' WHERE setting_key = 'app_logo'");
            }

            $stmt = $pdo->query("SELECT setting_key, setting_value FROM site_settings");
            $rows = $stmt->fetchAll();
            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            jsonResponse(['success' => true, 'settings' => $settings]);
        }
        else {
            jsonResponse(['error' => 'Content-Type harus multipart/form-data'], 400);
        }
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
