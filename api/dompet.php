<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once __DIR__ . '/db.php';
$userId = getAuthUser();
$method = $_SERVER['REQUEST_METHOD'] ?? '';
try {
    switch ($method) {
        case 'GET':
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT w.*, 
                    (w.starting_balance + 
                        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) - 
                        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
                    ) as balance
                    FROM wallets w WHERE w.id = ? AND w.user_id = ?
                ");
                $stmt->execute([$id, $userId]);
                $wallet = $stmt->fetch();
                if (!$wallet) { jsonResponse(['error' => 'Dompet tidak ditemukan'], 404); }
                jsonResponse($wallet);
            } else {
                $stmt = $pdo->prepare("
                    SELECT w.*, 
                    (w.starting_balance + 
                        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) - 
                        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
                    ) as balance
                    FROM wallets w WHERE w.user_id = ?
                    ORDER BY w.created_at DESC
                ");
                $stmt->execute([$userId]);
                jsonResponse($stmt->fetchAll());
            }
            break;
        case 'POST':
            $data = getJsonBody();
            $name = isset($data['name']) ? trim($data['name']) : '';
            $type = isset($data['type']) ? $data['type'] : 'lainnya';
            $starting_balance = isset($data['starting_balance']) ? (float)$data['starting_balance'] : 0;
            if (empty($name)) { jsonResponse(['error' => 'Nama dompet harus diisi'], 400); }
            $stmt = $pdo->prepare("INSERT INTO wallets (user_id, name, type, starting_balance) VALUES (?, ?, ?, ?)");
            $stmt->execute([$userId, $name, $type, $starting_balance]);
            $wallet_id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM wallets WHERE id = ?");
            $stmt->execute([$wallet_id]);
            jsonResponse($stmt->fetch(), 201);
            break;
        case 'PUT':
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$id) { jsonResponse(['error' => 'ID required'], 400); }
            $data = getJsonBody();
            $name = isset($data['name']) ? trim($data['name']) : '';
            $type = isset($data['type']) ? $data['type'] : 'lainnya';
            $starting_balance = isset($data['starting_balance']) ? (float)$data['starting_balance'] : 0;
            if (empty($name)) { jsonResponse(['error' => 'Nama dompet harus diisi'], 400); }
            $stmt = $pdo->prepare("UPDATE wallets SET name = ?, type = ?, starting_balance = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$name, $type, $starting_balance, $id, $userId]);
            $stmt = $pdo->prepare("SELECT * FROM wallets WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $wallet = $stmt->fetch();
            if (!$wallet) { jsonResponse(['error' => 'Dompet tidak ditemukan'], 404); }
            jsonResponse($wallet);
            break;
        case 'DELETE':
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            if (!$id) { jsonResponse(['error' => 'ID required'], 400); }
            $stmt = $pdo->prepare("DELETE FROM wallets WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            jsonResponse(['success' => true]);
            break;
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Throwable $e) {
    jsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
}

