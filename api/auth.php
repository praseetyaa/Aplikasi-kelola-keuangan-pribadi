<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mail_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleRegister();
        break;
    case 'send_code':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleSendCode();
        break;
    case 'verify_register':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleVerifyRegister();
        break;
    case 'login':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleLogin();
        break;
    case 'google':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleGoogleLogin();
        break;
    case 'forgot_password':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleForgotPassword();
        break;
    case 'reset_password':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleResetPassword();
        break;
    case 'update_profile':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleUpdateProfile();
        break;
    case 'update_password':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleUpdatePassword();
        break;
    case 'me':
        if ($method !== 'GET')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleMe();
        break;
    case 'logout':
        handleLogout();
        break;
    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}

// ============================================
// Step 1: Send verification code for registration
// ============================================
function handleSendCode()
{
    global $pdo;
    $data = getJsonBody();
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        jsonResponse(['error' => 'Semua field wajib diisi'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Format email tidak valid'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Password minimal 6 karakter'], 400);
    }

    // Check email already registered
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email sudah terdaftar'], 409);
    }

    // Invalidate old codes
    $pdo->prepare("UPDATE verification_codes SET used = 1 WHERE email = ? AND type = 'register' AND used = 0")->execute([$email]);

    // Generate 6-digit code
    $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));
    $userData = json_encode(['name' => $name, 'password' => password_hash($password, PASSWORD_DEFAULT)]);

    $stmt = $pdo->prepare("INSERT INTO verification_codes (email, code, type, data, expires_at) VALUES (?, ?, 'register', ?, ?)");
    $stmt->execute([$email, $code, $userData, $expiresAt]);

    $sent = sendVerificationEmail($email, $code, 'register');

    $response = ['success' => true, 'message' => 'Kode verifikasi telah dikirim ke ' . $email];
    // In dev: include code in response for testing
    if (!$sent) {
        $response['dev_code'] = $code;
        $response['dev_note'] = 'Email tidak terkirim (localhost). Gunakan kode ini untuk verifikasi.';
    }
    jsonResponse($response);
}

// ============================================
// Step 2: Verify code and create account
// ============================================
function handleVerifyRegister()
{
    global $pdo;
    $data = getJsonBody();
    $email = trim($data['email'] ?? '');
    $code = trim($data['code'] ?? '');

    if (empty($email) || empty($code)) {
        jsonResponse(['error' => 'Email dan kode verifikasi wajib diisi'], 400);
    }

    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = 'register' AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$email, $code, $now]);
    $record = $stmt->fetch();

    if (!$record) {
        // Debug: find any codes for this email
        $debug = $pdo->prepare("SELECT code, used, expires_at FROM verification_codes WHERE email = ? AND type = 'register' ORDER BY id DESC LIMIT 1");
        $debug->execute([$email]);
        $last = $debug->fetch();
        $info = $last ? "Last code: {$last['code']}, Used: {$last['used']}, Expires: {$last['expires_at']}, Now: $now" : 'No codes found';
        jsonResponse(['error' => 'Kode verifikasi tidak valid atau sudah kadaluarsa', 'debug' => $info], 400);
    }

    // Mark code as used
    $pdo->prepare("UPDATE verification_codes SET used = 1 WHERE id = ?")->execute([$record['id']]);

    // Check email not taken (race condition guard)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email sudah terdaftar'], 409);
    }

    // Create user
    $userData = json_decode($record['data'], true);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, email_verified) VALUES (?, ?, ?, 1)");
    $stmt->execute([$userData['name'], $email, $userData['password']]);
    $userId = $pdo->lastInsertId();

    createDefaultCategories($userId);
    $_SESSION['user_id'] = $userId;

    $user = getUserById($userId);
    jsonResponse(['success' => true, 'user' => $user], 201);
}

