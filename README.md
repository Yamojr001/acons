# EduSaaS — Hostinger Edition
**Multi-Tenant School Management Platform**
> Laravel 11 · React 19 · Inertia.js · MySQL 8 · Stripe · Paystack · Monnify · Framer Motion

---

## 🚀 Quick Start — Local Development

### Prerequisites
- PHP 8.3+ · Composer 2.x · Node.js 20+ · MySQL 8.0 · Redis (optional)

### 1. Install
```bash
git clone <your-repo> edusaas && cd edusaas
composer install
npm install
cp .env.example .env
php artisan key:generate
```

### 2. Configure .env
```env
APP_ENV=local
APP_URL=http://localhost:8000
APP_PLATFORM_DOMAIN=localhost
DB_CONNECTION=mysql
DB_DATABASE=edusaas
DB_USERNAME=root
DB_PASSWORD=your_password
QUEUE_CONNECTION=database
```

### 3. Database
```bash
mysql -u root -p -e "CREATE DATABASE edusaas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed
```

### 4. Start
```bash
php artisan serve          # Terminal 1 — Laravel on :8000
npm run dev                # Terminal 2 — Vite hot reload
php artisan queue:work     # Terminal 3 — Job queue
```

### 5. Access School Portal
Add to `/etc/hosts`:
```
127.0.0.1  greenfield.localhost
```
Visit: **http://greenfield.localhost:8000**

---

## 🔐 Demo Credentials

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Super Admin | admin@edusaas.com | SuperAdmin@2024! | localhost:8000/superadmin/dashboard |
| School Admin | admin@greenfield.edu.ng | Admin@123 | greenfield.localhost:8000/admin/dashboard |
| Teacher | emeka@greenfield.edu.ng | Teacher@123 | greenfield.localhost:8000/teacher/dashboard |
| Student | amara.obi@greenfield.edu.ng | Student@123 | greenfield.localhost:8000/student/dashboard |
| Parent | parent.amara.obi@greenfield.edu.ng | Parent@123 | greenfield.localhost:8000/parent/dashboard |

---

## 🏗️ Project Structure

```
edusaas/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/AuthController.php
│   │   │   ├── Admin/AllAdminControllers.php      ← Super Admin
│   │   │   ├── School/DashboardController.php
│   │   │   ├── School/AllSchoolControllers.php    ← Settings, Fees, Exams, Grades...
│   │   │   ├── School/StudentController.php
│   │   │   ├── Teacher/AllTeacherControllers.php
│   │   │   ├── Student/AllStudentControllers.php
│   │   │   ├── Parent/AllParentControllers.php
│   │   │   ├── LandingController.php
│   │   │   └── WebhookController.php
│   │   └── Middleware/
│   │       ├── AllMiddleware.php   ← IdentifyTenant, SecurityHeaders, EnsureTenantAccess, RoleMiddleware
│   │       └── HandleInertiaRequests.php
│   ├── Models/AllModels.php        ← All Eloquent models with TenantScope
│   ├── Scopes/TenantScope.php
│   ├── Traits/BelongsToTenant.php
│   └── Services/
│       ├── PaymentService.php     ← Stripe + Paystack + Monnify
│       └── TenantResolver.php     ← Hostname → Tenant lookup with cache
│
├── resources/js/
│   ├── app.tsx                    ← Inertia entry point
│   ├── Components/UI/index.tsx    ← Button, Card, Badge, Avatar, StatCard...
│   ├── Components/UI/Advanced.tsx ← Modal, DataTable, FileUpload, Toggle, Tabs...
│   ├── Layouts/
│   │   ├── AppLayout.tsx          ← Animated sidebar per role
│   │   └── GuestLayout.tsx        ← Auth pages with branding panel
│   └── Pages/
│       ├── Auth/Login.tsx
│       ├── Landing/Index.tsx      ← Dynamic branded landing page
│       ├── SuperAdmin/Dashboard.tsx
│       ├── SchoolAdmin/Dashboard.tsx
│       ├── SchoolAdmin/Students.tsx
│       ├── SchoolAdmin/StudentCreate.tsx   ← Multi-step form
│       ├── SchoolAdmin/Teachers.tsx
│       ├── SchoolAdmin/Fees.tsx
│       ├── SchoolAdmin/Payments.tsx
│       ├── SchoolAdmin/Settings.tsx        ← Branding, domain, portal fee
│       ├── SchoolAdmin/Reports.tsx         ← Financial + Academic
│       ├── Teacher/Dashboard.tsx
│       ├── Teacher/Attendance.tsx          ← Touch-friendly toggle buttons
│       ├── Teacher/Grades.tsx              ← Auto grade letter + bulk save
│       ├── Student/Dashboard.tsx           ← Attendance ring, fee alert
│       ├── Student/Fees.tsx                ← Gateway selection modal
│       ├── Student/AllStudentPages.tsx     ← Results, Attendance, Announcements
│       ├── Parent/Dashboard.tsx            ← Multi-child tabs
│       ├── Shared/Profile.tsx
│       └── Error.tsx
│
├── database/
│   ├── migrations/2024_01_01_000001_create_all_tables.php
│   └── seeders/DatabaseSeeder.php
│
├── routes/
│   ├── web.php                    ← All routes by role
│   └── console.php                ← Scheduled tasks
│
├── nginx/edusaas.conf             ← Production Nginx config
├── scripts/provision_domain.sh    ← Auto SSL for custom domains
├── .github/workflows/deploy.yml   ← CI/CD pipeline
└── tests/Feature/EduSaaSTest.php
```

