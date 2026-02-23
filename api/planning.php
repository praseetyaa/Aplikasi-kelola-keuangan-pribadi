<?php
require_once 'db.php';

$user_id = getAuthUser();
$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Auto-create table if not exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS planning (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        icon VARCHAR(50) DEFAULT 'target',
        target_amount DECIMAL(15,2) NOT NULL,
        saved_amount DECIMAL(15,2) DEFAULT 0,
        monthly_saving DECIMAL(15,2) DEFAULT 0,
        deadline DATE NULL,
        status ENUM('active','completed','cancelled') DEFAULT 'active',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
} catch (Exception $e) {}

function calcPlanning($row) {
    $target  = (float)$row['target_amount'];
    $saved   = (float)$row['saved_amount'];
    $monthly = (float)$row['monthly_saving'];
    $pct     = $target > 0 ? round(($saved / $target) * 100, 1) : 0;
    $remain  = max(0, $target - $saved);

    $months_to_deadline = null;
    $monthly_needed     = null;
    $est_months         = null;

    if (!empty($row['deadline'])) {
        $now   = new DateTime();
        $dl    = new DateTime($row['deadline']);
        $diff  = $now->diff($dl);
        $sign  = ($dl >= $now) ? 1 : -1;
        $days  = (int)$diff->days * $sign;
        $months_to_deadline = max(0, (int)ceil($days / 30));
        if ($months_to_deadline > 0 && $remain > 0) {
            $monthly_needed = (int)round($remain / $months_to_deadline);
        }
    }

    if ($monthly > 0 && $remain > 0) {
        $est_months = (int)ceil($remain / $monthly);
    }

    $row['progress_pct']       = $pct;
    $row['remaining_amount']   = $remain;
    $row['months_to_deadline'] = $months_to_deadline;
    $row['monthly_needed']     = $monthly_needed;
    $row['estimated_months']   = $est_months;
    return $row;
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM planning WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        $row = $stmt->fetch();
        if (!$row) jsonResponse(['error' => 'Planning tidak ditemukan'], 404);
        jsonResponse(calcPlanning($row));
    }
    $status_filter = isset($_GET['status']) ? $_GET['status'] : null;
    $sql    = "SELECT * FROM planning WHERE user_id = ?";
    $params = [$user_id];
    if ($status_filter && in_array($status_filter, ['active','completed','cancelled'])) {
        $sql .= " AND status = ?";
        $params[] = $status_filter;
    }
    $sql .= " ORDER BY FIELD(status,'active','cancelled','completed'), created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    jsonResponse(array_map('calcPlanning', $rows));
}

if ($method === 'POST') {
    $d       = getJsonBody();
    $name    = trim($d['name'] ?? '');
    $icon    = trim($d['icon'] ?? 'target');
    $target  = (float)($d['target_amount']  ?? 0);
    $saved   = (float)($d['saved_amount']   ?? 0);
    $monthly = (float)($d['monthly_saving'] ?? 0);
    $dl      = !empty($d['deadline']) ? $d['deadline'] : null;
    $notes   = trim($d['notes'] ?? '');
    if (!$name)      jsonResponse(['error' => 'Nama tujuan wajib diisi'], 422);
    if ($target <= 0) jsonResponse(['error' => 'Target harga harus lebih dari 0'], 422);
    $stmt = $pdo->prepare("INSERT INTO planning (user_id,name,icon,target_amount,saved_amount,monthly_saving,deadline,notes) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([$user_id,$name,$icon,$target,$saved,$monthly,$dl,$notes]);
    $newId = (int)$pdo->lastInsertId();
    $stmt2 = $pdo->prepare("SELECT * FROM planning WHERE id = ?");
    $stmt2->execute([$newId]);
    jsonResponse(calcPlanning($stmt2->fetch()), 201);
}

if ($method === 'PUT') {
    if (!$id) jsonResponse(['error' => 'ID diperlukan'], 400);
    $chk = $pdo->prepare("SELECT id FROM planning WHERE id=? AND user_id=?");
    $chk->execute([$id,$user_id]);
    if (!$chk->fetch()) jsonResponse(['error' => 'Tidak ditemukan'], 404);
    $d = getJsonBody(); $fields=[]; $params=[];
    if (isset($d['name']))           { $fields[]='name = ?';           $params[]=trim($d['name']); }
    if (isset($d['icon']))           { $fields[]='icon = ?';           $params[]=trim($d['icon']); }
    if (isset($d['target_amount']))  { $fields[]='target_amount = ?';  $params[]=(float)$d['target_amount']; }
    if (isset($d['saved_amount']))   { $fields[]='saved_amount = ?';   $params[]=(float)$d['saved_amount']; }
    if (isset($d['monthly_saving'])) { $fields[]='monthly_saving = ?'; $params[]=(float)$d['monthly_saving']; }
    if (array_key_exists('deadline',$d)) { $fields[]='deadline = ?';   $params[]=(!empty($d['deadline'])?$d['deadline']:null); }
    if (isset($d['status']))         { $fields[]='status = ?';         $params[]=$d['status']; }
    if (array_key_exists('notes',$d))    { $fields[]='notes = ?';      $params[]=trim($d['notes']); }
    if (empty($fields)) jsonResponse(['error'=>'Tidak ada data'],400);
    $params[]=$id;
    $stmt=$pdo->prepare("UPDATE planning SET ".implode(',',$fields)." WHERE id=?");
    $stmt->execute($params);
    $s2=$pdo->prepare("SELECT * FROM planning WHERE id=?");
    $s2->execute([$id]);
    jsonResponse(calcPlanning($s2->fetch()));
}

if ($method === 'DELETE') {
    if (!$id) jsonResponse(['error'=>'ID diperlukan'],400);
    $stmt=$pdo->prepare("DELETE FROM planning WHERE id=? AND user_id=?");
    $stmt->execute([$id,$user_id]);
    if ($stmt->rowCount()===0) jsonResponse(['error'=>'Tidak ditemukan'],404);
    jsonResponse(['success'=>true,'message'=>'Planning dihapus']);
}

jsonResponse(['error'=>'Method tidak didukung'],405);