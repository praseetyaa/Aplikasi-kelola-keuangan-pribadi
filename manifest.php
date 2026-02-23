<?php
require_once __DIR__ . '/api/db.php';

header('Content-Type: application/json');

// Get icon version
$stmt = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'icon_version'");
$row = $stmt->fetch();
$iconVersion = $row ? $row['setting_value'] : '1';

$manifest = [
    'name' => 'DuitKu',
    'short_name' => 'DuitKu',
    'description' => 'Aplikasi Kelola Keuangan Pribadi',
    'start_url' => '/',
    'display' => 'standalone',
    'background_color' => '#0f172a',
    'theme_color' => '#0f172a',
    'orientation' => 'portrait-primary',
    'icons' => [
        [
            'src' => 'icon.php?size=192&v=' . $iconVersion,
            'sizes' => '192x192',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => 'icon.php?size=512&v=' . $iconVersion,
            'sizes' => '512x512',
            'type' => 'image/png',
            'purpose' => 'any'
        ],
        [
            'src' => 'icon.php?size=192&v=' . $iconVersion,
            'sizes' => '192x192',
            'type' => 'image/png',
            'purpose' => 'maskable'
        ],
        [
            'src' => 'icon.php?size=512&v=' . $iconVersion,
            'sizes' => '512x512',
            'type' => 'image/png',
            'purpose' => 'maskable'
        ]
    ]
];

echo json_encode($manifest);
