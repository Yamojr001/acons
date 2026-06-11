<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Student;
use App\Models\Lecturer;
use App\Models\Faculty;
use App\Models\Department;
use App\Models\Program;
use App\Models\AcademicSession;
use App\Models\Semester;
use App\Models\Course;
use App\Models\Fee;
use App\Models\StudentInvoice;
use App\Models\Payment;
use App\Models\CourseRegistration;
use App\Models\Applicant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolSeeder extends Seeder
{
    public function run()
    {
        // 1. Create/Update the ACONS School Tenant
        $tenant = Tenant::where('subdomain', 'acons')->first() ?? new Tenant();
        $tenant->fill([
            'name' => 'Ameenatu College of Nursing Sciences (ACONS)',
            'subdomain' => 'acons',
            'is_active' => true,
            'logo_path' => '/assets/images/acons_logo.png',
            'primary_color' => '#2e5fa9',
            'secondary_color' => '#a31d1d',
            'tagline' => 'Leading in Nursing Education, Leading in Health Care Delivery',
            'phone' => '08036894451',
            'email' => 'info@ameenatu.edu.ng',
            'address' => 'Dutse, Jigawa State',
            'settings' => [
                'max_credit_units_per_year' => 48,
                'min_credit_units_per_year' => 30,
                'grading_scale' => '5.0',
                'payment_gateway' => 'remita'
            ]
        ]);
        $tenant->save();

        // 2. Create Provost User
        $provostUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Dr. Jane Doe',
            'email' => 'provost@ameenatu.edu.ng',
            'password' => Hash::make('password')
        ]);
        $provostUser->assignRole('provost');

        $faculty = Faculty::create([
            'tenant_id' => $tenant->id,
            'name' => 'School of Nursing & Midwifery',
            'code' => 'SONM'
        ]);

        $nursingDept = Department::create([
            'tenant_id' => $tenant->id,
            'faculty_id' => $faculty->id,
            'name' => 'National Diploma in Nursing',
            'code' => 'NDN'
        ]);

        $midwiferyDept = Department::create([
            'tenant_id' => $tenant->id,
            'faculty_id' => $faculty->id,
            'name' => 'National Diploma in Midwifery',
            'code' => 'NDM'
        ]);

        // Aliases for compatibility
        $ndDept = $nursingDept;

        $nursingProgram = Program::create([
            'tenant_id' => $tenant->id,
            'department_id' => $nursingDept->id,
            'name' => 'National Diploma in Nursing',
            'degree_type' => 'ND/HND',
            'duration_years' => 4
        ]);

        $midwiferyProgram = Program::create([
            'tenant_id' => $tenant->id,
            'department_id' => $midwiferyDept->id,
            'name' => 'National Diploma in Midwifery',
            'degree_type' => 'ND/HND',
            'duration_years' => 4
        ]);

        // Aliases for compatibility
        $ndProgram = $nursingProgram;

        $session = AcademicSession::create([
            'tenant_id' => $tenant->id,
            'name' => '2025/2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-08-31',
            'is_current' => true
        ]);

        $semester = Semester::create([
            'tenant_id' => $tenant->id,
            'academic_session_id' => $session->id,
            'name' => 'First Semester',
            'type' => 'first',
            'start_date' => '2025-09-15',
            'end_date' => '2026-02-20',
            'is_current' => true
        ]);

        $secondSemester = Semester::create([
            'tenant_id' => $tenant->id,
            'academic_session_id' => $session->id,
            'name' => 'Second Semester',
            'type' => 'second',
            'start_date' => '2026-03-05',
            'end_date' => '2026-07-30',
            'is_current' => false
        ]);

        $hodUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Dr. HOD Nurse',
            'email' => 'hod@ameenatu.edu.ng',
            'password' => Hash::make('password')
        ]);
        $hodUser->assignRole('hod');

        $hodLecturer = Lecturer::create([
            'tenant_id' => $tenant->id,
            'user_id' => $hodUser->id,
            'department_id' => $nursingDept->id,
            'employee_id' => 'HOD-NUR-001',
            'hire_date' => '2018-05-10',
            'qualification' => 'PhD Nursing Science',
            'gender' => 'female'
        ]);

        $nursingDept->update(['hod_id' => $hodUser->id]);

        $lecturerUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Nurse Alice Smith',
            'email' => 'lecturer@ameenatu.edu.ng',
            'password' => Hash::make('password')
        ]);
        $lecturerUser->assignRole('lecturer');

        $lecturer = Lecturer::create([
            'tenant_id' => $tenant->id,
            'user_id' => $lecturerUser->id,
            'department_id' => $nursingDept->id,
            'employee_id' => 'EMP-2793',
            'hire_date' => '2020-01-01',
            'qualification' => 'MSc Nursing',
            'gender' => 'female'
        ]);

        // 7. Seed 10 authentic nursing courses for each level
        $coursesData = [
            'Basic Nursing Level 1' => [
                ['code' => 'NUR111', 'name' => 'Introduction to Nursing History & Ethics', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR112', 'name' => 'Foundations of Basic Nursing Science', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR113', 'name' => 'Human Anatomy & Physiology I', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR114', 'name' => 'Human Anatomy & Physiology II', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR115', 'name' => 'Medical Biochemistry for Nurses', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR116', 'name' => 'Behavioral Sciences & Psychology', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR117', 'name' => 'Primary Health Care & Community Nursing', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR118', 'name' => 'First Aid & Emergency Nursing Care', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR119', 'name' => 'Medical Microbiology & Parasitology', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR120', 'name' => 'Basic Clinical Practice Lab I', 'units' => 2, 'dept' => $nursingDept->id],
            ],
            'Basic Nursing Level 2' => [
                ['code' => 'NUR211', 'name' => 'Medical-Surgical Nursing I', 'units' => 4, 'dept' => $nursingDept->id],
                ['code' => 'NUR212', 'name' => 'Principles of Pharmacology & Therapeutics', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR213', 'name' => 'Clinical Pathology & Diagnostics', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR214', 'name' => 'Nutrition & Dietetics in Nursing Care', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR215', 'name' => 'Reproductive Health & Midwifery Science', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR216', 'name' => 'Pediatric & Child Health Nursing', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR217', 'name' => 'Mental Health & Psychiatric Nursing', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR218', 'name' => 'Clinical Epidemiology & Biostatistics', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR219', 'name' => 'Nursing Research Methodology', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR220', 'name' => 'Clinical Practicum & Hospital Rotation II', 'units' => 4, 'dept' => $nursingDept->id],
            ],
            'Basic Nursing Level 3' => [
                ['code' => 'NUR311', 'name' => 'Medical-Surgical Nursing II', 'units' => 4, 'dept' => $nursingDept->id],
                ['code' => 'NUR312', 'name' => 'Professional Nursing Leadership & Administration', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR313', 'name' => 'Advanced Maternal & Newborn Nursing', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR314', 'name' => 'Geriatric Nursing & Palliative Care', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR315', 'name' => 'Community Health Nursing Practice', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR316', 'name' => 'Environmental Health & Sanitation', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR317', 'name' => 'Intensive Care & Critical Care Nursing', 'units' => 3, 'dept' => $nursingDept->id],
                ['code' => 'NUR318', 'name' => 'Professional Code of Conduct & Forensic Nursing', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR319', 'name' => 'Seminars in Contemporary Nursing', 'units' => 2, 'dept' => $nursingDept->id],
                ['code' => 'NUR320', 'name' => 'Comprehensive Internship & Practical Board Prep', 'units' => 4, 'dept' => $nursingDept->id],
            ],
            'ND1' => [
                ['code' => 'NDN111', 'name' => 'Basics of Clinical Nursing I', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'NDN112', 'name' => 'Developmental Psychology for ND', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN113', 'name' => 'Cell Biology & Physiology', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'NDN114', 'name' => 'General Chemistry for ND', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN115', 'name' => 'Medical Sociology & Communication', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN116', 'name' => 'Hygiene & Infection Control', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN117', 'name' => 'Basic Pharmacology & Toxicology', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN118', 'name' => 'Medical Terminology & Documentation', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN119', 'name' => 'Use of English & Communication Skills', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN120', 'name' => 'Introductory Clinical Laboratory Practice', 'units' => 2, 'dept' => $ndDept->id],
            ],
            'ND2' => [
                ['code' => 'NDN211', 'name' => 'Medical-Surgical Nursing for ND II', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'NDN212', 'name' => 'Principles of Health Promotion & Education', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN213', 'name' => 'Clinical Pharmacology for ND II', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'NDN214', 'name' => 'Introduction to Mental Health Nursing', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN215', 'name' => 'Maternal & Infant Care Science', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'NDN216', 'name' => 'Pediatric Nursing for ND', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'NDN217', 'name' => 'Environmental Health Nursing', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN218', 'name' => 'Principles of Nutrition for ND', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN219', 'name' => 'Introduction to Biostatistics', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'NDN220', 'name' => 'Supervised Clinical Experience II', 'units' => 3, 'dept' => $ndDept->id],
            ],
            'HND1' => [
                ['code' => 'HND311', 'name' => 'Advanced Clinical Nursing Practice I', 'units' => 4, 'dept' => $ndDept->id],
                ['code' => 'HND312', 'name' => 'Advanced Pharmacology & Toxicology', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'HND313', 'name' => 'Maternal & Child Health Nursing', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'HND314', 'name' => 'Nursing Leadership & Management', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'HND315', 'name' => 'Advanced Biostatistics for HND', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND316', 'name' => 'Health Informatics & Systems', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND317', 'name' => 'Advanced Nursing Research & Proposal', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'HND318', 'name' => 'Medical Sociology & Cultural Competence', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND319', 'name' => 'Occupational Health & Safety for HND', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND320', 'name' => 'Advanced Practical Clinical Practicum I', 'units' => 4, 'dept' => $ndDept->id],
            ],
            'HND2' => [
                ['code' => 'HND411', 'name' => 'Advanced Clinical Nursing Practice II', 'units' => 4, 'dept' => $ndDept->id],
                ['code' => 'HND412', 'name' => 'Professional Nursing Practice Seminars', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND413', 'name' => 'Health Policy & Planning', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND414', 'name' => 'Forensic & Legal Aspects of Nursing', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND415', 'name' => 'Advanced Research Project & Defense', 'units' => 4, 'dept' => $ndDept->id],
                ['code' => 'HND416', 'name' => 'Community Mental Health & Psychiatric Care', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'HND417', 'name' => 'Critical & Emergency Trauma Nursing', 'units' => 3, 'dept' => $ndDept->id],
                ['code' => 'HND418', 'name' => 'Disaster Management & Preparedness', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND419', 'name' => 'Leadership & Entrepreneurship in Nursing', 'units' => 2, 'dept' => $ndDept->id],
                ['code' => 'HND420', 'name' => 'Final Internship & Practical Review', 'units' => 4, 'dept' => $ndDept->id],
            ]
        ];

        $allCreatedCourses = [];
        foreach ($coursesData as $level => $courses) {
            foreach ($courses as $c) {
                $allCreatedCourses[$level][] = Course::create([
                    'tenant_id' => $tenant->id,
                    'department_id' => $c['dept'],
                    'lecturer_id' => $lecturer->id,
                    'name' => $c['name'],
                    'code' => $c['code'],
                    'credit_units' => $c['units'],
                    'level' => $level,
                    'semester_type' => 'first',
                    'type' => 'core'
                ]);
            }
        }

        // Set variables to prevent breaking subsequent references
        $course1 = $allCreatedCourses['Basic Nursing Level 1'][0];
        $course2 = $allCreatedCourses['Basic Nursing Level 1'][1];
        $course3 = $allCreatedCourses['Basic Nursing Level 1'][2];
        $ndCourse1 = $allCreatedCourses['ND1'][0];
        $ndCourse2 = $allCreatedCourses['ND2'][0];
        $hndCourse1 = $allCreatedCourses['HND1'][0];

        // 8. Seed 4 student accounts per level (28 students total), fully enrolled in all level courses
        $studentsToSeed = [
            'Basic Nursing Level 1' => [
                ['name' => 'Jane Student', 'email' => 'student@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/25/001'],
                ['name' => 'Aminatu Garba', 'email' => 'aminatu.garba@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/25/002'],
                ['name' => 'Zarah Ibrahim', 'email' => 'zarah.ibrahim@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/25/003'],
                ['name' => 'Halima Bello', 'email' => 'halima.bello@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/25/004'],
            ],
            'Basic Nursing Level 2' => [
                ['name' => 'Rukayya Sani', 'email' => 'rukayya.sani@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/24/011'],
                ['name' => 'Fadila Aliyu', 'email' => 'fadila.aliyu@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/24/012'],
                ['name' => 'Bilkisu Musa', 'email' => 'bilkisu.musa@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/24/013'],
                ['name' => 'Hafsat Umar', 'email' => 'hafsat.umar@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/24/014'],
            ],
            'Basic Nursing Level 3' => [
                ['name' => 'Khadijah Shehu', 'email' => 'khadijah.shehu@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/23/021'],
                ['name' => 'Fatima Dahiru', 'email' => 'fatima.dahiru@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/23/022'],
                ['name' => 'Maryam Katsina', 'email' => 'maryam.katsina@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/23/023'],
                ['name' => 'Hauwa Lawal', 'email' => 'hauwa.lawal@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $nursingDept->id, 'prog' => $nursingProgram->id, 'matric' => 'ACONS/RN/NUR/23/024'],
            ],
            'ND1' => [
                ['name' => 'Kabiru Student', 'email' => 'ndnursingstudent@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/25/031'],
                ['name' => 'Mustapha Yusuf', 'email' => 'mustapha.yusuf@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/25/032'],
                ['name' => 'Usman Isa', 'email' => 'usman.isa@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/25/033'],
                ['name' => 'Zainab Jamilu', 'email' => 'zainab.jamilu@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/25/034'],
            ],
            'ND2' => [
                ['name' => 'Amadu Student', 'email' => 'ndstudent@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/24/041'],
                ['name' => 'Balarabe Sani', 'email' => 'balarabe.sani@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/24/042'],
                ['name' => 'Suleiman Aliyu', 'email' => 'suleiman.aliyu@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/24/043'],
                ['name' => 'Amina Dije', 'email' => 'amina.dije@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/ND/NDN/24/044'],
            ],
            'HND1' => [
                ['name' => 'Binta Student', 'email' => 'hndstudent@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/25/051'],
                ['name' => 'Rahma Abdullahi', 'email' => 'rahma.abdullahi@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/25/052'],
                ['name' => 'Aliyu Maiduguri', 'email' => 'aliyu.maiduguri@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/25/053'],
                ['name' => 'Nura Danbatta', 'email' => 'nura.danbatta@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/25/054'],
            ],
            'HND2' => [
                ['name' => 'Safiya Student', 'email' => 'hndnursingstudent@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/24/061'],
                ['name' => 'Nasiru Ringim', 'email' => 'nasiru.ringim@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/24/062'],
                ['name' => 'Farida Gwarzo', 'email' => 'farida.gwarzo@ameenatu.edu.ng', 'gender' => 'female', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/24/063'],
                ['name' => 'Ahmad Babura', 'email' => 'ahmad.babura@ameenatu.edu.ng', 'gender' => 'male', 'dept' => $ndDept->id, 'prog' => $ndProgram->id, 'matric' => 'ACONS/HND/NDN/24/064'],
            ]
        ];

        foreach ($studentsToSeed as $level => $studentsList) {
            foreach ($studentsList as $s) {
                $user = User::create([
                    'tenant_id' => $tenant->id,
                    'name' => $s['name'],
                    'email' => $s['email'],
                    'password' => Hash::make('password')
                ]);
                $user->assignRole('student');

                $studentModel = Student::create([
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                    'department_id' => $s['dept'],
                    'program_id' => $s['prog'],
                    'matriculation_number' => $s['matric'],
                    'current_level' => $level,
                    'status' => 'active',
                    'gender' => $s['gender'],
                    'date_of_birth' => '2005-01-01'
                ]);

                // Auto register for all courses at this level
                $levelCourses = $allCreatedCourses[$level] ?? [];
                foreach ($levelCourses as $cModel) {
                    CourseRegistration::create([
                        'tenant_id' => $tenant->id,
                        'student_id' => $studentModel->id,
                        'semester_id' => $semester->id,
                        'course_id' => $cModel->id,
                        'status' => 'approved'
                    ]);
                }
                
                // Let's also save the key students to variables so they don't break downstream invoice creation references!
                if ($s['email'] === 'student@ameenatu.edu.ng') {
                    $student = $studentModel;
                    $studentUser = $user;
                } elseif ($s['email'] === 'ndstudent@ameenatu.edu.ng') {
                    $ndStudent = $studentModel;
                    $ndStudentUser = $user;
                } elseif ($s['email'] === 'hndstudent@ameenatu.edu.ng') {
                    $hndStudent = $studentModel;
                    $hndStudentUser = $user;
                } elseif ($s['email'] === 'ndnursingstudent@ameenatu.edu.ng') {
                    $ndNursingStudent = $studentModel;
                    $ndNursingUser = $user;
                } elseif ($s['email'] === 'hndnursingstudent@ameenatu.edu.ng') {
                    $hndNursingStudent = $studentModel;
                    $hndNursingUser = $user;
                }
            }
        }

        $admissionOfficerUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Mr. Admission Officer',
            'email' => 'admissions@ameenatu.edu.ng',
            'password' => Hash::make('password')
        ]);
        $admissionOfficerUser->assignRole('admission_officer');

        $registrarUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Dr. Registrar Jones',
            'email' => 'registrar@ameenatu.edu.ng',
            'password' => Hash::make('password')
        ]);
        $registrarUser->assignRole('registrar');

        $bursarUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Alhaji Bursar',
            'email' => 'bursar@ameenatu.edu.ng',
            'password' => Hash::make('password')
        ]);
        $bursarUser->assignRole('bursar');

        // 10. ACONS Clinical & Academic Fees
        $tuitionFee = Fee::create([
            'tenant_id' => $tenant->id,
            'academic_session_id' => $session->id,
            'department_id' => $nursingDept->id,
            'level' => 'Basic Nursing Level 1',
            'name' => 'ACONS Tuition Fee',
            'amount' => 120000.00,
            'fee_type' => 'tuition'
        ]);

        $clinicalLevy = Fee::create([
            'tenant_id' => $tenant->id,
            'academic_session_id' => $session->id,
            'department_id' => $nursingDept->id,
            'level' => 'Basic Nursing Level 1',
            'name' => 'Clinical Simulation Practice Levy',
            'amount' => 30000.00,
            'fee_type' => 'departmental'
        ]);

        // Midwifery specific fee
        Fee::create([
            'tenant_id' => $tenant->id,
            'academic_session_id' => $session->id,
            'department_id' => $midwiferyDept->id,
            'level' => 'Basic Nursing Level 1',
            'name' => 'Midwifery Professional Training Levy',
            'amount' => 25000.00,
            'fee_type' => 'departmental'
        ]);

        // ND Tuition Fee
        $ndTuitionFee = Fee::create([
            'tenant_id' => $tenant->id,
            'academic_session_id' => $session->id,
            'department_id' => $ndDept->id,
            'level' => 'ND2',
            'name' => 'ND Nursing Track Tuition Fee',
            'amount' => 110000.00,
            'fee_type' => 'tuition'
        ]);

        // Invoice Student for ACONS General Tuition
        $invoice = StudentInvoice::create([
            'tenant_id' => $tenant->id,
            'student_id' => $student->id,
            'fee_id' => $tuitionFee->id,
            'amount_due' => 120000.00,
            'amount_paid' => 120000.00,
            'status' => 'paid'
        ]);

        // Invoice ND Student
        $ndInvoice = StudentInvoice::create([
            'tenant_id' => $tenant->id,
            'student_id' => $ndStudent->id,
            'fee_id' => $ndTuitionFee->id,
            'amount_due' => 110000.00,
            'amount_paid' => 110000.00,
            'status' => 'paid'
        ]);

        Payment::create([
            'tenant_id' => $tenant->id,
            'student_invoice_id' => $ndInvoice->id,
            'amount' => 110000.00,
            'reference' => 'ACONS_PAY_ND_'.Str::random(10),
            'payment_gateway' => 'remita',
            'status' => 'successful'
        ]);


        Payment::create([
            'tenant_id' => $tenant->id,
            'student_invoice_id' => $invoice->id,
            'amount' => 120000.00,
            'reference' => 'ACONS_PAY_'.Str::random(10),
            'payment_gateway' => 'remita',
            'status' => 'successful'
        ]);

        // Create default AdmissionForm for ACONS
        $admissionForm = \App\Models\AdmissionForm::create([
            'tenant_id' => $tenant->id,
            'title' => 'General Admission Form',
            'description' => 'Admissions application for Nursing and Midwifery programs.',
            'fields' => [
                ['name' => 'jamb_number', 'type' => 'text', 'required' => true],
                ['name' => 'phone', 'type' => 'text', 'required' => true]
            ],
            'is_active' => true,
            'admission_year' => '2025',
            'academic_session_id' => $session->id,
            'nursing_limit' => 100,
            'midwifery_limit' => 100,
            'opening_date' => '2025-09-01',
            'closing_date' => '2026-08-31',
            'default_clearance_schedule' => 'Mondays and Tuesdays between 10am and 2pm at the HOD\'s Office (starting May 25th).'
        ]);

        // 11. Seed Applicant "Nafisa Lawan" exactly as in the physical form pictures!
        $applicant = Applicant::create([
            'tenant_id' => $tenant->id,
            'jamb_number' => '2510283168AH',
            'password' => Hash::make('08036894451'), // Phone number as password
            
            // Personal Details
            'full_name' => 'Nafisa Lawan',
            'dob' => '2007-01-21',
            'place_of_birth' => 'Kanya Babba',
            'lga' => 'Babura',
            'state_of_origin' => 'Jigawa',
            'nationality' => 'Nigeria',
            'email' => 'nafisa@gmail.com',
            'contact_address' => 'Kanya Kofar Fada House No: 05',
            'phone_number' => '08036894451',
            'sex' => 'Female',
            'next_of_kin_name' => 'Malam Nafisatu Ibrahim Hashim Kanya',
            'next_of_kin_address' => 'Kanya Kofar Fada House No: 05',
            'physical_disabilities' => 'None',
            'highest_qualification' => 'None',
            'jamb_score' => 152,

            // Schools
            'primary_school_name' => 'Kanya Primary School',
            'primary_school_from' => '2013',
            'primary_school_to' => '2019',
            'secondary_school_name' => 'Government Girls Secondary School Babura',
            'secondary_school_from' => '2019',
            'secondary_school_to' => '2025',

            // O'Level Sitting 1 (NECO 2025)
            'first_sitting_type' => 'NECO',
            'first_sitting_year' => '2025',
            'first_sitting_no' => '2510283168AH',
            'first_sitting_grades' => [
                ['subject' => 'English Language', 'grade' => 'C6'],
                ['subject' => 'Mathematics', 'grade' => 'B3'],
                ['subject' => 'Civic Education', 'grade' => 'C6'],
                ['subject' => 'Biology', 'grade' => 'C6'],
                ['subject' => 'Chemistry', 'grade' => 'D7'],
                ['subject' => 'Physics', 'grade' => 'C5'],
                ['subject' => 'Computer Studies', 'grade' => 'B3'],
                ['subject' => 'Islamic Studies', 'grade' => 'C5'],
                ['subject' => 'Catering Craft Practice', 'grade' => 'C4'],
            ],

            'parent_name' => 'Hon. Ibrahim Hashim Kanya Babba',
            'parent_address' => 'Kanya Babba Kofar Fada House No: 05',
            'parent_phone' => '08036894451',
            'sponsor_name_address' => 'Hon. Ibrahim Hashim Kanya Kofar Fada House No: 05',

            'payment_status' => 'paid',
            'payment_reference' => 'ACON_ADM_REMITA8934',
            'amount_paid' => 14700.00,
            'admission_status' => 'pending',
            'admitted_program_id' => null
        ]);

        \App\Models\AdmissionApplication::create([
            'tenant_id' => $tenant->id,
            'admission_form_id' => $admissionForm->id,
            'applicant_name' => $applicant->full_name,
            'applicant_email' => $applicant->email,
            'status' => 'pending',
            'data' => [
                'jamb_number' => $applicant->jamb_number,
                'phone_number' => $applicant->phone_number,
                'jamb_score' => $applicant->jamb_score,
                'state_of_origin' => $applicant->state_of_origin,
                'lga' => $applicant->lga,
                'gender' => $applicant->sex,
                'date_of_birth' => '2007-01-21',
                'first_sitting_type' => $applicant->first_sitting_type,
                'first_sitting_no' => $applicant->first_sitting_no,
                'first_sitting_grades' => $applicant->first_sitting_grades
            ]
        ]);

        $pendingApplicantsData = [
            [
                'jamb_number' => '25489012AA',
                'full_name' => 'Fatima Yusuf',
                'phone_number' => '08031112222',
                'email' => 'fatima.yusuf@gmail.com',
                'jamb_score' => 180,
                'program_id' => $nursingProgram->id,
            ],
            [
                'jamb_number' => '25983471BB',
                'full_name' => 'Maryam Aliyu',
                'phone_number' => '08032223333',
                'email' => 'maryam.aliyu@gmail.com',
                'jamb_score' => 165,
                'program_id' => $midwiferyProgram->id,
            ],
            [
                'jamb_number' => '25123456CC',
                'full_name' => 'Abubakar Sani',
                'phone_number' => '08033334444',
                'email' => 'abubakar.sani@gmail.com',
                'jamb_score' => 172,
                'program_id' => $ndProgram->id,
            ],
            [
                'jamb_number' => '25678901DD',
                'full_name' => 'Zainab Umar',
                'phone_number' => '08034445555',
                'email' => 'zainab.umar@gmail.com',
                'jamb_score' => 190,
                'program_id' => $nursingProgram->id,
            ],
            [
                'jamb_number' => '25876543EE',
                'full_name' => 'Aisha Bello',
                'phone_number' => '08035556666',
                'email' => 'aisha.bello@gmail.com',
                'jamb_score' => 155,
                'program_id' => $midwiferyProgram->id,
            ],
            [
                'jamb_number' => '25543210FF',
                'full_name' => 'Ibrahim Katsina',
                'phone_number' => '08036667777',
                'email' => 'ibrahim.katsina@gmail.com',
                'jamb_score' => 148,
                'program_id' => $ndProgram->id,
            ],
            [
                'jamb_number' => '25679802GG',
                'full_name' => 'Usman Babura',
                'phone_number' => '08037778888',
                'email' => 'usman.babura@gmail.com',
                'jamb_score' => 162,
                'program_id' => $nursingProgram->id,
            ],
            [
                'jamb_number' => '25439811HH',
                'full_name' => 'Khadija Ringim',
                'phone_number' => '08038889999',
                'email' => 'khadija.ringim@gmail.com',
                'jamb_score' => 175,
                'program_id' => $nursingProgram->id,
            ],
            [
                'jamb_number' => '25112233II',
                'full_name' => 'Amina Jigawa',
                'phone_number' => '08039990000',
                'email' => 'amina.jigawa@gmail.com',
                'jamb_score' => 158,
                'program_id' => $midwiferyProgram->id,
            ],
            [
                'jamb_number' => '25445566JJ',
                'full_name' => 'Kabiru Kanya',
                'phone_number' => '08031122334',
                'email' => 'kabiru.kanya@gmail.com',
                'jamb_score' => 167,
                'program_id' => $ndProgram->id,
            ],
            [
                'jamb_number' => '25778899KK',
                'full_name' => 'Balarabe Gumel',
                'phone_number' => '08032233445',
                'email' => 'balarabe.gumel@gmail.com',
                'jamb_score' => 182,
                'program_id' => $nursingProgram->id,
            ],
            [
                'jamb_number' => '25990011LL',
                'full_name' => 'Rahma Birnin Kudu',
                'phone_number' => '08033344556',
                'email' => 'rahma.bk@gmail.com',
                'jamb_score' => 195,
                'program_id' => $nursingProgram->id,
            ],
            [
                'jamb_number' => '25121314MM',
                'full_name' => 'Suleiman Hadejia',
                'phone_number' => '08034455667',
                'email' => 'suleiman.hadejia@gmail.com',
                'jamb_score' => 153,
                'program_id' => $midwiferyProgram->id,
            ],
            [
                'jamb_number' => '25151617NN',
                'full_name' => 'Nasiru Madori',
                'phone_number' => '08035566778',
                'email' => 'nasiru.madori@gmail.com',
                'jamb_score' => 149,
                'program_id' => $ndProgram->id,
            ],
            [
                'jamb_number' => '25181920OO',
                'full_name' => 'Yusuf Garki',
                'phone_number' => '08036677889',
                'email' => 'yusuf.garki@gmail.com',
                'jamb_score' => 161,
                'program_id' => $nursingProgram->id,
            ]
        ];

        foreach ($pendingApplicantsData as $data) {
            $appModel = Applicant::create([
                'tenant_id' => $tenant->id,
                'jamb_number' => $data['jamb_number'],
                'password' => Hash::make($data['phone_number']),
                'full_name' => $data['full_name'],
                'phone_number' => $data['phone_number'],
                'email' => $data['email'],
                'jamb_score' => $data['jamb_score'],
                'dob' => '2007-04-12',
                'place_of_birth' => 'Kano',
                'lga' => 'Nassarawa',
                'state_of_origin' => 'Kano',
                'nationality' => 'Nigeria',
                'contact_address' => 'No 12 Airport Road Kano',
                'sex' => 'Female',
                'next_of_kin_name' => 'Malam Yusuf Aliyu',
                'next_of_kin_address' => 'No 12 Airport Road Kano',
                'physical_disabilities' => 'None',
                'highest_qualification' => 'None',
                'primary_school_name' => 'Kano Model Primary School',
                'primary_school_from' => '2013',
                'primary_school_to' => '2019',
                'secondary_school_name' => 'Kano Science Secondary School',
                'secondary_school_from' => '2019',
                'secondary_school_to' => '2025',
                'first_sitting_type' => 'WAEC',
                'first_sitting_year' => '2025',
                'first_sitting_no' => $data['jamb_number'],
                'first_sitting_grades' => [
                    ['subject' => 'English Language', 'grade' => 'C5'],
                    ['subject' => 'Mathematics', 'grade' => 'B2'],
                    ['subject' => 'Biology', 'grade' => 'C4'],
                    ['subject' => 'Chemistry', 'grade' => 'C5'],
                    ['subject' => 'Physics', 'grade' => 'B3'],
                ],
                'parent_name' => 'Alhaji Yusuf Aliyu',
                'parent_address' => 'No 12 Airport Road Kano',
                'parent_phone' => $data['phone_number'],
                'sponsor_name_address' => 'Alhaji Yusuf Aliyu',
                'payment_status' => 'paid',
                'payment_reference' => 'ACON_ADM_' . Str::random(8),
                'amount_paid' => 14700.00,
                'admission_status' => 'pending'
            ]);

            \App\Models\AdmissionApplication::create([
                'tenant_id' => $tenant->id,
                'admission_form_id' => $admissionForm->id,
                'applicant_name' => $appModel->full_name,
                'applicant_email' => $appModel->email,
                'status' => 'pending',
                'data' => [
                    'jamb_number' => $appModel->jamb_number,
                    'phone_number' => $appModel->phone_number,
                    'jamb_score' => $appModel->jamb_score,
                    'state_of_origin' => $appModel->state_of_origin,
                    'lga' => $appModel->lga,
                    'gender' => $appModel->sex,
                    'first_sitting_type' => $appModel->first_sitting_type,
                    'first_sitting_no' => $appModel->first_sitting_no,
                    'first_sitting_grades' => $appModel->first_sitting_grades
                ]
            ]);
        }

        $this->command->info("Seeded School: {$tenant->name} (Subdomain: {$tenant->subdomain})");
        $this->command->info(" -> Provost: {$provostUser->email} / password");
        $this->command->info(" -> HOD: {$hodUser->email} / password");
        $this->command->info(" -> Lecturer: {$lecturerUser->email} / password");
        $this->command->info(" -> Student (Basic Nursing): {$studentUser->email} / password");
        $this->command->info(" -> Student (ND): {$ndStudentUser->email} / password");
        $this->command->info(" -> Student (HND): {$hndStudentUser->email} / password");
        $this->command->info(" -> Student (ND Nursing): {$ndNursingUser->email} / password");
        $this->command->info(" -> Student (HND Nursing): {$hndNursingUser->email} / password");
        $this->command->info(" -> Registrar: {$registrarUser->email} / password");
        $this->command->info(" -> Admissions Officer: {$admissionOfficerUser->email} / password");
        $this->command->info(" -> Bursar: {$bursarUser->email} / password");
        $this->command->info(" -> Test Applicant (Pending): {$applicant->jamb_number} / {$applicant->phone_number} (Nafisa Lawan)");
        $this->command->info(" -> Pending Applicants seeded: " . count($pendingApplicantsData));
    }
}
