<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Physical Clearance Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #ea580c; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .highlight { background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px; color: #c2410c; }
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
            
            <p>We regret to inform you that your physical credential clearance has been **Declined** by the Head of Department (HOD).</p>
            
            <div class="highlight">
                <strong>Reason for Clearance Rejection:</strong><br>
                {{ $reason }}
            </div>
            
            <p>Please contact the department directly if you believe this decision is in error or if you need to provide additional/corrected documents.</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the ACONS Admissions Portal.</p>
            <p>&copy; {{ date('Y') }} ACONS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