// ============================================
// Legacy register (kept for compatibility)
// ============================================
function handleRegister()
{
    global $pdo;
    $data = getJsonBody();
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        jsonResponse(['error' => 'Semua field wajib diisi'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Format email tidak valid'], 400);
    }
    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Password minimal 6 karakter'], 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email sudah terdaftar'], 409);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword]);
    $userId = $pdo->lastInsertId();

    createDefaultCategories($userId);
    $_SESSION['user_id'] = $userId;

    $user = getUserById($userId);
    jsonResponse(['success' => true, 'user' => $user], 201);
}

// ============================================
// Login
// ============================================
function handleLogin()
{
    global $pdo;
    $data = getJsonBody();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['error' => 'Email dan password wajib diisi'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !$user['password'] || !password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'Email atau password salah'], 401);
    }

    $_SESSION['user_id'] = $user['id'];
    unset($user['password']);
    jsonResponse(['success' => true, 'user' => $user]);
}

// ============================================
// Google Login
// ============================================
function handleGoogleLogin()
{
    global $pdo;
    $data = getJsonBody();
    $credential = $data['credential'] ?? '';
    if (empty($credential)) {
        jsonResponse(['error' => 'Google credential required'], 400);
    }

    $parts = explode('.', $credential);
    if (count($parts) !== 3) {
        jsonResponse(['error' => 'Invalid credential format'], 400);
    }

    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    if (!$payload || !isset($payload['sub']) || !isset($payload['email'])) {
        jsonResponse(['error' => 'Invalid credential payload'], 400);
    }

    $googleId = $payload['sub'];
    $email = $payload['email'];
    $name = $payload['name'] ?? $email;
    $avatar = $payload['picture'] ?? null;

    $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ?");
    $stmt->execute([$googleId]);
    $user = $stmt->fetch();

    if ($user) {
        $stmt = $pdo->prepare("UPDATE users SET avatar = ?, name = ?, email_verified = 1 WHERE id = ?");
        $stmt->execute([$avatar, $name, $user['id']]);
        $_SESSION['user_id'] = $user['id'];
    }
    else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existingUser = $stmt->fetch();

        if ($existingUser) {
            $stmt = $pdo->prepare("UPDATE users SET google_id = ?, avatar = ?, email_verified = 1 WHERE id = ?");
            $stmt->execute([$googleId, $avatar, $existingUser['id']]);
            $_SESSION['user_id'] = $existingUser['id'];
        }
        else {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, google_id, avatar, email_verified) VALUES (?, ?, ?, ?, 1)");
            $stmt->execute([$name, $email, $googleId, $avatar]);
            $userId = $pdo->lastInsertId();
            createDefaultCategories($userId);
            $_SESSION['user_id'] = $userId;
        }
    }

    $user = getUserById($_SESSION['user_id']);
    jsonResponse(['success' => true, 'user' => $user]);
}

// ============================================
// Forgot Password — send reset code
// ============================================
function handleForgotPassword()
{
    global $pdo;
    $data = getJsonBody();
    $email = trim($data['email'] ?? '');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Email tidak valid'], 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        // Don't reveal that email doesn't exist — still show success
        jsonResponse(['success' => true, 'message' => 'Jika email terdaftar, kode reset telah dikirim.']);
    }

    $pdo->prepare("UPDATE verification_codes SET used = 1 WHERE email = ? AND type = 'reset' AND used = 0")->execute([$email]);

    $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    $stmt = $pdo->prepare("INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, 'reset', ?)");
    $stmt->execute([$email, $code, $expiresAt]);

    $sent = sendVerificationEmail($email, $code, 'reset');

    $response = ['success' => true, 'message' => 'Kode reset telah dikirim ke ' . $email];
    if (!$sent) {
        $response['dev_code'] = $code;
        $response['dev_note'] = 'Email tidak terkirim (localhost). Gunakan kode ini.';
    }
    jsonResponse($response);
}

