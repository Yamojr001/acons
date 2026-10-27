<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>ACONS Official Receipt - {{ $paymentRef }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 10px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2.5px solid #065f46;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .college-title {
            font-size: 16px;
            font-weight: 900;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
        }
        .college-sub {
            font-size: 9.5px;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
        }
        .college-meta {
            font-size: 8.5px;
            color: #64748b;
            margin: 0;
        }
        .banner {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 8px 12px;
            text-align: center;
            border-radius: 4px;
            margin-bottom: 14px;
        }
        .banner-title {
            font-size: 11px;
            font-weight: 900;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 2px 0;
        }
        .banner-sub {
            font-size: 8.5px;
            color: #047857;
            margin: 0;
            font-weight: bold;
        }
        .section-heading {
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-bottom: 8px;
            margin-top: 12px;
        }
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .grid-table td {
            padding: 4px 6px;
            vertical-align: top;
            font-size: 9.5px;
        }
        .label {
            font-weight: bold;
            color: #475569;
            width: 18%;
        }
        .val {
            color: #0f172a;
            font-weight: 600;
            width: 32%;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: 800;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 8px;
            text-align: left;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        .data-table td {
            padding: 7px 8px;
            font-size: 9.5px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
        }
        .data-table .num {
            text-align: right;
        }
        .total-box {
            background-color: #f8fafc;
            border: 1.5px solid #065f46;
            border-radius: 4px;
            padding: 10px 14px;
            margin: 14px 0;
        }
        .stamp-box {
            display: inline-block;
            border: 2px solid #059669;
            color: #059669;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-radius: 4px;
        }
        .footer {
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            margin-top: 25px;
            font-size: 8px;
            color: #64748b;
            text-align: center;
            line-height: 1.4;
        }
    </style>
</head>
<body>

    <!-- Header with College Details & Logo -->
    <table class="header-table">
        <tr>
            <td style="width: 75px; vertical-align: middle;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="width: 65px; height: auto;" alt="ACONS Logo" />
                @else
                    <div style="width: 65px; height: 65px; background-color: #065f46; color: white; text-align: center; line-height: 65px; font-weight: bold; border-radius: 50%;">ACONS</div>
                @endif
            </td>
            <td style="vertical-align: middle; padding-left: 10px;">
                <h1 class="college-title">Ameenatu College of Nursing Sciences</h1>
                <div class="college-sub">Bursary Department — Financial Services Unit</div>
                <div class="college-meta">
                    Takur Adua, P.M.B. 105, Dutse, Jigawa State, Nigeria<br/>
                    Email: info@ameenatu.edu.ng | Web: www.acons.edu.ng
                </div>
            </td>
            <td style="width: 140px; text-align: right; vertical-align: middle;">
                <div class="stamp-box">PAID &amp; CONFIRMED</div>
                <div style="font-size: 8px; color: #047857; margin-top: 4px; font-weight: bold;">OFFICIAL e-RECEIPT</div>
            </td>
        </tr>
    </table>

    <!-- Receipt Banner -->
    <div class="banner">
        <div class="banner-title">Electronic Payment Receipt (e-Receipt)</div>
        <div class="banner-sub">Academic Session: {{ $academicSessionName }} | Issued Under College Financial Regulations</div>
    </div>

    <!-- Payment & Transaction Meta -->
    <div class="section-heading">Transaction Summary</div>
    <table class="grid-table">
        <tr>
            <td class="label">Receipt Reference:</td>
            <td class="val" style="font-family: monospace; color: #065f46; font-size: 10.5px;">{{ $paymentRef }}</td>
            <td class="label">Transaction Date:</td>
            <td class="val">{{ $paidAt }}</td>
        </tr>
        <tr>
            <td class="label">Payment Channel:</td>
            <td class="val">{{ strtoupper($paymentGateway) }}</td>
            <td class="label">Payment Status:</td>
            <td class="val" style="color: #059669;">SUCCESSFUL / SETTLED</td>
        </tr>
    </table>

    <!-- Student Details -->
    <div class="section-heading">Student &amp; Academic Information</div>
    <table class="grid-table">
        <tr>
            <td class="label">Student Name:</td>
            <td class="val" style="font-size: 10.5px; text-transform: uppercase;">{{ $studentName }}</td>
            <td class="label">Matric / Reg No:</td>
            <td class="val" style="color: #065f46; font-weight: bold;">{{ $matricNumber }}</td>
        </tr>
        <tr>
            <td class="label">JAMB Reg No:</td>
            <td class="val">{{ $jambNumber ?: 'N/A' }}</td>
            <td class="label">Current Level:</td>
            <td class="val">{{ $currentLevel }}</td>
        </tr>
        <tr>
            <td class="label">Department:</td>
            <td class="val">{{ $departmentName }}</td>
            <td class="label">Program:</td>
            <td class="val">{{ $programName }}</td>
        </tr>
        <tr>
            <td class="label">Phone Number:</td>
            <td class="val">{{ $phoneNumber }}</td>
            <td class="label">Portal Email:</td>
            <td class="val">{{ $email }}</td>
        </tr>
    </table>

    <!-- Fee Breakdown -->
    <div class="section-heading">Fee Particulars &amp; Billing Breakdown</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 50%;">Description / Purpose of Payment</th>
                <th style="width: 15%;">Fee Category</th>
                <th style="width: 15%; text-align: right;">Amount Due (₦)</th>
                <th style="width: 15%; text-align: right;">Amount Paid (₦)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>
                    <strong>{{ $feeName }}</strong>
                    <div style="font-size: 8px; color: #64748b; margin-top: 1px;">Session: {{ $academicSessionName }}</div>
                </td>
                <td style="text-transform: uppercase; font-weight: bold; color: #475569;">{{ $feeType }}</td>
                <td class="num">{{ number_format($amountDue, 2) }}</td>
                <td class="num" style="font-weight: bold; color: #065f46;">{{ number_format($amountPaid, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Total Box -->
    <div class="total-box">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: middle;">
                    <div style="font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Amount in Words:</div>
                    <div style="font-size: 10.5px; font-weight: 800; color: #065f46; font-style: italic;">{{ $amountInWords }}</div>
                </td>
                <td style="width: 200px; text-align: right; vertical-align: middle;">
                    <div style="font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Amount Cleared:</div>
                    <div style="font-size: 18px; font-weight: 900; color: #065f46;">₦{{ number_format($amountPaid, 2) }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Verification Notes -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
            <td style="width: 70%; font-size: 8px; color: #475569; line-height: 1.4;">
                <strong>IMPORTANT NOTICE:</strong><br/>
                1. This electronic receipt serves as official legal evidence of fee clearance with Ameenatu College of Nursing Sciences.<br/>
                2. Keep this receipt safe for course registration, physical clearance, semester examinations, and graduation audit.<br/>
                3. Tampering with or altering any details on this computer-generated document constitutes academic fraud and forgery.
            </td>
            <td style="width: 30%; text-align: right; vertical-align: bottom;">
                <div style="font-size: 9px; font-weight: bold; color: #0f172a;">BURSAR'S OFFICE</div>
                <div style="font-size: 8px; color: #64748b;">Ameenatu College of Nursing Sciences</div>
                <div style="font-size: 7.5px; color: #059669; font-weight: bold; margin-top: 2px;">AUTHENTICATED SYSTEM RECORD</div>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
        Generated electronically from the ACONS Student Portal on {{ now()->format('d/m/Y \a\t h:i A') }}.<br/>
        Document Verification Hash: {{ hash('sha256', $paymentRef . $matricNumber . $amountPaid) }}
    </div>

</body>
</html>
