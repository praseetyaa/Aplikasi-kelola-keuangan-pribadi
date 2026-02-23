<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Mock session and method
session_start();
$_SESSION['user_id'] = 1;
$_SERVER['REQUEST_METHOD'] = 'GET';

echo "Testing dashboard.php...\n";
try {
    ob_start();
    require 'api/dashboard.php';
    $out = ob_get_clean();
    echo "Dashboard response: " . $out . "\n";
}
catch (Throwable $e) {
    echo "Dashboard ERROR: " . $e->getMessage() . "\n";
}

echo "Testing planning.php history POST...\n";
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'history';
$_GET['id'] = 1;

// Mock input stream
file_put_contents('php://temp', json_encode(['amount' => 1000, 'month' => '2023-10']));

try {
    ob_start();
    require 'api/planning.php';
    $out2 = ob_get_clean();
    echo "Planning response: " . $out2 . "\n";
}
catch (Throwable $e) {
    echo "Planning ERROR: " . $e->getMessage() . "\n";
}
