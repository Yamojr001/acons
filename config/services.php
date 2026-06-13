<?php
return [
    'zainpay' => [
        'public_key'   => env('ZAINPAY_PUBLIC_KEY'),
        'zainbox_code' => env('ZAINPAY_ZAINBOX_CODE'),
        'mode'         => env('ZAINPAY_MODE', 'dev'),
    ],
    'stripe' => [
        'public'  => env('STRIPE_PUBLIC_KEY'),
        'secret'  => env('STRIPE_SECRET_KEY'),
        'webhook' => env('STRIPE_WEBHOOK_SECRET'),
        'currency' => env('STRIPE_CURRENCY', 'ngn'),
    ],
    'paystack' => [
        'public_key'     => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key'     => env('PAYSTACK_SECRET_KEY'),
        'base_url'       => env('PAYSTACK_PAYMENT_URL'),
        'merchant_email' => env('PAYSTACK_MERCHANT_EMAIL'),
    ],
    'monnify' => [
        'api_key'       => env('MONNIFY_API_KEY'),
        'secret_key'    => env('MONNIFY_SECRET_KEY'),
        'contract_code' => env('MONNIFY_CONTRACT_CODE'),
        'base_url'      => env('MONNIFY_BASE_URL'),
        'currency'      => env('MONNIFY_CURRENCY', 'NGN'),
    ],
];
