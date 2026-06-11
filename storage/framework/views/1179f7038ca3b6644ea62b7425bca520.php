<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Offer of Provisional Admission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1a56db; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .highlight { background: #f3f4f6; border-left: 4px solid #1a56db; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Affiliated College of Nursing Sciences (ACONS)</h1>
        </div>
        <div class="content">
            <p>Dear <?php echo e($name); ?>,</p>
            
            <p>We are pleased to inform you that you have been offered provisional admission to study at our noble institution.</p>
            
            <div class="highlight">
                <strong>Admitted Program Details:</strong><br>
                • <strong>Department:</strong> <?php echo e($department); ?><br>
                • <strong>Section:</strong> <?php echo e($section); ?>

            </div>
            
            <h3>Next Steps: Physical Clearance</h3>
            <p>To finalize your admission, you are required to present your physical credentials for verification at the Head of Department's (HOD) office.</p>
            
            <div class="highlight">
                <strong>Your Clearance Schedule:</strong><br>
                <?php echo e($clearanceSchedule); ?>

            </div>
            
            <p>Please ensure you bring along all original copies of your certificates, uploaded credentials, and your JAMB result/slip on your scheduled clearance day.</p>
            
            <p>Congratulations once again on your admission!</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the ACONS Admissions Portal.</p>
            <p>&copy; <?php echo e(date('Y')); ?> ACONS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
<?php /**PATH /home/yamojr/devyamo/SchoolofNursing/edusaas/resources/views/emails/admission_offered.blade.php ENDPATH**/ ?>