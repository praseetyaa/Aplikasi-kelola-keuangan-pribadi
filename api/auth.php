<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        if ($method !== 'POST')
            jsonResponse(['error' => 'Method not allowed'], 405);
        handleRegister();
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

    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email sudah terdaftar'], 409);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword]);
    $userId = $pdo->lastInsertId();

    // Create default categories
    createDefaultCategories($userId);

    $_SESSION['user_id'] = $userId;

    $user = getUserById($userId);
    jsonResponse(['success' => true, 'user' => $user], 201);
}

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

function handleGoogleLogin()
{
    global $pdo;
    $data = getJsonBody();

    $credential = $data['credential'] ?? '';
    if (empty($credential)) {
        jsonResponse(['error' => 'Google credential required'], 400);
    }

    // Decode the JWT token from Google (without verification for simplicity in dev)
    // In production, verify with Google's public keys
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

    // Check if user exists by google_id
    $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ?");
    $stmt->execute([$googleId]);
    $user = $stmt->fetch();

    if ($user) {
        // Update avatar
        $stmt = $pdo->prepare("UPDATE users SET avatar = ?, name = ? WHERE id = ?");
        $stmt->execute([$avatar, $name, $user['id']]);
        $_SESSION['user_id'] = $user['id'];
    }
    else {
        // Check if email exists (link accounts)
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existingUser = $stmt->fetch();

        if ($existingUser) {
            $stmt = $pdo->prepare("UPDATE users SET google_id = ?, avatar = ? WHERE id = ?");
            $stmt->execute([$googleId, $avatar, $existingUser['id']]);
            $_SESSION['user_id'] = $existingUser['id'];
        }
        else {
            // Create new user
            $stmt = $pdo->prepare("INSERT INTO users (name, email, google_id, avatar) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $email, $googleId, $avatar]);
            $userId = $pdo->lastInsertId();
            createDefaultCategories($userId);
            $_SESSION['user_id'] = $userId;
        }
    }

    $user = getUserById($_SESSION['user_id']);
    jsonResponse(['success' => true, 'user' => $user]);
}

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
    $stmt = $pdo->prepare("SELECT id, name, email, avatar, created_at FROM users WHERE id = ?");
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
