<?php

/*
|--------------------------------------------------------------------------
| Database Configuration — Ameenatu College of Nursing Science
| PostgreSQL via Replit Helium DB — hardcoded to prevent .env override issues
|--------------------------------------------------------------------------
*/

return [

    'default' => 'pgsql',

    'connections' => [

        'pgsql' => [
            'driver'         => 'pgsql',
            'url'            => null,
            'host'           => 'helium',
            'port'           => '5432',
            'database'       => 'heliumdb',
            'username'       => 'postgres',
            'password'       => 'password',
            'charset'        => 'utf8',
            'prefix'         => '',
            'prefix_indexes' => true,
            'search_path'    => 'public',
            'sslmode'        => 'prefer',
        ],

        'sqlite' => [
            'driver'   => 'sqlite',
            'url'      => null,
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix'   => '',
            'foreign_key_constraints' => true,
        ],

    ],

    'migrations' => [
        'table'                  => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [
        'client' => 'phpredis',
        'options' => [
            'cluster'    => 'redis',
            'prefix'     => env('REDIS_PREFIX', ''),
        ],
        'default' => [
            'url'      => env('REDIS_URL'),
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],
        'cache' => [
            'url'      => env('REDIS_URL'),
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
        ],
    ],

];
