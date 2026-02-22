<?php
/**
 * Migration v002: Add planning table
 */
return [
    'version' => 2,
    'name' => 'add_planning_table',
    'sql' => [
        "CREATE TABLE IF NOT EXISTS planning (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(200) NOT NULL,
            icon VARCHAR(50) DEFAULT 'target',
            target_amount DECIMAL(15,2) NOT NULL,
            saved_amount DECIMAL(15,2) DEFAULT 0,
            monthly_saving DECIMAL(15,2) DEFAULT 0,
            deadline DATE NULL,
            status ENUM('active','completed','cancelled') DEFAULT 'active',
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )"
    ]
];
