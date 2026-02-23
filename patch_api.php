<?php
// Patching planning.php
$f1 = 'api/planning.php';
$c1 = file_get_contents($f1);

$historyTable = '
    $pdo->exec("CREATE TABLE IF NOT EXISTS planning_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        month VARCHAR(7) NOT NULL,
        type ENUM(\'deposit\', \'withdrawal\') DEFAULT \'deposit\',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
';

if (strpos($c1, 'planning_history') === false) {
    $c1 = str_replace('} catch (Exception $e) {}', $historyTable . "} catch (Exception \$e) {}", $c1);
}

$historyLogic = <<<'PHP'
if (isset($_GET['action']) && $_GET['action'] === 'history') {
    if (!$id) jsonResponse(['error' => 'ID diperlukan'], 400);

    $stmt = $pdo->prepare("SELECT id, saved_amount FROM planning WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user_id]);
    $plan = $stmt->fetch();
    if (!$plan) jsonResponse(['error' => 'Planning tidak ditemukan'], 404);

    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM planning_history WHERE planning_id = ? AND user_id = ? ORDER BY month DESC, created_at DESC");
        $stmt->execute([$id, $user_id]);
        jsonResponse($stmt->fetchAll());
    }

    if ($method === 'POST') {
        $d = getJsonBody();
        $amount = isset($d['amount']) ? (float)$d['amount'] : 0;
        $mon = isset($d['month']) ? $d['month'] : date('Y-m');
        $type = isset($d['type']) ? $d['type'] : 'deposit';

        if ($amount <= 0) jsonResponse(['error' => 'Nominal harus lebih dari 0'], 422);

        $stmt = $pdo->prepare("INSERT INTO planning_history (planning_id, user_id, amount, month, type) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $user_id, $amount, $mon, $type]);

        $newSaved = $type === 'deposit' ? $plan['saved_amount'] + $amount : max(0, $plan['saved_amount'] - $amount);
        $stmt = $pdo->prepare("UPDATE planning SET saved_amount = ? WHERE id = ?");
        $stmt->execute([$newSaved, $id]);

        jsonResponse(['success' => true, 'message' => 'Riwayat berhasil ditambahkan']);
    }
}

if ($method === 'GET') {
PHP;

if (strpos($c1, "_GET['action'] === 'history'") === false) {
    // We replace the exact string `if ($method === 'GET') {` ensuring we only replace the FIRST occurrence after calcPlanning
    // Actually str_replace might replace all occurrences of `if ($method === 'GET') {`. There's only one.
    $c1 = str_replace("if (\$method === 'GET') {", $historyLogic, $c1);
}
file_put_contents($f1, $c1);
echo "Patched planning.php\n";

// Patching dashboard.php
$f2 = 'api/dashboard.php';
$c2 = file_get_contents($f2);

$queryDashboard = <<<'PHP'
$stmt = $pdo->prepare("
    SELECT p.id, p.name, p.monthly_saving 
    FROM planning p 
    WHERE p.user_id = ? 
      AND p.status = 'active' 
      AND p.monthly_saving > 0
      AND p.id NOT IN (
          SELECT planning_id FROM planning_history 
          WHERE user_id = ? AND month = ? AND type = 'deposit'
      )
");
$stmt->execute([$userId, $userId, date('Y-m')]);
$planningAlerts = $stmt->fetchAll();

jsonResponse([
    'month' => $month, 
    'total_income' => $totalIncome, 
    'total_expense' => $totalExpense, 
    'balance' => $balance, 
    'monthly_trend' => $monthlyTrend, 
    'expense_by_category' => $expenseByCategory, 
    'recent_transactions' => $recentTransactions,
    'planning_alerts' => $planningAlerts
]);
PHP;

if (strpos($c2, 'planning_alerts') === false) {
    // Regex or str_replace to replace the final jsonResponse
    $target = "jsonResponse(['month' => \$month, 'total_income' => \$totalIncome, 'total_expense' => \$totalExpense, 'balance' => \$balance, 'monthly_trend' => \$monthlyTrend, 'expense_by_category' => \$expenseByCategory, 'recent_transactions' => \$recentTransactions]);";
    $c2 = str_replace($target, $queryDashboard, $c2);
    file_put_contents($f2, $c2);
    echo "Patched dashboard.php\n";
}
else {
    echo "dashboard.php already patched\n";
}
