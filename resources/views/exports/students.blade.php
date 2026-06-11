<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Student Directory</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            margin-bottom: 25px;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 10px;
        }
        .school-name {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .title {
            font-size: 14px;
            color: #4b5563;
            margin: 0 0 5px 0;
        }
        .meta {
            font-size: 10px;
            color: #9ca3af;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: middle;
        }
        tr:nth-child(even) td {
            background-color: #fafafa;
        }
        .matric {
            font-family: Courier, monospace;
            font-weight: bold;
            color: #4b5563;
        }
        .status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-active {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-inactive {
            background-color: #f3f4f6;
            color: #374151;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="school-name">{{ $tenant->name }}</h1>
        <h2 class="title">Student Directory Report</h2>
        <div class="meta">
            Generated on: {{ now()->format('F j, Y g:i A') }} | Total Records: {{ $students->count() }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 25%;">Student Name</th>
                <th style="width: 25%;">Email</th>
                <th style="width: 15%;">Matric Number</th>
                <th style="width: 15%;">Department</th>
                <th style="width: 8%;">Level</th>
                <th style="width: 7%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $index => $student)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td style="font-weight: bold;">{{ $student->user->name ?? 'N/A' }}</td>
                    <td>{{ $student->user->email ?? 'N/A' }}</td>
                    <td class="matric">{{ $student->matriculation_number ?? 'N/A' }}</td>
                    <td>{{ $student->department->name ?? 'N/A' }}</td>
                    <td>{{ $student->current_level ?? 'N/A' }}L</td>
                    <td>
                        <span class="status status-{{ $student->status === 'active' ? 'active' : 'inactive' }}">
                            {{ $student->status ?? 'active' }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Page 1 of 1 &copy; {{ date('Y') }} {{ $tenant->name }}. All rights reserved.
    </div>
</body>
</html>