// ============================================
// Reset Password — verify code + set new password
// ============================================
function handleResetPassword()
{
    global $pdo;
    $data = getJsonBody();
    $email = trim($data['email'] ?? '');
    $code = trim($data['code'] ?? '');
    $newPassword = $data['new_password'] ?? '';

    if (empty($email) || empty($code) || empty($newPassword)) {
        jsonResponse(['error' => 'Semua field wajib diisi'], 400);
    }
    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Password baru minimal 6 karakter'], 400);
    }

    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = 'reset' AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$email, $code, $now]);
    $record = $stmt->fetch();

    if (!$record) {
        jsonResponse(['error' => 'Kode tidak valid atau sudah kadaluarsa'], 400);
    }

    $pdo->prepare("UPDATE verification_codes SET used = 1 WHERE id = ?")->execute([$record['id']]);

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = ? WHERE email = ?")->execute([$hashedPassword, $email]);

    jsonResponse(['success' => true, 'message' => 'Password berhasil direset. Silakan login.']);
}

// ============================================
// Update Profile (name)
// ============================================
function handleUpdateProfile()
{
    global $pdo;
    $userId = getAuthUser();
    $data = getJsonBody();
    $name = trim($data['name'] ?? '');

    if (empty($name)) {
        jsonResponse(['error' => 'Nama tidak boleh kosong'], 400);
    }

    $pdo->prepare("UPDATE users SET name = ? WHERE id = ?")->execute([$name, $userId]);
    $user = getUserById($userId);
    jsonResponse(['success' => true, 'user' => $user]);
}

// ============================================
// Update Password
// ============================================
function handleUpdatePassword()
{
    global $pdo;
    $userId = getAuthUser();
    $data = getJsonBody();
    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';

    if (empty($currentPassword) || empty($newPassword)) {
        jsonResponse(['error' => 'Semua field wajib diisi'], 400);
    }
    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Password baru minimal 6 karakter'], 400);
    }

    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user['password']) {
        jsonResponse(['error' => 'Akun Google tidak bisa ubah password. Gunakan Google Sign-In.'], 400);
    }
    if (!password_verify($currentPassword, $user['password'])) {
        jsonResponse(['error' => 'Password saat ini salah'], 401);
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hashedPassword, $userId]);

    jsonResponse(['success' => true, 'message' => 'Password berhasil diubah']);
}

// ============================================
// Get current user
// ============================================
function handleMe()
{
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
    $user = getUserById($_SESSION['user_id']);
    if (!$user) {
        session_destroy();
        jsonResponse(['error' => 'User not found'], 401);
    }
    jsonResponse(['user' => $user]);
}

function handleLogout()
{
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Logged out']);
}

function getUserById($id)
{
    global $pdo;
    $stmt = $pdo->prepare("SELECT id, name, email, avatar, email_verified, created_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function createDefaultCategories($userId)
{
    global $pdo;
    $defaults = [
        ['Gaji', 'income', '💼', '#10b981'],
        ['Freelance', 'income', '💻', '#06b6d4'],
        ['Investasi', 'income', '📈', '#8b5cf6'],
        ['Bonus', 'income', '🎁', '#f59e0b'],
        ['Lainnya', 'income', '💰', '#6b7280'],
        ['Makanan', 'expense', '🍔', '#ef4444'],
        ['Transportasi', 'expense', '🚗', '#f97316'],
        ['Belanja', 'expense', '🛍️', '#ec4899'],
        ['Tagihan', 'expense', '📄', '#6366f1'],
        ['Hiburan', 'expense', '🎮', '#a855f7'],
        ['Kesehatan', 'expense', '🏥', '#14b8a6'],
        ['Pendidikan', 'expense', '📚', '#3b82f6'],
        ['Lainnya', 'expense', '📦', '#6b7280'],
    ];

    $stmt = $pdo->prepare("INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)");
    foreach ($defaults as $cat) {
        $stmt->execute([$userId, $cat[0], $cat[1], $cat[2], $cat[3]]);
    }
}