---

## 🔒 Security Features

| Threat | Protection |
|--------|-----------|
| Cross-tenant data leak | `TenantScope` on ALL Eloquent models, `EnsureTenantAccess` middleware |
| SQL Injection | Eloquent ORM + parameterized queries only |
| CSRF | Laravel default on all POST/PUT/DELETE |
| XSS | React auto-escaping + CSP headers via `SecurityHeaders` middleware |
| Brute force | 5 attempts/15 min per IP+email, `RateLimiter` |
| Session fixation | `session()->regenerate()` on every login |
| Sensitive headers | X-Powered-By and Server headers removed |
| HSTS | Enabled in production with preload |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` |
| File uploads | MIME type + extension + size validation |
| Webhook forgery | Stripe signature + Paystack HMAC-SHA512 verification |

---

## 💳 Payment Gateways

### Paystack (Recommended for Nigeria)
```env
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PAYMENT_URL=https://api.paystack.co
```
Webhook URL: `https://yourdomain.com/webhooks/paystack`

### Monnify (Bank Transfer + USSD)
```env
MONNIFY_API_KEY=MK_PROD_xxx
MONNIFY_SECRET_KEY=xxx
MONNIFY_CONTRACT_CODE=xxx
MONNIFY_BASE_URL=https://api.monnify.com
```
Webhook URL: `https://yourdomain.com/webhooks/monnify`

### Stripe (International Cards)
```env
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```
Webhook URL: `https://yourdomain.com/webhooks/stripe`

---

## 🌐 Hostinger VPS Deployment

```bash
# 1. Server setup (Ubuntu 22.04)
apt update && apt upgrade -y
add-apt-repository ppa:ondrej/php -y
apt install php8.3 php8.3-fpm php8.3-mysql php8.3-curl php8.3-xml \
    php8.3-mbstring php8.3-zip php8.3-bcmath php8.3-gd php8.3-redis \
    nginx mysql-server redis-server supervisor -y

# 2. Deploy
cd /var/www && git clone <repo> edusaas && cd edusaas
composer install --no-dev --optimize-autoloader
npm ci && npm run build
cp .env.example .env  # Edit with production values
php artisan key:generate
php artisan migrate --force --seed
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache

# 3. Nginx (copy nginx/edusaas.conf to /etc/nginx/sites-enabled/)
# 4. Wildcard SSL
certbot certonly --manual --preferred-challenges dns -d yourdomain.com -d *.yourdomain.com

# 5. Supervisor for queue worker
# See scripts/provision_domain.sh for custom domain SSL automation
```

---

## 📋 Features

### All Roles
- Animated sidebar navigation per role
- Real-time flash notifications (success/error/warning)
- Mobile-responsive (collapsible sidebar)
- Dynamic school branding (logo, colors applied instantly)
- Secure session management

### Super Admin
- Create & manage all schools (subdomain + plan)
- Platform-wide analytics (MRR, school growth)
- Subscription plan management
- System health check dashboard

### School Admin
- Multi-step student registration with guardian linking
- Teacher management with subject/class assignment
- Bulk fee assignment (by class, all students, individual)
- Portal maintenance fee automation on registration
- Custom domain setup with DNS verification
- Financial reports with collection rates per class
- Academic reports with grade distribution & top performers
- Attendance reports with export
- Announcements with email/SMS delivery

### Teacher
- Touch-friendly attendance marking (Present/Absent/Late/Excused per student)
- Grade entry table with auto grade letter calculation
- Bulk grade save
- Class overview with student lists

### Student
- Dashboard with attendance ring, upcoming exams, fee alert
- Multi-gateway payment (Paystack/Monnify/Stripe)
- Full result history with charts
- Monthly attendance calendar view

### Parent
- Multi-child selector tabs
- Per-child results, attendance, fees view
- Pay fees for any child
- School notices
