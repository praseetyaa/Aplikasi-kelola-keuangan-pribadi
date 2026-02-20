<?php
require_once __DIR__ . '/db.php';
$userId = getAuthUser();
$year = isset($_GET['year']) ? $_GET['year'] : date('Y');
$stmt = $pdo->prepare("SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense FROM transactions WHERE user_id = ? AND YEAR(date) = ? GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month ASC");
$stmt->execute([$userId, $year]);
$monthlySummary = $stmt->fetchAll();
$stmt = $pdo->prepare("SELECT c.name, c.icon, c.color, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? AND t.type = 'income' AND YEAR(t.date) = ? GROUP BY c.id ORDER BY total DESC");
$stmt->execute([$userId, $year]);
$incomeByCategory = $stmt->fetchAll();
$stmt = $pdo->prepare("SELECT c.name, c.icon, c.color, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? AND t.type = 'expense' AND YEAR(t.date) = ? GROUP BY c.id ORDER BY total DESC");
$stmt->execute([$userId, $year]);
$expenseByCategory = $stmt->fetchAll();
$stmt = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense FROM transactions WHERE user_id = ? AND YEAR(date) = ?");
$stmt->execute([$userId, $year]);
$yearlyTotals = $stmt->fetch();
jsonResponse(['year' => (int)$year, 'total_income' => (float)$yearlyTotals['total_income'], 'total_expense' => (float)$yearlyTotals['total_expense'], 'balance' => (float)$yearlyTotals['total_income'] - (float)$yearlyTotals['total_expense'], 'monthly_summary' => $monthlySummary, 'income_by_category' => $incomeByCategory, 'expense_by_category' => $expenseByCategory]);
