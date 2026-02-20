<?php
// Database setup script - run once to create database and tables
$host = 'localhost';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS keuangan_pribadi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE keuangan_pribadi");

    // Users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        google_id VARCHAR(255) NULL UNIQUE,
        avatar VARCHAR(500) NULL,
        email_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Add email_verified column if not exists
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0");
    }
    catch (Exception $e) {
    }

    // Categories table
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        type ENUM('income','expense') NOT NULL,
        icon VARCHAR(50) DEFAULT '💰',
        color VARCHAR(20) DEFAULT '#10b981',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Transactions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NULL,
        type ENUM('income','expense') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description VARCHAR(500) NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )");

    // Verification codes table
    $pdo->exec("CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        type ENUM('register','reset') NOT NULL,
        data TEXT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_type (email, type)
    )");

    // Site settings table
    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Insert default settings
    $pdo->exec("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES 
        ('app_name', 'DuitKu'),
        ('app_tagline', 'Keuangan Pribadi'),
        ('app_logo', ''),
        ('theme_color', ''),
        ('google_client_id', ''),
        ('smtp_host', ''),
        ('smtp_port', '587'),
        ('smtp_user', ''),
        ('smtp_pass', ''),
        ('smtp_from_email', ''),
        ('smtp_from_name', ''),
        ('theme_mode', 'system'),
        ('enable_preload', 'true')
    ");

    echo json_encode([
        'success' => true,
        'message' => 'Database and tables created successfully!',
        'tables' => ['users', 'categories', 'transactions', 'site_settings']
    ]);

}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Setup failed: ' . $e->getMessage()]);
}
