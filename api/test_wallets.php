<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// Create a mock stream context for php://input
function test_wallets_api()
{
    $_SESSION['user_id'] = 1;
    require 'wallets.php';
}

test_wallets_api();
?>
