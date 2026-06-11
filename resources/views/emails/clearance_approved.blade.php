<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Physical Clearance Approved</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #16a34a; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .highlight { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .btn { display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Affiliated College of Nursing Sciences (ACONS)</h1>
        </div>
        <div class="content">
            <p>Dear {{ $name }},</p>
            
            <p>We are highly pleased to inform you that your physical credential clearance has been **Approved** by the Head of Department (HOD)!</p>
            
            <p>Your student portal account has been successfully provisioned. You can now log in to proceed with school fees payment, bio-data updating, and course registration.</p>
            
            <div class="highlight">
                <strong>Your Login Credentials:</strong><br>
                • <strong>Username (JAMB Email):</strong> {{ $email }}<br>
                • <strong>Temporary Password (Phone):</strong> {{ $password }}<br><br>
                <em>Note: You will be prompted to set a new strong, secure password upon your first login.</em>
            </div>
            
            <p>To get started, click the button below to log in:</p>
            
            <p style="text-align: center;">
                <a href="{{ url('/login') }}" class="btn" style="color: #ffffff;">Log In to Student Portal</a>
            </p>
            
            <p>Welcome to ACONS!</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the ACONS Admissions Portal.</p>
            <p>&copy; {{ date('Y') }} ACONS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
