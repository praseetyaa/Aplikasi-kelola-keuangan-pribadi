<?php
/**
 * Migration v001: Base schema (users, wallets, categories, transactions, site_settings)
 * Already applied via db_setup.php — this marks the baseline
 */
return [
    'version' => 1,
    'name' => 'base_schema',
    'sql' => [] // No-op: base tables were created by db_setup.php
];
