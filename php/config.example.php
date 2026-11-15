<?php
// Copy privately to config.local.php ON THE HOST; never commit the populated file.
return [
    'db_host' => 'YOUR_ASSIGNED_MYSQL_HOST',
    'db_port' => 3306,
    'db_name' => 'YOUR_ASSIGNED_DATABASE',
    'db_user' => 'YOUR_ASSIGNED_USERNAME',
    'db_password' => '',
    'public_origin' => 'https://YOUR_BOOKSHOP_DOMAIN',
    'session_ttl_seconds' => 3600,
];
