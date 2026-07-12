<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>" class="scroll-smooth">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="base-url" content="<?php echo e(url('/')); ?>" />
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />

    
    <?php if(app()->has('currentTenant') && app('currentTenant')->favicon_path): ?>
        <link rel="icon" href="<?php echo e(asset('storage/' . app('currentTenant')->favicon_path)); ?>" type="image/x-icon" />
    <?php else: ?>
        <link rel="icon" href="<?php echo e(asset('favicon.ico')); ?>" type="image/x-icon" />
    <?php endif; ?>

    
    <?php if(app()->has('currentTenant')): ?>
    <?php $tenant = app('currentTenant') ?>
    <style>
        :root {
            --color-tenant-primary:   <?php echo e($tenant->primary_color); ?>;
            --color-tenant-secondary: <?php echo e($tenant->secondary_color); ?>;
        }
    </style>
    <?php endif; ?>

    <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>

    
    <script type="text/javascript" src="https://sdk.monnify.com/plugin/monnify.js"></script>

    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.tsx', 'resources/css/app.css']); ?>
</head>
<body class="font-body antialiased bg-surface-50 text-surface-900">
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } elseif (config('inertia.use_script_element_for_initial_page')) { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
</body>
</html>
<?php /**PATH /home/yamojr/acons/resources/views/app.blade.php ENDPATH**/ ?>