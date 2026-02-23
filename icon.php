<?php
require_once __DIR__ . '/api/db.php';

$size = isset($_GET['size']) ? (int)$_GET['size'] : 192;
$size = min(max($size, 48), 512);

// Get app logo from settings
$stmt = $pdo->query("SELECT setting_value FROM site_settings WHERE setting_key = 'app_logo'");
$row = $stmt->fetch();
$logoPath = $row ? $row['setting_value'] : '';

header('Content-Type: image/png');

// If custom logo exists, try to use it
if ($logoPath && file_exists(__DIR__ . '/' . $logoPath)) {
    $logoFullPath = __DIR__ . '/' . $logoPath;
    $ext = strtolower(pathinfo($logoFullPath, PATHINFO_EXTENSION));
    
    if ($ext === 'png') {
        $src = imagecreatefrompng($logoFullPath);
    } elseif ($ext === 'jpg' || $ext === 'jpeg') {
        $src = imagecreatefromjpeg($logoFullPath);
    } elseif ($ext === 'gif') {
        $src = imagecreatefromgif($logoFullPath);
    } else {
        $src = false;
    }
    
    if ($src) {
        // Create transparent canvas
        $img = imagecreatetruecolor($size, $size);
        imagesavealpha($img, true);
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefill($img, 0, 0, $transparent);
        
        // Calculate dimensions to fit in square (maintain aspect ratio)
        $srcWidth = imagesx($src);
        $srcHeight = imagesy($src);
        
        // Make it square by cropping to center
        $srcSize = min($srcWidth, $srcHeight);
        $srcX = ($srcWidth - $srcSize) / 2;
        $srcY = ($srcHeight - $srcSize) / 2;
        
        // Resize to fit
        imagecopyresampled($img, $src, 0, 0, $srcX, $srcY, $size, $size, $srcSize, $srcSize);
        imagedestroy($src);
        
        imagepng($img);
        imagedestroy($img);
        exit;
    }
}

// Default icon (green circle with D)
$img = imagecreatetruecolor($size, $size);

$bg = imagecolorallocate($img, 16, 185, 129);
$white = imagecolorallocate($img, 255, 255, 255);
$dark = imagecolorallocate($img, 15, 23, 42);

imagefill($img, 0, 0, $bg);

// Draw "D" letter
$fontSize = $size * 0.5;
$centerX = $size / 2;
$centerY = $size / 2;

// Simple circle for D
imagefilledellipse($img, $centerX, $centerY, $size * 0.7, $size * 0.7, $white);

imagepng($img);
imagedestroy($img);
