<?php
header('Content-Type: image/png');

$size = isset($_GET['size']) ? (int)$_GET['size'] : 192;

$img = imagecreatetruecolor($size, $size);

$bg = imagecolorallocate($img, 16, 185, 129);
$white = imagecolorallocate($img, 255, 255, 255);

imagefill($img, 0, 0, $bg);

$center = $size / 2;
$scale = $size / 192;

imagepng($img);
imagedestroy($img);
