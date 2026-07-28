import { PageProps as InertiaPageProps } from '@inertiajs/core'

export type UserRole = 'super_admin' | 'school_admin' | 'lecturer' | 'student' | 'registrar' | 'bursar' | 'admission_officer' | 'exam_officer' | 'hod' | 'provost'

export interface Tenant {
    id: number; name: string; subdomain: string
    custom_domain: string | null; custom_domain_verified: boolean
    domain_verification_token: string | null
    logo_path: string | null; logo_url: string | null
    favicon_path: string | null; favicon_url: string | null
    primary_color: string; secondary_color: string
    tagline: string | null; phone: string | null; email: string | null; address: string | null
    subscription_plan: 'starter' | 'growth' | 'professional' | 'enterprise'
    subscription_expires_at: string | null; is_active: boolean
    charge_portal_fee: boolean; portal_maintenance_fee: number | null
    teacher_mode?: 'per_class' | 'per_subject'
    current_session?: string; current_term?: string
    settings: Record<string, unknown> | null
    students_count?: number; teachers_count?: number
    created_at: string; updated_at: string
}

export interface User {
    id: number; tenant_id: number; name: string; email: string
    role: UserRole; phone: string | null; avatar: string | null; avatar_url: string | null
    is_active: boolean; email_verified_at: string | null
    created_at: string; updated_at: string
}

export interface Student {
    id: number; tenant_id: number; user_id: number; class_room_id: number
    admission_number: string; date_of_birth: string
    gender: 'male' | 'female' | 'other'; blood_group: string | null
    address: string | null; status: 'active' | 'graduated' | 'suspended' | 'withdrawn'
    user?: User; class_room?: ClassRoom; guardians?: Guardian[]
    fees?: Fee[]; grades?: Grade[]; attendances?: Attendance[]
    attendance_rate?: number
    created_at: string; updated_at: string
}

export interface Teacher {
    id: number; tenant_id: number; user_id: number
    employee_id: string; hire_date: string; qualification: string | null
    user?: User; class_rooms?: ClassRoom[]; subjects?: Subject[]
    created_at: string
}

export interface Guardian {
    id: number; tenant_id: number; user_id: number
    occupation: string | null; relationship: string
    user?: User; students?: Student[]
}

export interface ClassRoom {
    id: number; tenant_id: number; teacher_id: number | null
    name: string; section: string | null; capacity: number; academic_year: string
    teacher?: Teacher; students?: Student[]; students_count?: number
}

export interface Subject {
    id: number; tenant_id: number; name: string; code: string | null; category: string | null; section: string | null
}

export interface Timetable {
    id: number; tenant_id: number; class_room_id: number; subject_id: number
    teacher_id: number; day_of_week: number; start_time: string; end_time: string; room: string | null
    class_room?: ClassRoom; subject?: Subject; teacher?: Teacher
}

export interface Attendance {
    id: number; tenant_id: number; student_id: number; class_room_id: number
    date: string; status: 'present' | 'absent' | 'late' | 'excused'; note: string | null
    student?: Student; class_room?: ClassRoom
}

export interface Exam {
    id: number; tenant_id: number; class_room_id: number; subject_id: number
    title: string; term: string; exam_date: string; total_marks: number; passing_marks: number
    class_room?: ClassRoom; subject?: Subject; grades?: Grade[]
    status?: 'upcoming' | 'completed' | 'grading'
}

export interface Grade {
    id: number; tenant_id: number; student_id: number; exam_id: number
    score: number; grade_letter: string | null; remarks: string | null
    student?: Student; exam?: Exam
}

export interface Fee {
    id: number; tenant_id: number; student_id: number
    title: string; term: string; amount: number; due_date: string
    status: 'pending' | 'partial' | 'paid' | 'overdue'
    student?: Student; payments?: Payment[]
}

export interface Payment {
    id: number; tenant_id: number; fee_id: number; student_id: number
    amount: number; reference: string; payment_method: string
    status: 'pending' | 'successful' | 'failed' | 'refunded'
    metadata: Record<string, unknown> | null
    fee?: Fee; student?: Student
    created_at: string
}

export interface Announcement {
    id: number; tenant_id: number; created_by: number
    title: string; body: string
    audience: 'all' | 'teachers' | 'students' | 'parents'; send_email: boolean; send_sms: boolean
    published_at: string | null; author?: User
    created_at: string
}

export interface ActivityLog {
    id: number; description: string; causer?: User; properties: Record<string, unknown>
    created_at: string
}

export interface SubscriptionPlan {
    id: number; name: string; slug: string; price: number
    student_limit: number; features: string[]; is_active: boolean
}

// ─── Inertia Shared Props ────────────────────────────────────────────────
export interface SharedProps {
    auth: { user: User | null; tenant: Tenant | null }
    flash: { success?: string; error?: string; warning?: string; info?: string }
    errors: Record<string, string>
    notifications_count: number
    ziggy: { location: string; url: string; port: number | null; defaults: Record<string, unknown>; routes: Record<string, unknown> }
}

export type PageProps<T = Record<string, unknown>> = T & SharedProps & InertiaPageProps

// ─── Pagination ──────────────────────────────────────────────────────────
export interface PaginatedData<T> {
    data: T[]; current_page: number; last_page: number
    per_page: number; total: number; from: number | null; to: number | null
    links: Array<{ url: string | null; label: string; active: boolean }>
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────
export interface AdminDashboardStats {
    total_students: number; total_teachers: number; total_classes: number
    revenue_this_month: number; pending_fees: number; attendance_rate: number
    enrollment_trend: Array<{ month: string; count: number }>
    fee_collection: Array<{ month: string; amount: number }>
    student_by_class: Array<{ class: string; count: number }>
    attendance_by_class: Array<{ class: string; rate: number }>
}

export interface SuperAdminStats {
    total_schools: number; active_schools: number; total_students: number
    total_revenue: number; mrr: number
    monthly_revenue: Array<{ month: string; amount: number }>
    school_growth: Array<{ month: string; count: number }>
    revenue_by_plan: Array<{ plan: string; amount: number }>
}

declare global {
    function route(name: string, params?: unknown, absolute?: boolean): string
}

declare module '@inertiajs/core' {
    interface PageProps extends SharedProps {}
}
