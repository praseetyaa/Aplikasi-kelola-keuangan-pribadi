<?php
$data = json_decode(file_get_contents('php://input'), true);
file_put_contents(__DIR__ . '/error_log.txt', print_r($data, true) . "\n", FILE_APPEND);
echo "OK";
