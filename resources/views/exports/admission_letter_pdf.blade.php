<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>ACONS Official Provisional Admission Letter - {{ $applicant->jamb_number }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', Times, Georgia, serif;
            font-size: 10pt;
            line-height: 1.32;
            color: #111111;
        }
        .letterhead-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            z-index: -100;
        }
        .content {
            padding-top: 45mm;
            padding-left: 20mm;
            padding-right: 20mm;
            padding-bottom: 22mm;
            box-sizing: border-box;
        }
        .date-line {
            text-align: right;
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 6px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9.5pt;
        }
        .meta-table td {
            padding: 1.5px 0;
            vertical-align: bottom;
        }
        .meta-label {
            width: 145px;
            color: #111111;
        }
        .meta-value {
            font-weight: bold;
            color: #000000;
        }
        .title-box {
            text-align: center;
            margin: 8px 0 10px 0;
        }
        .title-main {
            font-size: 10.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .title-sub {
            font-size: 10pt;
            font-weight: bold;
        }
        .intro-p {
            text-align: justify;
            margin-bottom: 6px;
            font-size: 9.5pt;
        }
        .conditions-heading {
            font-weight: bold;
            font-size: 9.5pt;
            margin-top: 5px;
            margin-bottom: 2px;
        }
        .sub-heading {
            font-weight: bold;
            font-size: 9.5pt;
            margin-bottom: 2px;
        }
        .doc-intro {
            font-size: 9.5pt;
            margin-bottom: 4px;
        }
        .doc-list {
            margin: 2px 0 6px 20px;
            padding: 0;
        }
        .doc-list li {
            font-size: 9pt;
            margin-bottom: 2px;
            line-height: 1.28;
        }
        .clause {
            margin-bottom: 5px;
            text-align: justify;
            font-size: 9.5pt;
            line-height: 1.3;
        }
        .clause strong {
            font-weight: bold;
        }
        .congrats {
            text-align: center;
            font-weight: bold;
            font-size: 10pt;
            margin: 10px 0 6px 0;
        }
        .signature-block {
            text-align: center;
            margin-top: 8px;
        }
        .sig-image {
            height: 38px;
            width: auto;
            display: block;
            margin: 0 auto 2px auto;
        }
        .signatory-name {
            font-size: 10pt;
            font-weight: bold;
            margin: 0;
            line-height: 1.2;
        }
        .signatory-title {
            font-size: 9.5pt;
            margin: 0;
            line-height: 1.2;
        }
    </style>
</head>
<body>

    @if(!empty($letterheadBase64))
        <img class="letterhead-bg" src="{{ $letterheadBase64 }}" alt="Letterhead" />
    @endif

    <div class="content">
        <div class="date-line">16th October, 2026</div>

        <table class="meta-table">
            <tr>
                <td class="meta-label">Admission Number:</td>
                <td class="meta-value">ACONS/ND/2026/{{ str_pad($applicant->id, 4, '0', STR_PAD_LEFT) }}</td>
            </tr>
            <tr>
                <td class="meta-label">Name of Candidate:</td>
                <td class="meta-value">{{ strtoupper($applicant->full_name) }}</td>
            </tr>
            <tr>
                <td class="meta-label">L.G.A:</td>
                <td class="meta-value">{{ strtoupper($applicant->lga ?: 'N/A') }}</td>
            </tr>
            <tr>
                <td class="meta-label">State:</td>
                <td class="meta-value">{{ strtoupper($applicant->state_of_origin ?: 'N/A') }}</td>
            </tr>
            <tr>
                <td class="meta-label">Phone Number:</td>
                <td class="meta-value">{{ $applicant->phone_number ?: 'N/A' }}</td>
            </tr>
        </table>

        <div class="title-box">
            <div class="title-main">PROVISIONAL OFFER OF ADMISSION INTO ND/HND NURSING PROGRAM</div>
            <div class="title-sub">({{ $academicSession->name ?? '2026/2027' }} ACADEMIC SESSION)</div>
        </div>

        <div class="intro-p">
            Following your successful participation in the recent screening exercise, you have been offered provisional admission to a four-year ND/HND Nursing program at Ameenatu College of Nursing Sciences (ACONS), Dutse.
        </div>

        <div class="conditions-heading">Conditions of Admission:</div>
        <div class="sub-heading">Document verification:</div>
        <div class="doc-intro">You are required to present both the ORIGINAL and PHOTOCOPY of the following documents during registration.</div>

        <ul class="doc-list">
            <li>Primary School Leaving Certificate</li>
            <li>SSCE Statement/Certificate of results (WAEC, NECO, NABTEB or NBAIS), including the online printout</li>
            <li>Testimonial from your previous school</li>
            <li>Birth certificate or declaration of Age</li>
            <li>Medical Certificate of Fitness (Original)</li>
            <li>Two (2) recent passport-size photographs</li>
        </ul>

        <div class="clause">
            <strong>Disqualification Clause:</strong> If it is found at any point that you lack any of the required qualifications, your admission will be revoked immediately.
        </div>

        <div class="clause">
            <strong>Registration period:</strong> Registration will take place from <strong>Monday 19th October, 2026 to Friday 31st October, 2026</strong>. Failure to complete registration within this time frame will result in the cancellation of your admission.
        </div>

        <div class="clause">
            <strong>Acceptance Fee:</strong> Payment of a non-refundable Acceptance Fee of <strong>₦10,000</strong> is required prior to document verification and completion of registration.
        </div>

        <div class="clause">
            <strong>Name policy:</strong> Change of name is not permitted throughout the training period.
        </div>

        <div class="clause">
            <strong>Additional Requirements:</strong> A list of additional items required for registration is attached for your reference.
        </div>

        <div class="clause">
            <strong>Commencement of lectures:</strong> <strong>9th November, 2026</strong>.
        </div>

        <div class="congrats">
            We look forward to welcoming you to the college. Congratulations!
        </div>

        <div class="signature-block">
            @if(!empty($signatureBase64))
                <img class="sig-image" src="{{ $signatureBase64 }}" alt="Signature" />
            @else
                <div style="height: 38px;"></div>
            @endif
            <div class="signatory-name">Dr. Abdullahi Adamu</div>
            <div class="signatory-title">(Provost)</div>
        </div>
    </div>

</body>
</html>
