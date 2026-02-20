<?php
require_once __DIR__ . '/db.php';
$userId = getAuthUser();
$method = $_SERVER['REQUEST_METHOD'];
switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ? AND t.user_id = ?");
            $stmt->execute([$id, $userId]);
            $tx = $stmt->fetch();
            if (!$tx) { jsonResponse(['error' => 'Not found'], 404); }
            jsonResponse($tx);
        }
        $type = isset($_GET['type']) ? $_GET['type'] : null;
        $categoryId = isset($_GET['category_id']) ? $_GET['category_id'] : null;
        $month = isset($_GET['month']) ? $_GET['month'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;
        $limit = min((int)(isset($_GET['limit']) ? $_GET['limit'] : 50), 100);
        $offset = (int)(isset($_GET['offset']) ? $_GET['offset'] : 0);
        $where = "WHERE t.user_id = ?";
        $params = [$userId];
        if ($type) { $where .= " AND t.type = ?"; $params[] = $type; }
        if ($categoryId) { $where .= " AND t.category_id = ?"; $params[] = $categoryId; }
        if ($month) { $where .= " AND DATE_FORMAT(t.date, '%Y-%m') = ?"; $params[] = $month; }
        if ($search) { $where .= " AND t.description LIKE ?"; $params[] = "%" . $search . "%"; }
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM transactions t " . $where);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['total'];
        $sql = "SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM transactions t LEFT JOIN categories c ON t.category_id = c.id " . $where . " ORDER BY t.date DESC, t.created_at DESC LIMIT " . $limit . " OFFSET " . $offset;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonResponse(['data' => $stmt->fetchAll(), 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
        break;
    case 'POST':
        $data = getJsonBody();
        $type = isset($data['type']) ? $data['type'] : '';
        $amount = (float)(isset($data['amount']) ? $data['amount'] : 0);
        $description = trim(isset($data['description']) ? $data['description'] : '');
        $categoryId = isset($data['category_id']) ? $data['category_id'] : null;
        $date = isset($data['date']) ? $data['date'] : date('Y-m-d');
        if (!in_array($type, ['income', 'expense']) || $amount <= 0) { jsonResponse(['error' => 'Tipe dan jumlah wajib diisi'], 400); }
        if (empty($categoryId)) { $categoryId = null; }
        $stmt = $pdo->prepare("INSERT INTO transactions (user_id, category_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $categoryId, $type, $amount, $description, $date]);
        $newId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?");
        $stmt->execute([$newId]);
        jsonResponse($stmt->fetch(), 201);
        break;
    case 'PUT':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) { jsonResponse(['error' => 'ID required'], 400); }
        $data = getJsonBody();
        $type = isset($data['type']) ? $data['type'] : '';
        $amount = (float)(isset($data['amount']) ? $data['amount'] : 0);
        $description = trim(isset($data['description']) ? $data['description'] : '');
        $categoryId = isset($data['category_id']) ? $data['category_id'] : null;
        $date = isset($data['date']) ? $data['date'] : date('Y-m-d');
        if (!in_array($type, ['income', 'expense']) || $amount <= 0) { jsonResponse(['error' => 'Tipe dan jumlah wajib diisi'], 400); }
        if (empty($categoryId)) { $categoryId = null; }
        $stmt = $pdo->prepare("UPDATE transactions SET category_id=?, type=?, amount=?, description=?, date=? WHERE id=? AND user_id=?");
        $stmt->execute([$categoryId, $type, $amount, $description, $date, $id, $userId]);
        $stmt = $pdo->prepare("SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id=? AND t.user_id=?");
        $stmt->execute([$id, $userId]);
        jsonResponse($stmt->fetch());
        break;
    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) { jsonResponse(['error' => 'ID required'], 400); }
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE id=? AND user_id=?");
        $stmt->execute([$id, $userId]);
        jsonResponse(['success' => true]);
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
