<?php
require_once __DIR__ . '/db.php';
$userId = getAuthUser();
$month = isset($_GET['month']) ? $_GET['month'] : date('Y-m');
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income' AND DATE_FORMAT(date, '%Y-%m') = ?");
$stmt->execute([$userId, $month]);
$totalIncome = (float)$stmt->fetch()['total'];
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(date, '%Y-%m') = ?");
$stmt->execute([$userId, $month]);
$totalExpense = (float)$stmt->fetch()['total'];
$stmt = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as ti, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as te FROM transactions WHERE user_id = ?");
$stmt->execute([$userId]);
$totals = $stmt->fetch();


$stmt = $pdo->prepare("
    SELECT SUM(balance) as total_wallet_balance FROM (
        SELECT w.id, 
        (w.starting_balance + 
            COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) - 
            COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0)
        ) as balance
        FROM wallets w WHERE w.user_id = ? AND w.type != 'credit'
    ) as wallet_balances
");
$stmt->execute([$userId]);
$walletTotals = $stmt->fetch();

$balance = (float)$walletTotals['total_wallet_balance'];
$stmt = $pdo->prepare("SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense FROM transactions WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month ASC");
$stmt->execute([$userId]);
$monthlyTrend = $stmt->fetchAll();
$stmt = $pdo->prepare("SELECT c.name, c.icon, c.color, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? AND t.type = 'expense' AND DATE_FORMAT(t.date, '%Y-%m') = ? GROUP BY c.id ORDER BY total DESC");
$stmt->execute([$userId, $month]);
$expenseByCategory = $stmt->fetchAll();
$stmt = $pdo->prepare("SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? ORDER BY t.date DESC, t.created_at DESC LIMIT 5");
$stmt->execute([$userId]);
$recentTransactions = $stmt->fetchAll();
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





