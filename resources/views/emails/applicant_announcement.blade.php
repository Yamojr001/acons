<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            padding: 32px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px;
            line-height: 1.6;
        }
        .content h2 {
            color: #1e293b;
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 16px;
        }
        .message-box {
            background-color: #f1f5f9;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin-top: 24px;
            margin-bottom: 24px;
            font-size: 15px;
            color: #475569;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Official Broadcast Announcement</h1>
        </div>
        <div class="content">
            <h2>Hello {{ $applicantName }},</h2>
            <p>We are reaching out to share an important announcement regarding your admission application status at the College of Nursing Sciences.</p>
            
            <div class="message-box">
                {!! nl2br(e($messageText)) !!}
            </div>

            <p>Should you have any inquiries or require further guidance, please do not hesitate to contact our admissions desk.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} College of Nursing Sciences. All rights reserved.</p>
            <p>This is a system generated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
