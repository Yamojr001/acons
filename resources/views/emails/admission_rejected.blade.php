<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admission Application Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #dc2626; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .highlight { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; color: #991b1b; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Affiliated College of Nursing Sciences (ACONS)</h1>
        </div>
        <div class="content">
            <p>Dear {{ $name }},</p>
            
            <p>Thank you for your interest in ACONS and for submitting your application.</p>
            
            <p>We regret to inform you that we are unable to offer you admission at this time. Below is the reason provided for this decision:</p>
            
            <div class="highlight">
                <strong>Reason for Rejection:</strong><br>
                {{ $reason }}
            </div>
            
            <p>We wish you the very best in your future academic pursuits.</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the ACONS Admissions Portal.</p>
            <p>&copy; {{ date('Y') }} ACONS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
