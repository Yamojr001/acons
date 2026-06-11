<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="base-url" content="{{ url('/') }}" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />

    {{-- Dynamic tenant favicon --}}
    @if(app()->has('currentTenant') && app('currentTenant')->favicon_path)
        <link rel="icon" href="{{ asset('storage/' . app('currentTenant')->favicon_path) }}" type="image/x-icon" />
    @else
        <link rel="icon" href="{{ asset('favicon.ico') }}" type="image/x-icon" />
    @endif

    {{-- Tenant CSS variables injected server-side for instant paint --}}
    @if(app()->has('currentTenant'))
    @php $tenant = app('currentTenant') @endphp
    <style>
        :root {
            --color-tenant-primary:   {{ $tenant->primary_color }};
            --color-tenant-secondary: {{ $tenant->secondary_color }};
        }
    </style>
    @endif

    @routes
    @inertiaHead

    {{-- Monnify Web SDK --}}
    <script type="text/javascript" src="https://sdk.monnify.com/plugin/monnify.js"></script>

    @viteReactRefresh
    @vite(['resources/js/app.tsx', 'resources/css/app.css'])
</head>
<body class="font-body antialiased bg-surface-50 text-surface-900">
    @inertia
</body>
</html>
