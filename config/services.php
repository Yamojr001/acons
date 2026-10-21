<?php
return [
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
    'zainpay' => [
        'public_key'                => env('ZAINPAY_PUBLIC_KEY'),
        'secret_key'                => env('ZAINPAY_SECRET_KEY'),
        'zainbox_code'              => env('ZAINPAY_ZAINBOX_CODE'),
        'facilitation_zainbox_code' => env('ZAINPAY_FACILITATION_ZAINBOX_CODE'),
        'mode'                      => env('ZAINPAY_MODE', 'sandbox'),
        'base_url'                  => env('ZAINPAY_BASE_URL', env('ZAINPAY_MODE') === 'production' ? 'https://api.zainpay.ng' : 'https://sandbox.zainpay.ng'),
    ],
    'sendar' => [
        'api_key'     => env('SENDAR_API_KEY'),
        'sender_id'   => env('SENDAR_SENDER_ID', 'ACONS'),
        'base_url'    => env('SENDAR_BASE_URL', 'https://sms-submit.sendar.io/api'),
        'wallet_type' => env('SENDAR_WALLET_TYPE', 'transactional'),
    ],
];
