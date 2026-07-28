# Ameenatu College of Nursing Sciences (ACONS) — Portal

**Single-Institution Academic Management System**
> Laravel 11 · React 19 · Inertia.js · MySQL 8 · Zainpay · Framer Motion

This system is built exclusively for Ameenatu College of Nursing Sciences (ACONS). It is a
single-institution deployment — there is no multi-school signup, subdomain routing, or
billing/plan management. The application always resolves to the one ACONS tenant record
in the database (see `App\Services\TenantResolver`).

---

## 🚀 Quick Start — Local Development

### Prerequisites
- PHP 8.3+ · Composer 2.x · Node.js 20+ · MySQL 8.0 · Redis (optional, for queue/cache)

### 1. Install
```bash
git clone <your-repo> acons && cd acons
composer install
npm install
cp .env.example .env
php artisan key:generate
```

### 2. Configure .env
```env
APP_ENV=local
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_DATABASE=acons
DB_USERNAME=root
DB_PASSWORD=your_password
QUEUE_CONNECTION=database
```

### 3. Database
```bash
mysql -u root -p -e "CREATE DATABASE acons CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed
```

### 4. Start
```bash
php artisan serve          # Terminal 1 — Laravel on :8000
npm run dev                # Terminal 2 — Vite hot reload
php artisan queue:work     # Terminal 3 — Job queue
```

### 5. Access the Portal
No subdomain or `/etc/hosts` entry is required — the app always serves the ACONS tenant.
Visit: **http://localhost:8000**

---

## 🎓 Portals & Roles

| Role | Portal | Notes |
|------|--------|-------|
| Super Admin | `/superadmin/system-health` | System diagnostics only — no school/billing management |
| Provost | `/provost/dashboard` | Institution-wide oversight, results sign-off, announcements |
| Registrar | `/registrar/dashboard` | Admissions, student records, staff (lecturer) management |
| Bursar | `/bursary/dashboard` | Fee schedules, payments, financial reports |
| HOD | `/hod/dashboard` | Department oversight, staff & clearance approvals |
| Lecturer | `/lecturer/dashboard` | Attendance, grade entry, course/class management |
| Admission Officer | `/admissions/dashboard` | Applicant review & admission processing |
| Student | `/student/dashboard` | Results, fees, registration, course enrolment |
| School Admin | `/admin/dashboard` | Legacy generic admin surface |

---

## 🏗️ Project Structure (high level)

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/AuthController.php
│   │   ├── SuperAdmin/SystemHealthController.php
│   │   ├── Provost/, Registrar/, Bursar/, HOD/, Lecturer/, Student/
│   │   ├── School/         ← legacy generic admin controllers
│   │   ├── LandingController.php
│   │   └── WebhookController.php
│   └── Middleware/
│       ├── IdentifyTenant.php      ← always resolves the single ACONS tenant
│       ├── EnsureTenantAccess.php
│       ├── RoleMiddleware.php
│       └── HandleInertiaRequests.php
├── Models/                 ← Eloquent models (Tenant, Student, Program, Department...)
└── Services/
    ├── PaymentService.php  ← Zainpay integration
    └── TenantResolver.php  ← always resolves the ACONS tenant record

resources/js/
├── app.tsx                 ← Inertia entry point
├── Components/UI/          ← Button, Card, Badge, Avatar, NairaIcon, StatCard...
├── Layouts/
│   ├── AppLayout.tsx       ← Role-based sidebar + topbar (institutional email/branding)
│   └── GuestLayout.tsx
└── Pages/
    ├── Auth/, Landing/
    ├── SuperAdmin/SystemHealth.tsx
    ├── Provost/, Registrar/, Bursar/, HOD/, Lecturer/, Student/
    └── SchoolAdmin/        ← legacy generic admin pages

database/
├── migrations/
└── seeders/SchoolSeeder.php   ← seeds the ACONS tenant, departments, programmes, courses
```

---

## 🔒 Security Features

| Threat | Protection |
|--------|-----------|
| SQL Injection | Eloquent ORM + parameterized queries only |
| CSRF | Laravel default on all POST/PUT/DELETE |
| XSS | React auto-escaping + CSP headers via `SecurityHeaders` middleware |
| Brute force | 5 attempts/15 min per IP+email, `RateLimiter` |
| Session fixation | `session()->regenerate()` on every login |
| Sensitive headers | X-Powered-By and Server headers removed |
| HSTS | Enabled in production with preload |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` |
| File uploads | MIME type + extension + size validation |
| Webhook forgery | Zainpay signature verification |
| Unauthorized access | Denied users are redirected to *their own* dashboard with a clear message, never left on a confusing/generic page |

---

## 💳 Payment Gateway — Zainpay

```env
ZAINPAY_PUBLIC_KEY=xxx
ZAINPAY_SECRET_KEY=xxx
ZAINPAY_BASE_URL=https://api.zainpay.ng
```
Webhook URL: `https://yourdomain.com/webhooks/zainpay`

The tenant's `settings.payment_gateway` is set to `zainpay`. Currency is displayed in
Naira (₦) throughout the portal.

---

## 📋 Feature Highlights

### All Roles
- Animated sidebar navigation per role
- Institutional email visible in the dashboard header
- Real-time flash notifications (success/error/warning)
- Mobile-responsive (collapsible sidebar)

### Super Admin
- System health/diagnostics dashboard only (database, cache, queue, storage checks)

### Registrar
- Admissions processing, student record management
- Staff (lecturer) creation and management

### Bursar
- Fee schedule management (₦ Naira)
- Payment tracking and financial reports

### Provost
- Institution-wide dashboard and oversight
- Results sign-off, announcements

### Lecturer / HOD
- Attendance marking, grade entry
- Department/course/staff oversight (HOD)

### Student
- Dashboard with academic session & semester context
- Registration fee payment, course enrolment
- Academic record / transcript with institutional letterhead
