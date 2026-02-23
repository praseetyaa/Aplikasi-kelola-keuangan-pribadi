<?php
require_once __DIR__ . '/db.php';
$userId = getAuthUser();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $type = $_GET['type'] ?? null;
        $query = "SELECT * FROM categories WHERE user_id = ?";
        $params = [$userId];
        if ($type) {
            $query .= " AND type = ?";
            $params[] = $type;
        }
        $query .= " ORDER BY type ASC, name ASC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $data = getJsonBody();
        $name = trim($data['name'] ?? '');
        $type = $data['type'] ?? '';
        $icon = $data['icon'] ?? '💰';
        $color = $data['color'] ?? '#10b981';

        if (empty($name) || !in_array($type, ['income', 'expense'])) {
            jsonResponse(['error' => 'Nama dan tipe wajib diisi'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $type, $icon, $color]);

        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$pdo->lastInsertId()]);
        jsonResponse($stmt->fetch(), 201);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id)
            jsonResponse(['error' => 'ID required'], 400);

        $data = getJsonBody();
        $name = trim($data['name'] ?? '');
        $icon = $data['icon'] ?? '💰';
        $color = $data['color'] ?? '#10b981';

        if (empty($name)) {
            jsonResponse(['error' => 'Nama wajib diisi'], 400);
        }

        $stmt = $pdo->prepare("UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$name, $icon, $color, $id, $userId]);

        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        jsonResponse($stmt->fetch());
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if (!$id)
            jsonResponse(['error' => 'ID required'], 400);

        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
