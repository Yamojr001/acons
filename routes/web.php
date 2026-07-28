<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PublicAdmissionController;
use App\Http\Controllers\PublicApplicantController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|─── WEBHOOKS (no auth/csrf) ──────────────────────────────────────────────
*/
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    Route::post('/stripe', [WebhookController::class, 'stripe'])->name('stripe');
    Route::post('/paystack', [WebhookController::class, 'paystack'])->name('paystack');
    Route::post('/monnify', [WebhookController::class, 'monnify'])->name('monnify');
    Route::post('/zainpay', [WebhookController::class, 'zainpay'])->name('zainpay');
});

/*
|─── PUBLIC (no auth required) ──────────────────────────────────────────────
*/
Route::middleware(['identify.tenant'])->group(function () {
    Route::get('/', [LandingController::class, 'index'])->name('landing');

    // Auth
    Route::get('/login',  [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
    Route::post('/logout',[AuthController::class, 'logout'])->name('logout');

    // Password Reset
    Route::get('/forgot-password',         [AuthController::class, 'showForgot'])->name('password.request');
    Route::post('/forgot-password',        [AuthController::class, 'sendReset'])->name('password.email');
    Route::get('/reset-password/{token}',  [AuthController::class, 'showReset'])->name('password.reset');
    Route::post('/reset-password',         [AuthController::class, 'resetPassword'])->name('password.update');

    // Public Admissions Application
    Route::get('/admissions/apply/{form}', [PublicAdmissionController::class, 'show'])->name('public.admission.form');
    Route::post('/admissions/apply/{form}',[PublicAdmissionController::class, 'submit'])->name('public.admission.submit');

    // ACONS Dedicated Applicant Portal
    Route::get('/admissions/apply',               [PublicApplicantController::class, 'showApplyForm'])->name('admissions.apply');
    Route::post('/admissions/apply',              [PublicApplicantController::class, 'submitApplyForm'])->name('admissions.apply.submit');
    Route::get('/admissions/pay/{applicant}',     [PublicApplicantController::class, 'showPaymentPage'])->name('admissions.pay');
    Route::post('/admissions/pay/zainpay/init/{applicant}', [PublicApplicantController::class, 'zainpayInit'])->name('admissions.pay.zainpay.init');
    Route::get('/admissions/pay/zainpay/verify/{applicant}', [PublicApplicantController::class, 'zainpayVerify'])->name('admissions.pay.verify');
    Route::post('/admissions/pay/authorize/{applicant}', [PublicApplicantController::class, 'authorizePayment'])->name('admissions.pay.authorize');
    Route::get('/admissions/login',               [PublicApplicantController::class, 'showLoginForm'])->name('admissions.login');
    Route::post('/admissions/login',              [PublicApplicantController::class, 'login'])->name('admissions.login.submit');

    Route::middleware(['auth:applicant'])->group(function () {
        Route::get('/admissions/status',  [PublicApplicantController::class, 'dashboard'])->name('admissions.dashboard');
        Route::post('/admissions/logout', [PublicApplicantController::class, 'logout'])->name('admissions.logout');
    });
});

/*
|─── AUTHENTICATED ROUTES ────────────────────────────────────────────────────
*/
Route::middleware(['identify.tenant', 'auth', 'tenant.access'])->group(function () {

    /*
    |── STUDENT ─────────────────────────────────────────────────────────────
    */
    Route::middleware(['role:student', 'force.password.change'])
        ->prefix('student')->name('student.')->group(function () {
        Route::get('/dashboard',          [\App\Http\Controllers\Student\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/course-registration',[\App\Http\Controllers\Student\CourseRegistrationController::class, 'index'])->name('course-registration');
        Route::post('/course-registration',[\App\Http\Controllers\Student\CourseRegistrationController::class, 'store'])->name('course-registration.store');
        Route::get('/fees',               [\App\Http\Controllers\Student\PaymentController::class, 'index'])->name('fees');
        Route::get('/registration',       [\App\Http\Controllers\Student\RegistrationController::class, 'index'])->name('registration');
        Route::post('/payments/initialize/{invoice}', [\App\Http\Controllers\Student\PaymentController::class, 'initialize'])->name('payments.initialize');
        Route::match(['get', 'post'], '/payments/verify/{reference}',   [\App\Http\Controllers\Student\PaymentController::class, 'verify'])->name('payments.verify');
        Route::get('/results',            [\App\Http\Controllers\Student\ResultController::class, 'index'])->name('results');
        Route::get('/announcements',      [\App\Http\Controllers\Student\AnnouncementController::class, 'index'])->name('announcements');
        Route::get('/profile',            [\App\Http\Controllers\Student\ProfileController::class, 'edit'])->name('profile');
        Route::get('/force-password-change',  [\App\Http\Controllers\Student\PasswordResetController::class, 'showForceChange'])->name('password.force');
        Route::post('/force-password-change', [\App\Http\Controllers\Student\PasswordResetController::class, 'postForceChange'])->name('password.force.post');
    });

    /*
    |── LECTURER ────────────────────────────────────────────────────────────
    */
    Route::middleware(['role:lecturer'])
        ->prefix('lecturer')->name('lecturer.')->group(function () {
        Route::get('/dashboard',              [\App\Http\Controllers\University\DashboardController::class, 'lecturer'])->name('dashboard');
        Route::get('/my-courses',             [\App\Http\Controllers\Lecturer\CourseController::class, 'index'])->name('my-courses');
        Route::get('/grades',                 [\App\Http\Controllers\Lecturer\ResultProcessingController::class, 'index'])->name('grades.index');
        Route::get('/courses/{course}/grades',[\App\Http\Controllers\Lecturer\ResultProcessingController::class, 'index'])->name('grades.show');
        Route::post('/courses/{course}/grades',[\App\Http\Controllers\Lecturer\ResultProcessingController::class, 'store'])->name('grades.store');
        Route::post('/courses/{course}/grades/submit',[\App\Http\Controllers\Lecturer\ResultProcessingController::class, 'submit'])->name('grades.submit');
        Route::get('/announcements',          [\App\Http\Controllers\Lecturer\AnnouncementController::class, 'index'])->name('announcements');
        Route::post('/announcements',         [\App\Http\Controllers\Lecturer\AnnouncementController::class, 'store'])->name('announcements.store');
        Route::get('/profile',                [\App\Http\Controllers\Lecturer\ProfileController::class, 'edit'])->name('profile');
    });

    /*
    |── HOD ─────────────────────────────────────────────────────────────────
    */
    Route::middleware(['role:hod'])
        ->prefix('hod')->name('hod.')->group(function () {
        Route::get('/dashboard',                        [\App\Http\Controllers\HOD\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/clearance',                        [\App\Http\Controllers\HOD\DashboardController::class, 'clearanceList'])->name('clearance.index');
        Route::post('/clearance/{application}/approve', [\App\Http\Controllers\HOD\DashboardController::class, 'clearanceApprove'])->name('clearance.approve');
        Route::post('/clearance/{application}/reject',  [\App\Http\Controllers\HOD\DashboardController::class, 'clearanceReject'])->name('clearance.reject');
        Route::get('/lecturers',                        [\App\Http\Controllers\HOD\DashboardController::class, 'lecturers'])->name('lecturers');
        Route::post('/lecturers',                       [\App\Http\Controllers\HOD\DashboardController::class, 'storeLecturer'])->name('lecturers.store');
        Route::post('/lecturers/{lecturer}/update',     [\App\Http\Controllers\HOD\DashboardController::class, 'updateLecturer'])->name('lecturers.update');
        Route::post('/lecturers/{lecturer}/status',     [\App\Http\Controllers\HOD\DashboardController::class, 'toggleLecturerStatus'])->name('lecturers.status');
        Route::get('/students',                         [\App\Http\Controllers\HOD\DashboardController::class, 'students'])->name('students');
        Route::get('/courses',                          [\App\Http\Controllers\HOD\HODCourseController::class, 'index'])->name('courses.index');
        Route::post('/courses',                         [\App\Http\Controllers\HOD\HODCourseController::class, 'store'])->name('courses.store');
        Route::post('/courses/{course}/update',         [\App\Http\Controllers\HOD\HODCourseController::class, 'update'])->name('courses.update');
        Route::post('/courses/{course}/assign',         [\App\Http\Controllers\HOD\HODCourseController::class, 'assignLecturer'])->name('courses.assign');
        Route::delete('/courses/{course}',              [\App\Http\Controllers\HOD\HODCourseController::class, 'destroy'])->name('courses.destroy');
        Route::get('/results',                          [\App\Http\Controllers\HOD\HODResultController::class, 'index'])->name('results.index');
        Route::post('/results/approve',                 [\App\Http\Controllers\HOD\HODResultController::class, 'approve'])->name('results.approve');
        Route::post('/results/reject',                  [\App\Http\Controllers\HOD\HODResultController::class, 'reject'])->name('results.reject');
    });

    /*
    |── REGISTRAR ───────────────────────────────────────────────────────────
    */
    Route::middleware(['role:registrar'])
        ->prefix('registrar')->name('registrar.')->group(function () {
        Route::get('/dashboard',                    [\App\Http\Controllers\Registrar\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/students/export/{format}',     [\App\Http\Controllers\Registrar\StudentController::class, 'export'])->name('students.export');
        Route::resource('students',                 \App\Http\Controllers\Registrar\StudentController::class);
        Route::get('/lecturers',                    [\App\Http\Controllers\Registrar\DashboardController::class, 'lecturers'])->name('lecturers');
        Route::post('/lecturers',                   [\App\Http\Controllers\Registrar\LecturerController::class, 'store'])->name('lecturers.store');
        Route::put('/lecturers/{lecturer}',         [\App\Http\Controllers\Registrar\LecturerController::class, 'update'])->name('lecturers.update');
        Route::post('/lecturers/{lecturer}/toggle', [\App\Http\Controllers\Registrar\LecturerController::class, 'toggleStatus'])->name('lecturers.toggle');
        Route::get('/lecturers/export/{format}',    [\App\Http\Controllers\Registrar\LecturerController::class, 'export'])->name('lecturers.export');
        Route::post('/lecturers/{user}/role',       [\App\Http\Controllers\Registrar\LecturerController::class, 'changeRole'])->name('lecturers.role');
        Route::get('/calendar',                     [\App\Http\Controllers\Registrar\DashboardController::class, 'calendar'])->name('calendar');
        Route::post('/calendar',                    [\App\Http\Controllers\Registrar\DashboardController::class, 'storeSession'])->name('calendar.store');
        Route::post('/calendar/{session}',          [\App\Http\Controllers\Registrar\DashboardController::class, 'updateSession'])->name('calendar.update');
        Route::get('/faculties',                    [\App\Http\Controllers\Registrar\DashboardController::class, 'faculties'])->name('faculties');
        Route::post('/departments',                 [\App\Http\Controllers\Registrar\DashboardController::class, 'storeDepartment'])->name('departments.store');
        Route::get('/admissions',                   [\App\Http\Controllers\Registrar\DashboardController::class, 'admissions'])->name('admissions');
        Route::get('/admissions/export',            [\App\Http\Controllers\Registrar\DashboardController::class, 'exportAdmissions'])->name('admissions.export');
        Route::post('/admissions/direct',           [\App\Http\Controllers\Registrar\DashboardController::class, 'storeDirectAdmission'])->name('admissions.direct');
        Route::post('/admissions/{application}/admit',  [\App\Http\Controllers\Registrar\DashboardController::class, 'postAdmit'])->name('admissions.admit');
        Route::post('/admissions/{application}/reject', [\App\Http\Controllers\Registrar\DashboardController::class, 'postReject'])->name('admissions.reject');
        Route::get('/announcements',                [\App\Http\Controllers\Registrar\DashboardController::class, 'announcements'])->name('announcements');
        Route::post('/announcements',               [\App\Http\Controllers\Registrar\DashboardController::class, 'storeAnnouncement'])->name('announcements.store');
        // Registrar can VIEW results but NOT release — provost only
        Route::get('/results',                      [\App\Http\Controllers\Registrar\DashboardController::class, 'results'])->name('results');
    });

    /*
    |── PROVOST ─────────────────────────────────────────────────────────────
    | Full school oversight + exclusive result release authority
    */
    Route::middleware(['role:provost'])
        ->prefix('provost')->name('provost.')->group(function () {
        Route::get('/dashboard',                    [\App\Http\Controllers\Provost\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/results',                      [\App\Http\Controllers\Provost\DashboardController::class, 'results'])->name('results');

        // Result release (provost-exclusive)
        Route::post('/results/release-all',         [\App\Http\Controllers\Provost\DashboardController::class, 'releaseAll'])->name('results.release_all');
        Route::post('/results/{course}/release',    [\App\Http\Controllers\Provost\DashboardController::class, 'releaseCourse'])->name('results.release_course');
        Route::post('/results/{course}/reject',     [\App\Http\Controllers\Provost\DashboardController::class, 'rejectCourse'])->name('results.reject');

        // Provost has read access to registrar views
        Route::get('/registrar/dashboard',          [\App\Http\Controllers\Registrar\DashboardController::class, 'index'])->name('registrar.dashboard');
        Route::get('/registrar/students',           [\App\Http\Controllers\Registrar\StudentController::class, 'index'])->name('registrar.students');
        Route::get('/registrar/students/export/{format}', [\App\Http\Controllers\Registrar\StudentController::class, 'export'])->name('registrar.students.export');
        Route::get('/registrar/students/{student}', [\App\Http\Controllers\Registrar\StudentController::class, 'show'])->name('registrar.students.show');
        Route::get('/registrar/lecturers',          [\App\Http\Controllers\Registrar\DashboardController::class, 'lecturers'])->name('registrar.lecturers');
        Route::get('/registrar/admissions',         [\App\Http\Controllers\Registrar\DashboardController::class, 'admissions'])->name('registrar.admissions');
        Route::get('/registrar/faculties',          [\App\Http\Controllers\Registrar\DashboardController::class, 'faculties'])->name('registrar.faculties');
        Route::get('/registrar/calendar',           [\App\Http\Controllers\Registrar\DashboardController::class, 'calendar'])->name('registrar.calendar');

        // Provost has read access to bursar views
        Route::get('/bursary/dashboard',            [\App\Http\Controllers\Bursar\DashboardController::class, 'index'])->name('bursar.dashboard');
        Route::get('/bursary/payments',             [\App\Http\Controllers\Bursar\DashboardController::class, 'payments'])->name('bursar.payments');
        Route::get('/bursary/fees',                 [\App\Http\Controllers\Bursar\DashboardController::class, 'fees'])->name('bursar.fees');
        Route::get('/bursary/reports',              [\App\Http\Controllers\Bursar\DashboardController::class, 'reports'])->name('bursar.reports');

        // Announcements
        Route::get('/announcements',                [\App\Http\Controllers\Provost\DashboardController::class, 'announcements'])->name('announcements');
        Route::post('/announcements',               [\App\Http\Controllers\Provost\DashboardController::class, 'storeAnnouncement'])->name('announcements.store');
    });

    /*
    |── BURSAR ──────────────────────────────────────────────────────────────
    */
    Route::middleware(['role:bursar'])
        ->prefix('bursary')->name('bursar.')->group(function () {
        Route::get('/dashboard',                    [\App\Http\Controllers\Bursar\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/fees',                         [\App\Http\Controllers\Bursar\DashboardController::class, 'fees'])->name('fees');
        Route::post('/fees',                        [\App\Http\Controllers\Bursar\DashboardController::class, 'storeFee'])->name('fees.store');
        Route::post('/fees/{fee}/update',           [\App\Http\Controllers\Bursar\DashboardController::class, 'updateFee'])->name('fees.update');
        Route::delete('/fees/{fee}',                [\App\Http\Controllers\Bursar\DashboardController::class, 'deleteFee'])->name('fees.delete');
        Route::get('/payments',                     [\App\Http\Controllers\Bursar\DashboardController::class, 'payments'])->name('payments');
        Route::post('/payments/manual',             [\App\Http\Controllers\Bursar\DashboardController::class, 'storePayment'])->name('payments.store');
        Route::post('/payments/{payment}/update',   [\App\Http\Controllers\Bursar\DashboardController::class, 'updatePayment'])->name('payments.update');
        Route::delete('/payments/{payment}',        [\App\Http\Controllers\Bursar\DashboardController::class, 'deletePayment'])->name('payments.delete');
        Route::get('/payments/export/{format}',     [\App\Http\Controllers\Bursar\DashboardController::class, 'exportPayments'])->name('payments.export');
        Route::get('/expenses',                     [\App\Http\Controllers\Bursar\ExpenseController::class, 'index'])->name('expenses.index');
        Route::post('/expenses',                    [\App\Http\Controllers\Bursar\ExpenseController::class, 'store'])->name('expenses.store');
        Route::get('/reports',                      [\App\Http\Controllers\Bursar\DashboardController::class, 'reports'])->name('reports');
        Route::get('/announcements',                [\App\Http\Controllers\Bursar\DashboardController::class, 'announcements'])->name('announcements');
        Route::post('/announcements',               [\App\Http\Controllers\Bursar\DashboardController::class, 'storeAnnouncement'])->name('announcements.store');
    });

    /*
    |── ADMISSION OFFICER ───────────────────────────────────────────────────
    */
    Route::middleware(['role:admission_officer'])
        ->prefix('admissions')->name('admission_officer.')->group(function () {
        Route::get('/dashboard',                    [\App\Http\Controllers\AdmissionOfficer\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/manage',                       [\App\Http\Controllers\Registrar\DashboardController::class, 'admissions'])->name('manage');
        Route::get('/manage/export',                [\App\Http\Controllers\Registrar\DashboardController::class, 'exportAdmissions'])->name('export');
        Route::post('/manage/{application}/admit',  [\App\Http\Controllers\Registrar\DashboardController::class, 'postAdmit'])->name('admit');
        Route::post('/manage/{application}/reject', [\App\Http\Controllers\Registrar\DashboardController::class, 'postReject'])->name('reject');
        Route::post('/manage/direct',               [\App\Http\Controllers\Registrar\DashboardController::class, 'storeDirectAdmission'])->name('direct');
        Route::get('/open',                         [\App\Http\Controllers\AdmissionOfficer\AdmissionController::class, 'showOpenAdmission'])->name('open.index');
        Route::post('/open/{form}',                 [\App\Http\Controllers\AdmissionOfficer\AdmissionController::class, 'updateOpenAdmission'])->name('open.update');
        Route::get('/applicants',                   [\App\Http\Controllers\Registrar\DashboardController::class, 'admissions'])->name('applicants');
        Route::get('/admitted',                     [\App\Http\Controllers\AdmissionOfficer\AdmissionController::class, 'admittedList'])->name('admitted');
        Route::get('/announcements',                [\App\Http\Controllers\AdmissionOfficer\AdmissionController::class, 'announcementsIndex'])->name('announcements.index');
        Route::post('/announcements',               [\App\Http\Controllers\AdmissionOfficer\AdmissionController::class, 'announcementsStore'])->name('announcements.store');
    });

    /*
    |── EXAM OFFICER ────────────────────────────────────────────────────────
    */
    Route::middleware(['role:exam_officer'])
        ->prefix('exam-office')->name('exam_officer.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\ExamOfficer\DashboardController::class, 'index'])->name('dashboard');
    });

    /*
    |── SCHOOL ADMIN ────────────────────────────────────────────────────────
    */
    Route::middleware(['role:school_admin'])
        ->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\School\DashboardController::class, 'index'])->name('dashboard');
    });

    /*
    |── SUPER ADMIN (system diagnostics only — single-institution deployment) ─
    */
    Route::middleware(['role:super_admin'])
        ->prefix('superadmin')->name('superadmin.')->group(function () {
        Route::get('/system-health', [\App\Http\Controllers\SuperAdmin\SystemHealthController::class, 'index'])->name('system-health');
    });

    /*
    |── GLOBAL PROFILE & SETTINGS ───────────────────────────────────────────
    */
    Route::get('/profile',  [\App\Http\Controllers\Common\ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [\App\Http\Controllers\Common\ProfileController::class, 'update'])->name('profile.update');
    Route::get('/settings', [\App\Http\Controllers\Common\SettingsController::class, 'edit'])->name('settings.edit');
    Route::post('/settings',[\App\Http\Controllers\Common\SettingsController::class, 'update'])->name('settings.update');
});
