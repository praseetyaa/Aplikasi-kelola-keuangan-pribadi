<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SESSION = ['user_id' => 1]; // Mock session to pass getAuthUser()
$test_input = json_encode([
    'name' => 'Test PHP',
    'type' => 'bank',
    'starting_balance' => 10000
]);

// Override php://input for POST payload testing
// file_get_contents('php://input') can't be mocked easily inline, so let's overwrite getJsonBody 
// But actually we can just overwrite the $_POST or simulate it another way
// The best way is to let the API call fail if it reads php://input, or we can temporarily inject
require_once __DIR__ . '/db.php';
$_SERVER['REQUEST_METHOD'] = 'POST';

// Redefining getJsonBody for this test run only
function getJsonBodyTest()
{
    return [
        'name' => 'Test Post',
        'type' => 'bank',
        'starting_balance' => 0
    ];
}

?>
