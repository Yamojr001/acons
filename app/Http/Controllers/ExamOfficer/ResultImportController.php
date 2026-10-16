<?php

namespace App\Http\Controllers\ExamOfficer;

use App\Http\Controllers\Controller;
use App\Models\{
    AcademicSession,
    Course,
    CourseRegistration,
    Department,
    Grade,
    Program,
    Semester,
    Student,
    Tenant,
    User
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth, Cache, DB, Hash, Log};
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ResultImportController extends Controller
{
    /**
     * Known standard course mappings for Set 1 ND/HND Nursing.
     */
    protected array $knownMap = [
        'HUMAN PHYSIOLOGY II' => ['name' => 'Human Physiology II', 'code' => 'NUS 122', 'units' => 2],
        'INTERPERSONAL COMMUNICATION' => ['name' => 'Interpersonal Communication & IPC', 'code' => 'IPC 121', 'units' => 2],
        'INTERPRENEURSHIP' => ['name' => 'Entrepreneurship Education', 'code' => 'EED 126', 'units' => 2],
        'OSCE' => ['name' => 'Objective Structured Clinical Examination (OSCE)', 'code' => 'OSCE 121', 'units' => 3],
        'FOUNDATION OF NURSING' => ['name' => 'Foundations of Nursing II', 'code' => 'NUS 121', 'units' => 3],
        'NUS 122' => ['name' => 'Human Physiology II', 'code' => 'NUS 122', 'units' => 2],
        'IPC 121' => ['name' => 'Interpersonal Communication & IPC', 'code' => 'IPC 121', 'units' => 2],
        'EED 126' => ['name' => 'Entrepreneurship Education', 'code' => 'EED 126', 'units' => 2],
        'OSCE 121' => ['name' => 'Objective Structured Clinical Examination (OSCE)', 'code' => 'OSCE 121', 'units' => 3],
        'NUS 121' => ['name' => 'Foundations of Nursing II', 'code' => 'NUS 121', 'units' => 3],
        'SOCIO' => ['name' => 'Sociology', 'code' => 'SOCIO', 'units' => 2],
        'ENG' => ['name' => 'English Language', 'code' => 'ENG', 'units' => 2],
        'N/INFO' => ['name' => 'Nursing Informatics', 'code' => 'N/INFO', 'units' => 2],
        'F/NSG' => ['name' => 'Foundations of Nursing II', 'code' => 'NUS 121', 'units' => 3],
        'CITIZEN' => ['name' => 'Citizenship Education', 'code' => 'CITIZEN', 'units' => 2],
        'ANAT' => ['name' => 'Anatomy & Physiology', 'code' => 'ANAT', 'units' => 3],
        'CHEM' => ['name' => 'Chemistry', 'code' => 'CHEM', 'units' => 2],
        'EMERG' => ['name' => 'Emergency Nursing & First Aid', 'code' => 'EMERG', 'units' => 2],
        'MICRO' => ['name' => 'Microbiology', 'code' => 'MICRO', 'units' => 2],
        'PHYSC' => ['name' => 'Physics', 'code' => 'PHYSC', 'units' => 2],
        'INSTR' => ['name' => 'Medical Instrumentation', 'code' => 'INSTR', 'units' => 2],
        // Master Score Sheet (ND 1st Yr 2nd Sem) course codes
        'PHC' => ['name' => 'Primary Health Care', 'code' => 'PHC 121', 'units' => 2],
        'D/PSC' => ['name' => 'Developmental Psychology', 'code' => 'DPS 121', 'units' => 2],
        'H/ANA' => ['name' => 'Human Anatomy II', 'code' => 'ANA 121', 'units' => 3],
        'H/PHS' => ['name' => 'Human Physiology II', 'code' => 'NUS 122', 'units' => 2],
        'NUTR' => ['name' => 'Nutrition & Dietetics', 'code' => 'NUT 121', 'units' => 2],
        'IPC' => ['name' => 'Interpersonal Communication & IPC', 'code' => 'IPC 121', 'units' => 2],
        'ENTR' => ['name' => 'Entrepreneurship Education', 'code' => 'EED 126', 'units' => 2],
        'PHM' => ['name' => 'Pharmacology in Nursing', 'code' => 'PHM 121', 'units' => 2],
        'OSCE' => ['name' => 'Objective Structured Clinical Examination (OSCE)', 'code' => 'OSCE 121', 'units' => 3],
    ];

    /**
     * Display the import results form.
     */
    public function index()
    {
        $tenantId = app()->has('currentTenant') ? app('currentTenant')->id : (Tenant::first()?->id ?? 1);

        $sessions = AcademicSession::orderBy('id', 'desc')->get();
        $semesters = Semester::with('academicSession')->orderBy('id', 'desc')->get();
        $programs = Program::all();
        $departments = Department::all();
        $courses = Course::orderBy('name')->get(['id', 'name', 'code', 'credit_units', 'level', 'semester_type']);

        $currentSession = AcademicSession::where('is_current', true)->first() ?? $sessions->first();
        $currentSemester = Semester::where('is_current', true)->first() ?? $semesters->first();

        // Recent stats
        $totalStudents = Student::count();
        $totalGrades = Grade::count();
        $recentGradesCount = Grade::where('created_at', '>=', now()->subDays(7))->count();
        $totalCourses = Course::count();

        return Inertia::render('ExamOfficer/ImportResults', [
            'sessions' => $sessions,
            'semesters' => $semesters,
            'programs' => $programs,
            'departments' => $departments,
            'courses' => $courses,
            'currentSessionId' => $currentSession?->id,
            'currentSemesterId' => $currentSemester?->id,
            'stats' => [
                'total_students' => $totalStudents,
                'total_grades' => $totalGrades,
                'recent_grades' => $recentGradesCount,
                'total_courses' => $totalCourses,
            ],
        ]);
    }

    /**
     * Lightweight preview endpoint to detect courses and suggest credit units before import.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:30720',
        ]);

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();
            $highestColIndex = Coordinate::columnIndexFromString($sheet->getHighestColumn());

            // 1. Detect title from rows 1-8
            $detectedCourseTitle = '';
            for ($r = 1; $r <= min(8, $highestRow); $r++) {
                for ($c = 1; $c <= $highestColIndex; $c++) {
                    $val = trim((string)$sheet->getCellByColumnAndRow($c, $r)->getValue());
                    if (preg_match('/score\s*sheet\s*(.*)/i', $val, $m)) {
                        $detectedCourseTitle = trim($m[1]);
                        break 2;
                    }
                }
            }

            if (empty($detectedCourseTitle)) {
                $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $detectedCourseTitle = trim(preg_replace('/^(score\s*sheet\s*[-_]?)/i', '', $baseName));
            }

            // 2. Detect Header Row
            $headerRow = null;
            for ($r = 1; $r <= min(25, $highestRow); $r++) {
                for ($c = 1; $c <= $highestColIndex; $c++) {
                    $val = trim((string)$sheet->getCellByColumnAndRow($c, $r)->getValue());
                    if (preg_match('/reg(istration)?\s*(no|num|number)?|matric/i', $val)) {
                        $headerRow = $r;
                        break 2;
                    }
                }
            }

            $explicitMode = $request->input('import_mode');
            $regCol = null;
            $caCol = null;
            $objCol = null;
            $essayCol = null;
            $examCol = null;
            $totalCol = null;
            $remarkCol = null;
            $broadsheetCourseCols = [];

            for ($c = 1; $c <= $highestColIndex; $c++) {
                $rawVal = trim((string)$sheet->getCellByColumnAndRow($c, $headerRow)->getValue());
                if (empty($rawVal)) continue;
                $upperVal = strtoupper($rawVal);

                if (preg_match('/reg(istration)?\s*(no|num|number)?|matric/i', $rawVal)) $regCol = $c;
                elseif (preg_match('/(candidate(\'s)?\s*)?name/i', $rawVal)) continue;
                elseif ($upperVal === 'CA' || preg_match('/^C\.?A\.?$/', $upperVal) || preg_match('/continuous\s*assess/i', $rawVal)) $caCol = $c;
                elseif ($upperVal === 'OBJ' || preg_match('/objective/i', $rawVal)) $objCol = $c;
                elseif ($upperVal === 'ESSAY' || preg_match('/theory/i', $rawVal)) $essayCol = $c;
                elseif (preg_match('/^(exam|examination)$/i', $rawVal)) $examCol = $c;
                elseif (preg_match('/^(total|total\s*score|final\s*score|sum)$/i', $rawVal)) {
                    $sample = $sheet->getCellByColumnAndRow($c, $headerRow + 1)->getValue();
                    if (is_string($sample) && preg_match('/^(pass|resit|reseat|withdraw|fail)/i', trim($sample))) {
                        $remarkCol = $c;
                    } else {
                        $totalCol = $c;
                    }
                }
                elseif (preg_match('/^(s\/?n|no\.?|codes?|sex|gender|remarks?|gpa|cgpa|pos|position|comment)$/i', $rawVal)) continue;
                else $broadsheetCourseCols[$c] = $rawVal;
            }

            if ($explicitMode === 'master') {
                $isSingle = false;
            } elseif ($explicitMode === 'individual') {
                $isSingle = true;
            } else {
                if (count($broadsheetCourseCols) >= 2) {
                    $isSingle = false;
                } else {
                    $isSingle = ($caCol !== null || $totalCol !== null || $examCol !== null || $objCol !== null || $essayCol !== null);
                }
            }

            $courses = [];
            if ($isSingle) {
                $upperTitle = strtoupper($detectedCourseTitle);
                $suggested = $this->knownMap[$upperTitle] ?? null;

                $code = $suggested['code'] ?? '';
                $name = $suggested['name'] ?? ucwords(strtolower($detectedCourseTitle));
                $units = $suggested['units'] ?? 2;

                $existing = Course::where('name', $name)->orWhere('code', $code)->first();
                if ($existing) {
                    $code = $existing->code;
                    $name = $existing->name;
                    $units = $existing->credit_units ?: $units;
                }

                $courses[] = [
                    'code' => $code ?: 'CRS',
                    'name' => $name,
                    'credit_units' => (float)$units,
                    'existing_id' => $existing?->id,
                ];
            } else {
                foreach ($broadsheetCourseCols as $c => $rawCode) {
                    $code = strtoupper(trim($rawCode));
                    $suggested = $this->knownMap[$code] ?? null;

                    $name = $suggested['name'] ?? ucwords(strtolower(str_replace(['_', '-'], ' ', $code)));
                    $units = $suggested['units'] ?? 2;

                    $existing = Course::where('code', $code)->orWhere('name', $name)->first();
                    if ($existing) {
                        $name = $existing->name;
                        $units = $existing->credit_units ?: $units;
                    }

                    $courses[] = [
                        'code' => $code,
                        'name' => $name,
                        'credit_units' => (float)$units,
                        'existing_id' => $existing?->id,
                    ];
                }
            }

            // Count student rows
            $studentCount = 0;
            if ($regCol && $headerRow) {
                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $val = trim((string)$sheet->getCellByColumnAndRow($regCol, $r)->getValue());
                    if (!empty($val) && preg_match('/[a-z0-9]/i', $val) && !preg_match('/^(signed|management|statistics|no\.\s*of|total)/i', $val) && !preg_match('/^[0-9]+$/', $val) && str_contains($val, '/')) {
                        $studentCount++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'mode' => $isSingle ? 'single' : 'multi',
                'detected_title' => $detectedCourseTitle,
                'courses' => $courses,
                'student_count' => $studentCount,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Process uploaded Excel file (per-course score sheet or multi-course broadsheet).
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:30720',
            'upload_type' => 'required|in:full,ca,exam',
            'import_mode' => 'nullable|in:individual,master,auto',
            'course_id' => 'nullable|exists:courses,id',
            'course_name' => 'nullable|string|max:255',
            'course_code' => 'nullable|string|max:50',
            'credit_units' => 'nullable|numeric|min:1|max:12',
            'course_units' => 'nullable|array',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'program_id' => 'nullable|exists:programs,id',
            'department_id' => 'nullable|exists:departments,id',
            'current_level' => 'nullable|string',
        ]);

        $tenantId = app()->has('currentTenant') ? app('currentTenant')->id : (Tenant::first()?->id ?? 1);

        // Resolve Session & Semester
        $session = $request->academic_session_id
            ? AcademicSession::find($request->academic_session_id)
            : (AcademicSession::where('is_current', true)->first() ?? AcademicSession::first());

        $semester = $request->semester_id
            ? Semester::find($request->semester_id)
            : (Semester::where('is_current', true)->first() ?? Semester::first());

        if (!$semester) {
            return back()->with('error', 'No active semester found. Please configure a semester first.');
        }

        $program = $request->program_id
            ? Program::find($request->program_id)
            : Program::first();

        $department = $request->department_id
            ? Department::find($request->department_id)
            : Department::first();

        $level = $request->current_level ?: 'ND1';
        $uploadType = $request->upload_type; // 'full', 'ca', or 'exam'

        // Per-course credit units mapping from request
        $courseUnitsMap = $request->input('course_units', []);

        $file = $request->file('file');

        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();
            $highestColIndex = Coordinate::columnIndexFromString($sheet->getHighestColumn());

            // 1. Detect Course Title from metadata rows (Rows 1-8)
            $detectedCourseTitle = '';
            for ($r = 1; $r <= min(8, $highestRow); $r++) {
                for ($c = 1; $c <= $highestColIndex; $c++) {
                    $val = trim((string)$sheet->getCellByColumnAndRow($c, $r)->getValue());
                    if (preg_match('/score\s*sheet\s*(.*)/i', $val, $m)) {
                        $detectedCourseTitle = trim($m[1]);
                        break 2;
                    }
                }
            }

            if (empty($detectedCourseTitle)) {
                $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $detectedCourseTitle = trim(preg_replace('/^(score\s*sheet\s*[-_]?)/i', '', $baseName));
            }

            // 2. Detect Header Row
            $headerRow = null;
            for ($r = 1; $r <= min(25, $highestRow); $r++) {
                for ($c = 1; $c <= $highestColIndex; $c++) {
                    $val = trim((string)$sheet->getCellByColumnAndRow($c, $r)->getValue());
                    if (preg_match('/reg(istration)?\s*(no|num|number)?|matric/i', $val)) {
                        $headerRow = $r;
                        break 2;
                    }
                }
            }

            if (!$headerRow) {
                for ($r = 1; $r <= min(25, $highestRow); $r++) {
                    for ($c = 1; $c <= $highestColIndex; $c++) {
                        $val = trim((string)$sheet->getCellByColumnAndRow($c, $r)->getValue());
                        if (preg_match('/candidate(\'s)?\s*name|name\s*of\s*candidate/i', $val)) {
                            $headerRow = $r;
                            break 2;
                        }
                    }
                }
            }

            if (!$headerRow) {
                return back()->with('error', 'Could not locate the header row. Please ensure the Excel sheet contains a "Registration Number" header column.');
            }

            // 3. Inspect Header Columns
            $regCol = null;
            $nameCol = null;
            $caCol = null;
            $objCol = null;
            $essayCol = null;
            $examCol = null;
            $totalCol = null;
            $sexCol = null;
            $remarkCol = null;
            $broadsheetCourseCols = [];

            for ($c = 1; $c <= $highestColIndex; $c++) {
                $rawVal = trim((string)$sheet->getCellByColumnAndRow($c, $headerRow)->getValue());
                if (empty($rawVal)) continue;

                $upperVal = strtoupper($rawVal);

                if (preg_match('/reg(istration)?\s*(no|num|number)?|matric/i', $rawVal)) {
                    $regCol = $c;
                } elseif (preg_match('/(candidate(\'s)?\s*)?name/i', $rawVal)) {
                    $nameCol = $c;
                } elseif (preg_match('/^(sex|gender)$/i', $rawVal)) {
                    $sexCol = $c;
                } elseif (preg_match('/^remarks?$/i', $rawVal)) {
                    $remarkCol = $c;
                } elseif ($upperVal === 'CA' || preg_match('/^C\.?A\.?$/', $upperVal) || preg_match('/continuous\s*assess/i', $rawVal)) {
                    $caCol = $c;
                } elseif ($upperVal === 'OBJ' || preg_match('/objective/i', $rawVal)) {
                    $objCol = $c;
                } elseif ($upperVal === 'ESSAY' || preg_match('/theory/i', $rawVal)) {
                    $essayCol = $c;
                } elseif (preg_match('/^(exam|examination)$/i', $rawVal)) {
                    $examCol = $c;
                } elseif (preg_match('/^(total|total\s*score|final\s*score|sum)$/i', $rawVal)) {
                    $sample = $sheet->getCellByColumnAndRow($c, $headerRow + 1)->getValue();
                    if (is_string($sample) && preg_match('/^(pass|resit|reseat|withdraw|fail)/i', trim($sample))) {
                        $remarkCol = $c;
                    } else {
                        $totalCol = $c;
                    }
                } elseif (preg_match('/^(s\/?n|no\.?|codes?|gpa|cgpa|pos|position|comment)$/i', $rawVal)) {
                    continue;
                } else {
                    $broadsheetCourseCols[$c] = $rawVal;
                }
            }

            if (!$regCol) {
                return back()->with('error', 'Registration number column could not be detected in row ' . $headerRow . '.');
            }

            $explicitMode = $request->input('import_mode');
            if ($explicitMode === 'master') {
                $isSingleCourseSheet = false;
            } elseif ($explicitMode === 'individual') {
                $isSingleCourseSheet = true;
            } else {
                if (count($broadsheetCourseCols) >= 2 && !$request->filled('course_id')) {
                    $isSingleCourseSheet = false;
                } else {
                    $isSingleCourseSheet = ($caCol !== null || $totalCol !== null || $examCol !== null || $objCol !== null || $essayCol !== null || $request->filled('course_id'));
                }
            }
            $semesterType = stripos($semester->name, 'second') !== false ? 'second' : 'first';

            // =========================================================================
            // A. SINGLE COURSE SHEET IMPORT (Course-by-Course Mode)
            // =========================================================================
            if ($isSingleCourseSheet) {
                $targetCourse = null;

                if ($request->filled('course_id')) {
                    $targetCourse = Course::find($request->course_id);
                }

                if (!$targetCourse) {
                    $courseTitle = $request->course_name ?: ($detectedCourseTitle ?: 'Course ' . date('Y'));
                    $courseCode = $request->course_code;

                    $upperTitle = strtoupper($courseTitle);
                    if (isset($this->knownMap[$upperTitle])) {
                        if (empty($courseCode)) $courseCode = $this->knownMap[$upperTitle]['code'];
                        if (empty($request->course_name)) $courseTitle = $this->knownMap[$upperTitle]['name'];
                    }

                    if (empty($courseCode)) {
                        $words = preg_split('/\s+/', $courseTitle);
                        $prefix = '';
                        foreach (array_slice($words, 0, 3) as $w) {
                            $prefix .= strtoupper(substr($w, 0, 1));
                        }
                        $courseCode = (strlen($prefix) >= 2 ? $prefix : 'CRS') . ' ' . ($semesterType === 'second' ? '121' : '111');
                    }

                    $targetCourse = Course::where('code', $courseCode)
                        ->orWhere('name', $courseTitle)
                        ->first();

                    if (!$targetCourse) {
                        $targetCourse = Course::create([
                            'tenant_id' => $tenantId,
                            'department_id' => $department?->id,
                            'name' => $courseTitle,
                            'code' => $courseCode,
                            'credit_units' => $request->credit_units ?: 2,
                            'level' => $level,
                            'semester_type' => $semesterType,
                            'type' => 'core',
                        ]);
                    }
                }

                // Check for user-selected credit units (from explicit field or course_units array)
                $chosenUnits = null;
                if ($request->filled('credit_units')) {
                    $chosenUnits = (float)$request->credit_units;
                } elseif (isset($courseUnitsMap[$targetCourse->code])) {
                    $chosenUnits = (float)$courseUnitsMap[$targetCourse->code];
                } elseif (isset($courseUnitsMap[$targetCourse->id])) {
                    $chosenUnits = (float)$courseUnitsMap[$targetCourse->id];
                } elseif (isset($this->knownMap[strtoupper($targetCourse->name)]['units'])) {
                    $chosenUnits = (float)$this->knownMap[strtoupper($targetCourse->name)]['units'];
                }

                if ($chosenUnits !== null && $chosenUnits > 0) {
                    $targetCourse->credit_units = $chosenUnits;
                    $targetCourse->save();
                }

                $newStudentsCount = 0;
                $existingStudentsCount = 0;
                $gradesCount = 0;

                DB::beginTransaction();

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $rawReg = (string)$sheet->getCellByColumnAndRow($regCol, $r)->getValue();
                    $regNo = trim($rawReg);

                    if (empty($regNo)) continue;
                    if (preg_match('/^(signed|management|statistics|no\.\s*of|total|passed|withdrawn|resit|absent)/i', $regNo)) continue;
                    if (preg_match('/^[0-9]+$/', $regNo)) continue;

                    $name = $nameCol ? trim((string)$sheet->getCellByColumnAndRow($nameCol, $r)->getValue()) : '';
                    if (preg_match('/^(statistics|no\.\s*of|total|signed|management)/i', $name)) continue;

                    $gender = 'other';
                    if ($sexCol) {
                        $rawSex = trim((string)$sheet->getCellByColumnAndRow($sexCol, $r)->getValue());
                        if (stripos($rawSex, 'm') === 0) $gender = 'male';
                        elseif (stripos($rawSex, 'f') === 0) $gender = 'female';
                    }

                    // Auto-Provision or Match Student
                    $student = Student::where('matriculation_number', $regNo)->first();
                    $userEmail = strtolower($regNo) . '@acons.edu.ng';

                    if (!$student) {
                        $user = User::where('email', $userEmail)->first();
                        if (!$user) {
                            $user = User::create([
                                'tenant_id' => $tenantId,
                                'name' => !empty($name) ? $name : $regNo,
                                'email' => $userEmail,
                                'password' => Hash::make($regNo),
                                'gender' => $gender,
                                'is_active' => true,
                                'force_password_change' => true,
                            ]);
                            $user->assignRole('student');
                        }

                        $student = Student::create([
                            'tenant_id' => $tenantId,
                            'user_id' => $user->id,
                            'department_id' => $department?->id,
                            'program_id' => $program?->id,
                            'matriculation_number' => $regNo,
                            'current_level' => $level,
                            'date_of_birth' => '2000-01-01',
                            'gender' => $gender,
                            'status' => 'active',
                            'academic_status' => 'normal',
                            'years_in_current_level' => 1,
                        ]);
                        $newStudentsCount++;
                    } else {
                        if ($student->user && !empty($name) && (empty($student->user->name) || $student->user->name === $regNo)) {
                            $student->user->update(['name' => $name]);
                        }
                        $existingStudentsCount++;
                    }

                    // Extract Scores: CA (/20), OBJ, ESSAY, Exam (/80), Total (/100)
                    $caVal = null;
                    if ($caCol) {
                        $rawCa = $sheet->getCellByColumnAndRow($caCol, $r)->getValue();
                        if ($rawCa !== null && trim((string)$rawCa) !== '' && is_numeric($rawCa)) {
                            $caVal = min(20, max(0, (float)$rawCa));
                        }
                    }

                    $objVal = null;
                    if ($objCol) {
                        $rawObj = $sheet->getCellByColumnAndRow($objCol, $r)->getValue();
                        if ($rawObj !== null && trim((string)$rawObj) !== '' && is_numeric($rawObj)) {
                            $objVal = (float)$rawObj;
                        }
                    }

                    $essayVal = null;
                    if ($essayCol) {
                        $rawEssay = $sheet->getCellByColumnAndRow($essayCol, $r)->getValue();
                        if ($rawEssay !== null && trim((string)$rawEssay) !== '' && is_numeric($rawEssay)) {
                            $essayVal = (float)$rawEssay;
                        }
                    }

                    $examVal = null;
                    if ($objVal !== null || $essayVal !== null) {
                        $examVal = min(80, max(0, ($objVal ?? 0) + ($essayVal ?? 0)));
                    } elseif ($examCol) {
                        $rawExam = $sheet->getCellByColumnAndRow($examCol, $r)->getValue();
                        if ($rawExam !== null && trim((string)$rawExam) !== '' && is_numeric($rawExam)) {
                            $examVal = min(80, max(0, (float)$rawExam));
                        }
                    }

                    $totalVal = null;
                    if ($totalCol) {
                        $rawTotal = $sheet->getCellByColumnAndRow($totalCol, $r)->getValue();
                        if (is_string($rawTotal) && str_starts_with($rawTotal, '=')) {
                            $rawTotal = $sheet->getCellByColumnAndRow($totalCol, $r)->getCalculatedValue();
                        }
                        if ($rawTotal !== null && trim((string)$rawTotal) !== '' && is_numeric($rawTotal)) {
                            $totalVal = min(100, max(0, (float)$rawTotal));
                        }
                    }

                    if ($caVal === null && $examVal === null && $totalVal !== null) {
                        $examVal = $totalVal;
                    }

                    $registration = CourseRegistration::firstOrCreate([
                        'tenant_id' => $tenantId,
                        'student_id' => $student->id,
                        'course_id' => $targetCourse->id,
                        'semester_id' => $semester->id,
                    ], [
                        'status' => 'approved',
                        'is_carryover' => false,
                    ]);

                    $grade = Grade::firstOrNew([
                        'tenant_id' => $tenantId,
                        'course_registration_id' => $registration->id,
                    ]);

                    if ($uploadType === 'ca') {
                        $grade->ca_score = $caVal;
                        if ($grade->exam_score !== null && $caVal !== null) {
                            $grade->total_score = round($caVal + $grade->exam_score, 2);
                        }
                    } elseif ($uploadType === 'exam') {
                        $grade->exam_score = $examVal ?? $totalVal;
                        if ($grade->ca_score !== null && $grade->exam_score !== null) {
                            $grade->total_score = round($grade->ca_score + $grade->exam_score, 2);
                        } else {
                            $grade->total_score = $grade->exam_score;
                        }
                    } else { // 'full'
                        if ($caVal !== null) $grade->ca_score = $caVal;
                        if ($examVal !== null) $grade->exam_score = $examVal;
                        $grade->total_score = $totalVal ?? round(($caVal ?? 0) + ($examVal ?? 0), 2);
                    }

                    if ($grade->total_score !== null) {
                        $total = $grade->total_score;
                        if ($total >= 70) $grade->grade_letter = 'A';
                        elseif ($total >= 60) $grade->grade_letter = 'B';
                        elseif ($total >= 50) $grade->grade_letter = 'C';
                        elseif ($total >= 45) $grade->grade_letter = 'D';
                        else $grade->grade_letter = 'F';

                        $grade->grade_points = match ($grade->grade_letter) {
                            'A' => 4.00,
                            'B' => 3.00,
                            'C' => 2.00,
                            'D' => 1.00,
                            default => 0.00,
                        };
                    }

                    $grade->approval_status = 'hod_approved';
                    $grade->save();
                    $gradesCount++;

                    Cache::forget('student_results_' . $student->id);
                }

                DB::commit();

                $totalProcessed = $newStudentsCount + $existingStudentsCount;
                return redirect()->route('exam_officer.results.index', [
                    'semester_id' => $semester->id,
                    'course_id' => $targetCourse->id,
                ])->with('success', "Results for [{$targetCourse->code} - {$targetCourse->name}] ({$targetCourse->credit_units} Units) imported successfully! {$totalProcessed} students processed. Results are BLOCKED from student view until the Provost officially releases them.");
            }

            // =========================================================================
            // B. MULTI-COURSE BROADSHEET IMPORT (Bulky Broadsheet Mode)
            // =========================================================================
            if (empty($broadsheetCourseCols)) {
                return back()->with('error', 'No course score columns could be detected in the spreadsheet.');
            }

            $courseMap = [];
            foreach ($broadsheetCourseCols as $c => $rawCode) {
                $cleanCode = strtoupper(trim($rawCode));
                $suggested = $this->knownMap[$cleanCode] ?? null;

                $courseName = $suggested['name'] ?? ucwords(strtolower(str_replace(['_', '-'], ' ', $cleanCode)));
                
                // Allow credit unit override from user request per course
                $units = 2;
                if (isset($courseUnitsMap[$cleanCode]) && is_numeric($courseUnitsMap[$cleanCode])) {
                    $units = (float)$courseUnitsMap[$cleanCode];
                } elseif (isset($suggested['units'])) {
                    $units = (float)$suggested['units'];
                }

                $course = Course::where('code', $cleanCode)
                    ->orWhere('name', $cleanCode)
                    ->first();

                if (!$course) {
                    $course = Course::create([
                        'tenant_id' => $tenantId,
                        'department_id' => $department?->id,
                        'name' => $courseName,
                        'code' => $cleanCode,
                        'credit_units' => $units,
                        'level' => $level,
                        'semester_type' => $semesterType,
                        'type' => 'core',
                    ]);
                } else {
                    // Update credit units if user specified
                    if (isset($courseUnitsMap[$cleanCode]) && is_numeric($courseUnitsMap[$cleanCode])) {
                        $course->credit_units = (float)$courseUnitsMap[$cleanCode];
                        $course->save();
                    }
                }
                $courseMap[$c] = $course;
            }

            $newStudentsCount = 0;
            $existingStudentsCount = 0;
            $totalGradesRecorded = 0;

            DB::beginTransaction();

            for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                $rawReg = (string)$sheet->getCellByColumnAndRow($regCol, $r)->getValue();
                $regNo = trim($rawReg);

                if (empty($regNo)) continue;
                if (preg_match('/^(signed|management|statistics|no\.\s*of|total|passed|withdrawn|resit|absent)/i', $regNo)) continue;
                if (preg_match('/^[0-9]+$/', $regNo) || !str_contains($regNo, '/')) continue;

                $name = $nameCol ? trim((string)$sheet->getCellByColumnAndRow($nameCol, $r)->getValue()) : '';
                if (preg_match('/^(statistics|no\.\s*of|total|signed|management)/i', $name)) continue;

                $gender = 'other';
                if ($sexCol) {
                    $rawSex = trim((string)$sheet->getCellByColumnAndRow($sexCol, $r)->getValue());
                    if (stripos($rawSex, 'm') === 0) $gender = 'male';
                    elseif (stripos($rawSex, 'f') === 0) $gender = 'female';
                }

                $remark = $remarkCol ? strtoupper(trim((string)$sheet->getCellByColumnAndRow($remarkCol, $r)->getValue())) : null;

                $student = Student::where('matriculation_number', $regNo)->first();
                $userEmail = strtolower($regNo) . '@acons.edu.ng';

                if (!$student) {
                    $user = User::where('email', $userEmail)->first();
                    if (!$user) {
                        $user = User::create([
                            'tenant_id' => $tenantId,
                            'name' => !empty($name) ? $name : $regNo,
                            'email' => $userEmail,
                            'password' => Hash::make($regNo),
                            'gender' => $gender,
                            'is_active' => true,
                            'force_password_change' => true,
                        ]);
                        $user->assignRole('student');
                    }

                    $student = Student::create([
                        'tenant_id' => $tenantId,
                        'user_id' => $user->id,
                        'department_id' => $department?->id,
                        'program_id' => $program?->id,
                        'matriculation_number' => $regNo,
                        'current_level' => $level,
                        'date_of_birth' => '2000-01-01',
                        'gender' => $gender,
                        'status' => 'active',
                        'academic_status' => 'normal',
                        'years_in_current_level' => 1,
                    ]);
                    $newStudentsCount++;
                } else {
                    if ($student->user && !empty($name) && (empty($student->user->name) || $student->user->name === $regNo)) {
                        $student->user->update(['name' => $name]);
                    }
                    $existingStudentsCount++;
                }

                if (!empty($remark)) {
                    if (str_contains($remark, 'PASS')) {
                        $student->academic_status = 'normal';
                    } elseif (str_contains($remark, 'RESIT') || str_contains($remark, 'RESEAT')) {
                        $student->academic_status = 'reseat';
                    } elseif (str_contains($remark, 'WITHDRAW')) {
                        $student->academic_status = 'withdrawn';
                        $student->status = 'withdrawn';
                    }
                    $student->save();
                }

                foreach ($courseMap as $c => $course) {
                    $rawScore = $sheet->getCellByColumnAndRow($c, $r)->getValue();
                    if (is_string($rawScore) && str_starts_with($rawScore, '=')) {
                        $rawScore = $sheet->getCellByColumnAndRow($c, $r)->getCalculatedValue();
                    }

                    $isAbsent = false;
                    $score = null;

                    if ($rawScore !== null && $rawScore !== '') {
                        $strScore = trim((string)$rawScore);
                        if (preg_match('/^(abs|absent|-)$/i', $strScore)) {
                            $isAbsent = true;
                            $score = 0;
                        } elseif (is_numeric($strScore)) {
                            $score = (float)$strScore;
                        }
                    }

                    $registration = CourseRegistration::firstOrCreate([
                        'tenant_id' => $tenantId,
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'semester_id' => $semester->id,
                    ], [
                        'status' => 'approved',
                        'is_carryover' => false,
                    ]);

                    $grade = Grade::firstOrNew([
                        'tenant_id' => $tenantId,
                        'course_registration_id' => $registration->id,
                    ]);

                    if ($uploadType === 'ca') {
                        $grade->ca_score = $score !== null ? min(20, max(0, $score)) : null;
                        if ($grade->exam_score !== null && $grade->ca_score !== null) {
                            $grade->total_score = round($grade->ca_score + $grade->exam_score, 2);
                        }
                    } elseif ($uploadType === 'exam') {
                        $grade->exam_score = $score !== null ? min(80, max(0, $score)) : null;
                        if ($grade->ca_score !== null && $grade->exam_score !== null) {
                            $grade->total_score = round($grade->ca_score + $grade->exam_score, 2);
                        } else {
                            $grade->total_score = $grade->exam_score;
                        }
                    } else { // 'full' (composite 0-100 course score from master score sheet)
                        $grade->total_score = $score !== null ? min(100, max(0, $score)) : null;
                        if ($grade->exam_score === null && $grade->total_score !== null) {
                            $grade->exam_score = min(80, $grade->total_score);
                        }
                    }

                    if ($isAbsent) $grade->is_absent = true;

                    if ($grade->total_score !== null) {
                        $total = $grade->total_score;
                        if ($total >= 70) $grade->grade_letter = 'A';
                        elseif ($total >= 60) $grade->grade_letter = 'B';
                        elseif ($total >= 50) $grade->grade_letter = 'C';
                        elseif ($total >= 45) $grade->grade_letter = 'D';
                        else $grade->grade_letter = 'F';

                        $grade->grade_points = match ($grade->grade_letter) {
                            'A' => 4.00,
                            'B' => 3.00,
                            'C' => 2.00,
                            'D' => 1.00,
                            default => 0.00,
                        };
                    }

                    $grade->approval_status = 'hod_approved';
                    $grade->save();
                    $totalGradesRecorded++;
                }

                Cache::forget('student_results_' . $student->id);
            }

            DB::commit();

            $totalProcessed = $newStudentsCount + $existingStudentsCount;
            return redirect()->route('exam_officer.results.broadsheet', [
                'semester_id' => $semester->id,
            ])->with('success', "Master Broadsheet results imported successfully! {$totalProcessed} students processed across " . count($courseMap) . " courses ({$totalGradesRecorded} course grades recorded). Results are BLOCKED from student view until the Provost officially releases results for this department and semester.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error importing results: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Direct update for course credit units.
     */
    public function updateCourseUnits(Request $request, Course $course)
    {
        $request->validate([
            'credit_units' => 'required|numeric|min:1|max:12',
        ]);

        $course->credit_units = (float)$request->credit_units;
        $course->save();

        return back()->with('success', "Updated [{$course->code} - {$course->name}] credit load to {$course->credit_units} Units.");
    }

    /**
     * View and filter results for the exam officer broadsheet.
     */
    public function results(Request $request)
    {
        $sessions = AcademicSession::orderBy('id', 'desc')->get();
        $semesters = Semester::with('academicSession')->orderBy('id', 'desc')->get();
        $courses = Course::orderBy('name')->get();

        $selectedSemesterId = $request->input('semester_id', Semester::where('is_current', true)->first()?->id ?? $semesters->first()?->id);
        $selectedCourseId = $request->input('course_id');
        $search = $request->input('search');

        $query = Grade::with([
            'registration.student.user',
            'registration.student.department',
            'registration.course',
            'registration.semester.academicSession',
        ]);

        if ($selectedSemesterId) {
            $query->whereHas('registration', function ($q) use ($selectedSemesterId) {
                $q->where('semester_id', $selectedSemesterId);
            });
        }

        if ($selectedCourseId) {
            $query->whereHas('registration', function ($q) use ($selectedCourseId) {
                $q->where('course_id', $selectedCourseId);
            });
        }

        if ($search) {
            $query->whereHas('registration.student', function ($q) use ($search) {
                $q->where('matriculation_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $grades = $query->latest('id')->paginate(50)->withQueryString();

        return Inertia::render('ExamOfficer/Results', [
            'grades' => $grades,
            'sessions' => $sessions,
            'semesters' => $semesters,
            'courses' => $courses,
            'filters' => [
                'semester_id' => $selectedSemesterId ? (int)$selectedSemesterId : null,
                'course_id' => $selectedCourseId ? (int)$selectedCourseId : null,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Master Broadsheet view: Each student has a single row with their reg number, name,
     * and each course's CA, Exam, and Total scores side-by-side across the row.
     */
    public function broadsheet(Request $request)
    {
        $semesters   = Semester::with('academicSession')->orderByDesc('id')->get();
        $departments = Department::orderBy('name')->get();

        $selectedSemesterId = $request->input('semester_id');
        $semester = null;
        if ($selectedSemesterId) {
            $semester = Semester::with('academicSession')->find($selectedSemesterId);
        }
        if (!$semester) {
            $semester = Semester::where('is_current', true)->with('academicSession')->first() ?? $semesters->first();
        }

        $selectedDepartmentId = $request->input('department_id');
        $search               = $request->input('search');

        // Courses for this semester
        $coursesQuery = Course::whereHas('registrations', fn($r) => $r->where('semester_id', $semester->id))
            ->when($selectedDepartmentId, fn($q) => $q->where('department_id', $selectedDepartmentId))
            ->orderBy('code');

        $courses = $coursesQuery->get(['id', 'code', 'name', 'credit_units', 'department_id']);

        // Students registered in this semester
        $studentsQuery = Student::with(['user', 'department'])
            ->whereHas('registrations', function ($q) use ($semester, $selectedDepartmentId) {
                $q->where('semester_id', $semester->id);
            })
            ->when($selectedDepartmentId, function ($q) use ($selectedDepartmentId) {
                $q->where('department_id', $selectedDepartmentId);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('matriculation_number', 'like', "%{$search}%")
                       ->orWhereHas('user', fn($uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->orderBy('matriculation_number');

        $students = $studentsQuery->get();

        // Fetch all registrations with grades for these students in this semester
        $registrations = CourseRegistration::where('semester_id', $semester->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->with('grade')
            ->get()
            ->groupBy('student_id');

        // Build each student's consolidated row
        $rows = $students->map(function ($student) use ($courses, $registrations) {
            $studentRegs = $registrations->get($student->id, collect())->keyBy('course_id');

            $courseScores = [];
            $totalScore   = 0;
            $totalUnits   = 0;
            $totalPoints  = 0;
            $passedCount  = 0;
            $failedCount  = 0;

            foreach ($courses as $course) {
                $reg   = $studentRegs->get($course->id);
                $grade = $reg?->grade;

                if ($grade) {
                    $units = (float)($course->credit_units ?: 2);
                    $score = $grade->total_score !== null ? (float)$grade->total_score : 0;
                    $totalScore  += $score;
                    $totalUnits  += $units;
                    $totalPoints += ((float)$grade->grade_points * $units);

                    if ($grade->grade_letter === 'F' || $grade->is_absent || $score < 45) {
                        $failedCount++;
                    } else {
                        $passedCount++;
                    }

                    $courseScores[$course->id] = [
                        'ca'        => $grade->ca_score !== null ? (float)$grade->ca_score : null,
                        'exam'      => $grade->exam_score !== null ? (float)$grade->exam_score : null,
                        'total'     => $grade->total_score !== null ? (float)$grade->total_score : null,
                        'grade'     => $grade->grade_letter,
                        'points'    => (float)$grade->grade_points,
                        'is_absent' => (bool)$grade->is_absent,
                        'status'    => $grade->approval_status,
                    ];
                } else {
                    $courseScores[$course->id] = null;
                }
            }

            $gpa = $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;

            $remark = 'PASS';
            if ($failedCount > 0) {
                $remark = $failedCount >= 3 ? 'REPEAT' : 'RESIT';
            }

            return [
                'id'            => $student->id,
                'matric_number' => $student->matriculation_number,
                'name'          => $student->user?->name ?? $student->matriculation_number,
                'email'         => $student->user?->email,
                'avatar_url'    => $student->user?->avatar_url,
                'department'    => $student->department?->name ?? 'General',
                'level'         => $student->current_level,
                'scores'        => $courseScores,
                'summary'       => [
                    'total_score'  => round($totalScore, 1),
                    'total_units'  => $totalUnits,
                    'gpa'          => $gpa,
                    'passed_count' => $passedCount,
                    'failed_count' => $failedCount,
                    'remark'       => $remark,
                ],
            ];
        });

        // Summary statistics for broadsheet
        $totalStudents = $rows->count();
        $passedStudents = $rows->filter(fn($r) => $r['summary']['failed_count'] === 0)->count();
        $resitStudents  = $rows->filter(fn($r) => $r['summary']['failed_count'] > 0)->count();
        $avgScore       = $totalStudents > 0 ? round($rows->avg(fn($r) => $r['summary']['total_score']), 1) : 0;
        $avgGpa         = $totalStudents > 0 ? round($rows->avg(fn($r) => $r['summary']['gpa']), 2) : 0.00;

        return Inertia::render('ExamOfficer/Broadsheet', [
            'semester'     => $semester,
            'semesters'    => $semesters,
            'departments'  => $departments,
            'courses'      => $courses,
            'students'     => $rows,
            'filters'      => [
                'semester_id'   => $semester->id,
                'department_id' => $selectedDepartmentId ? (int)$selectedDepartmentId : null,
                'search'        => $search,
            ],
            'stats'        => [
                'total_students'  => $totalStudents,
                'passed_students' => $passedStudents,
                'resit_students'  => $resitStudents,
                'avg_score'       => $avgScore,
                'avg_gpa'         => $avgGpa,
            ],
        ]);
    }

    /**
     * Export consolidated broadsheet to CSV
     */
    public function exportBroadsheet(Request $request)
    {
        $selectedSemesterId = $request->input('semester_id');
        $semester = Semester::with('academicSession')->find($selectedSemesterId)
            ?? Semester::where('is_current', true)->with('academicSession')->first();

        if (!$semester) {
            return back()->with('error', 'Semester not found.');
        }

        $selectedDepartmentId = $request->input('department_id');

        $courses = Course::whereHas('registrations', fn($r) => $r->where('semester_id', $semester->id))
            ->when($selectedDepartmentId, fn($q) => $q->where('department_id', $selectedDepartmentId))
            ->orderBy('code')
            ->get();

        $students = Student::with(['user', 'department'])
            ->whereHas('registrations', fn($q) => $q->where('semester_id', $semester->id))
            ->when($selectedDepartmentId, fn($q) => $q->where('department_id', $selectedDepartmentId))
            ->orderBy('matriculation_number')
            ->get();

        $registrations = CourseRegistration::where('semester_id', $semester->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->with('grade')
            ->get()
            ->groupBy('student_id');

        $filename = 'Master_Broadsheet_' . str_replace(['/', ' '], '_', $semester->name) . '_' . date('Ymd_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($students, $courses, $registrations) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

            // Header Row: S/N, Matric No, Student Name, Department, Courses (CA, Exam, Total, Grade), Summary
            $headerRow1 = ['S/N', 'Registration No.', 'Student Name', 'Department'];
            foreach ($courses as $c) {
                $headerRow1[] = "{$c->code} - CA (/20)";
                $headerRow1[] = "{$c->code} - Exam (/80)";
                $headerRow1[] = "{$c->code} - Total (/100)";
                $headerRow1[] = "{$c->code} - Grade";
            }
            $headerRow1[] = 'Total Score';
            $headerRow1[] = 'Credit Units';
            $headerRow1[] = 'GPA';
            $headerRow1[] = 'Remark';
            fputcsv($handle, $headerRow1);

            $sn = 1;
            foreach ($students as $student) {
                $studentRegs = $registrations->get($student->id, collect())->keyBy('course_id');
                $row = [
                    $sn++,
                    $student->matriculation_number,
                    $student->user?->name ?? $student->matriculation_number,
                    $student->department?->name ?? 'General',
                ];

                $totalScore  = 0;
                $totalUnits  = 0;
                $totalPoints = 0;
                $failedCount = 0;

                foreach ($courses as $course) {
                    $reg = $studentRegs->get($course->id);
                    $grade = $reg?->grade;

                    if ($grade) {
                        $units = (float)($course->credit_units ?: 2);
                        $tot   = $grade->total_score !== null ? (float)$grade->total_score : 0;
                        $totalScore  += $tot;
                        $totalUnits  += $units;
                        $totalPoints += ((float)$grade->grade_points * $units);

                        if ($grade->grade_letter === 'F' || $grade->is_absent || $tot < 45) {
                            $failedCount++;
                        }

                        $row[] = $grade->ca_score !== null ? $grade->ca_score : '—';
                        $row[] = $grade->exam_score !== null ? $grade->exam_score : '—';
                        $row[] = $grade->total_score !== null ? $grade->total_score : '—';
                        $row[] = $grade->grade_letter ?? '—';
                    } else {
                        $row[] = '—';
                        $row[] = '—';
                        $row[] = '—';
                        $row[] = '—';
                    }
                }

                $gpa = $totalUnits > 0 ? round($totalPoints / $totalUnits, 2) : 0.00;
                $remark = $failedCount > 0 ? ($failedCount >= 3 ? 'REPEAT' : 'RESIT') : 'PASS';

                $row[] = round($totalScore, 1);
                $row[] = $totalUnits;
                $row[] = number_format($gpa, 2);
                $row[] = $remark;

                fputcsv($handle, $row);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
