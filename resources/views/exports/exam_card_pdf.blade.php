<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ACONS CBT Examination Photocard - {{ $applicant->jamb_number }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 12mm 14mm 12mm 14mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 10px;
            line-height: 1.35;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 3px solid #7f1d1d;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }
        .college-title {
            font-size: 15px;
            font-weight: 900;
            color: #7f1d1d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
        }
        .college-sub {
            font-size: 9px;
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
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            text-align: center;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .banner-title {
            font-size: 10.5px;
            font-weight: 900;
            color: #7f1d1d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0;
        }
        .profile-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .profile-table td {
            vertical-align: top;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 3.5px 6px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 9.5px;
        }
        .info-label {
            color: #64748b;
            font-weight: 600;
            width: 32%;
        }
        .info-value {
            color: #0f172a;
            font-weight: bold;
        }
        .info-value-highlight {
            color: #7f1d1d;
            font-weight: 900;
            font-family: 'Courier New', Courier, monospace;
        }
        .photo-box {
            width: 120px;
            text-align: center;
            padding-left: 12px;
            vertical-align: top;
        }
        .passport-frame {
            width: 110px;
            height: 135px;
            border: 2px solid #7f1d1d;
            background-color: #f8fafc;
            overflow: hidden;
            margin: 0 auto 4px auto;
        }
        .passport-frame img {
            width: 110px;
            height: 135px;
            object-fit: cover;
        }
        .passport-tag {
            font-size: 7.5px;
            font-weight: 800;
            color: #7f1d1d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .schedule-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 8px 10px;
            margin-bottom: 10px;
        }
        .schedule-title {
            font-size: 9.5px;
            font-weight: 900;
            color: #7f1d1d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }
        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        .schedule-table td {
            padding: 2.5px 4px;
            vertical-align: top;
        }
        .section-heading {
            font-size: 9.5px;
            font-weight: 900;
            color: #7f1d1d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 8px 0 4px 0;
        }
        .subjects-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
            font-size: 9px;
        }
        .subjects-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-align: left;
            padding: 5px 8px;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 8px;
        }
        .subjects-table td {
            padding: 4px 8px;
            border-bottom: 1px solid #f1f5f9;
        }
        .instructions-list {
            margin: 0;
            padding-left: 16px;
            font-size: 8px;
            color: #334155;
            line-height: 1.35;
        }
        .instructions-list li {
            margin-bottom: 2px;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        .signatures-table td {
            width: 50%;
            vertical-align: top;
        }
        .sig-line {
            width: 160px;
            border-bottom: 1px solid #94a3b8;
            height: 24px;
            margin-bottom: 4px;
        }
        .sig-label {
            font-size: 8px;
            font-weight: bold;
            color: #1e293b;
        }
        .sig-sub {
            font-size: 7.5px;
            color: #64748b;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px dashed #cbd5e1;
            margin-top: 10px;
            padding-top: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 7.5px;
            color: #64748b;
        }
    </style>
</head>
<body>

    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td style="width: 65px; vertical-align: middle;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="ACONS Logo" style="width: 54px; height: 54px;" />
                @endif
            </td>
            <td style="vertical-align: middle; padding-left: 8px;">
                <h1 class="college-title">AMEENATU COLLEGE OF NURSING SCIENCES</h1>
                <p class="college-sub">Office of the Registrar & Admissions Directorate</p>
                <p class="college-meta">Takur Site, PMB 105, Dutse, Jigawa State, Nigeria &bull; portal@acons.edu.ng</p>
            </td>
            <td style="width: 140px; text-align: right; vertical-align: middle;">
                <div style="font-size: 8px; font-weight: bold; color: #64748b; text-transform: uppercase;">SESSION</div>
                <div style="font-size: 10.5px; font-weight: 900; color: #0f172a; text-transform: uppercase;">{{ $academicSession->name ?? '2025/2026' }}</div>
                <div style="font-size: 8.5px; font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #7f1d1d; margin-top: 3px;">
                    SLIP NO: ACONS/{{ $applicant->id }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Title Banner -->
    <div class="banner">
        <h2 class="banner-title">ENTRANCE SCREENING & COMPUTER-BASED TEST (CBT) PHOTOCARD</h2>
    </div>

    <!-- Candidate Identification & Passport Grid -->
    <table class="profile-table">
        <tr>
            <!-- Details -->
            <td>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Candidate Full Name:</td>
                        <td class="info-value" style="text-transform: uppercase;">{{ $applicant->full_name }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">JAMB Registration No:</td>
                        <td class="info-value-highlight">{{ $applicant->jamb_number }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">CBT Roll / Seat Number:</td>
                        <td class="info-value" style="color: #1e3a8a; font-family: 'Courier New', Courier, monospace; font-weight: 900;">
                            {{ $examDetails['seat_number'] }}
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Applied Nursing Program:</td>
                        <td class="info-value">{{ $applicant->appliedProgram->name ?? ($applicant->applied_program_name ?? 'Basic Nursing (ND/HND)') }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Gender / Sex:</td>
                        <td class="info-value" style="text-transform: uppercase;">{{ $applicant->sex }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">State of Origin / LGA:</td>
                        <td class="info-value">{{ $applicant->state_of_origin }} / {{ $applicant->lga }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Phone & Contact:</td>
                        <td class="info-value">{{ $applicant->phone_number }}</td>
                    </tr>
                </table>
            </td>

            <!-- Passport Box -->
            <td class="photo-box">
                <div class="passport-frame">
                    @if(!empty($passportBase64))
                        <img src="{{ $passportBase64 }}" alt="Candidate Passport" />
                    @else
                        <div style="line-height: 135px; font-size: 8px; color: #94a3b8;">NO PHOTO</div>
                    @endif
                </div>
                <div class="passport-tag">Verified Biometric Photo</div>
            </td>
        </tr>
    </table>

    <!-- Examination Schedule Box -->
    <div class="schedule-box">
        <div class="schedule-title">
            Examination Schedule & Hall Allocation &bull; <span style="color: #475569; font-weight: bold;">{{ $examDetails['batch'] }}</span>
        </div>
        <table class="schedule-table">
            <tr>
                <td style="width: 50%;">
                    <strong style="color: #475569;">Date & Scheduled Time:</strong><br />
                    <span style="font-weight: 900; color: #0f172a; font-size: 9.5px;">{{ $examDetails['exam_date'] }}</span>
                </td>
                <td style="width: 50%;">
                    <strong style="color: #475569;">Examination Mode & Duration:</strong><br />
                    <span style="font-weight: 900; color: #0f172a; font-size: 9.5px;">{{ $examDetails['cbt_duration'] }}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding-top: 4px;">
                    <strong style="color: #475569;">CBT Examination Center & Venue:</strong><br />
                    <span style="font-weight: bold; color: #0f172a;">{{ $examDetails['exam_venue'] }}</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- Registered CBT Subject Papers -->
    <div class="section-heading">Registered CBT Subject Papers (100 Questions Total)</div>
    <table class="subjects-table">
        <thead>
            <tr>
                <th style="width: 30px;">#</th>
                <th>Subject Paper Name</th>
                <th style="width: 80px; text-align: center;">Questions</th>
                <th style="width: 80px; text-align: right;">Accreditation</th>
            </tr>
        </thead>
        <tbody>
            @foreach($examDetails['subjects'] as $index => $subject)
            <tr style="background-color: {{ $index % 2 === 0 ? '#ffffff' : '#fafafa' }};">
                <td style="font-family: 'Courier New', Courier, monospace; color: #64748b;">{{ $index + 1 }}</td>
                <td style="font-weight: bold; color: #1e293b;">{{ $subject['name'] }}</td>
                <td style="text-align: center; color: #475569;">{{ $subject['questions'] }} Qs</td>
                <td style="text-align: right; color: #047857; font-weight: bold;">Accredited</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Rules & Instructions -->
    <div class="section-heading">Rules & Instructions for Candidates</div>
    <ol class="instructions-list">
        @foreach($examDetails['instructions'] as $instruction)
            <li>{{ $instruction }}</li>
        @endforeach
    </ol>

    <!-- Signatures -->
    <table class="signatures-table">
        <tr>
            <td>
                <div class="sig-line"></div>
                <div class="sig-label">Candidate Signature & Date</div>
                <div class="sig-sub">(Must be signed in ink at the CBT examination hall)</div>
            </td>
            <td style="text-align: right;">
                <div class="sig-line" style="margin-left: auto;"></div>
                <div class="sig-label">Chief Invigilator / Accreditation Stamp</div>
                <div class="sig-sub">(Official Center Accreditation Verification)</div>
            </td>
        </tr>
    </table>

    <!-- Footer Verification String -->
    <table class="footer-table">
        <tr>
            <td>VERIFICATION HASH: ACONS-CBT-{{ $applicant->jamb_number }}-{{ $applicant->id }}</td>
            <td style="text-align: right;">DATE ISSUED: {{ date('Y-m-d H:i') }}</td>
        </tr>
    </table>

</body>
</html>
