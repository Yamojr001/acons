import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  BarChart3, Users, BookOpen, GraduationCap, 
  CreditCard, LayoutDashboard, ShieldCheck,
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Building2, Wallet, XCircle
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, StatCard, Badge, Button } from '@/Components/UI'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface AdminStats {
  total_students: number
  active_students?: number
  graduated_students?: number
  total_lecturers: number
  total_departments: number
  total_courses: number
  revenue_this_month: number
  total_income?: number
  total_expenses?: number
  departmental_fees: any[]
}

interface Props extends PageProps {
  role: string
  stats: any
  recent_payments?: any[]
  departmental_breakdown?: any[]
  recent_applications?: any[]
}

export default function AdminDashboard({ role, stats, recent_payments = [], departmental_breakdown = [], recent_applications = [] }: Props) {
  const roleDisplay = role.replace('_', ' ').toUpperCase()
  const isProvost = role === 'provost'
  const isAdmissionOfficer = role === 'admission_officer'
  const isHOD = role === 'hod'
  const isExamOfficer = role === 'exam_officer'

  let metrics = []
  if (isProvost) {
    metrics = [
      { label: 'Total Students', value: stats.total_students, icon: <GraduationCap size={20} />, color: 'brand' },
      { label: 'Active Students', value: stats.active_students || 0, icon: <GraduationCap size={20} />, color: 'success' },
      { label: 'Graduated Students', value: stats.graduated_students || 0, icon: <GraduationCap size={20} />, color: 'warning' },
      { label: 'Total Income', value: formatCurrency(stats.total_income || 0), icon: <Wallet size={20} />, color: 'info' },
      { label: 'Total Expenses', value: formatCurrency(stats.total_expenses || 0), icon: <CreditCard size={20} />, color: 'danger' },
    ]
  } else if (isAdmissionOfficer) {
    metrics = [
      { label: 'Total Applications', value: stats.total_applications || 0, icon: <BookOpen size={20} />, color: 'brand' },
      { label: 'Pending Apps', value: stats.pending_applications || 0, icon: <TrendingUp size={20} />, color: 'warning' },
      { label: 'Admitted Students', value: stats.admitted_students || 0, icon: <GraduationCap size={20} />, color: 'success' },
    ]
  } else if (isHOD) {
    metrics = [
      { label: 'Pending Clearance', value: stats.pending_clearance || 0, icon: <BookOpen size={20} />, color: 'warning' },
      { label: 'Cleared Students', value: stats.cleared || 0, icon: <GraduationCap size={20} />, color: 'success' },
      { label: 'Clearance Rejected', value: stats.rejected || 0, icon: <XCircle size={20} />, color: 'danger' },
    ]
  } else if (isExamOfficer) {
    metrics = [
      { label: 'Total Courses', value: stats.total_courses || 0, icon: <BookOpen size={20} />, color: 'brand' },
      { label: 'Pending Submission', value: stats.pending_submission || 0, icon: <TrendingUp size={20} />, color: 'warning' },
      { label: 'Awaiting Final Approval', value: stats.awaiting_final_approval || 0, icon: <ShieldCheck size={20} />, color: 'info' },
      { label: 'Published Results', value: stats.published_results || 0, icon: <GraduationCap size={20} />, color: 'success' },
    ]
  } else {
    metrics = [
      { label: 'Total Students', value: stats.total_students, icon: <GraduationCap size={20} />, color: 'brand' },
      { label: 'Academic Staff', value: stats.total_lecturers, icon: <Users size={20} />, color: 'success' },
      { label: 'Departments', value: stats.total_departments, icon: <Building2 size={20} />, color: 'warning' },
      { label: 'Total Revenue (MTD)', value: formatCurrency(stats.revenue_this_month), icon: <Wallet size={20} />, color: 'info' },
    ]
  }

  return (
    <AppLayout title={`${roleDisplay} Dashboard`}>
      <Head title={`${roleDisplay} Dashboard`} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={12} /> Institutional Management
            </div>
            <h1 className="text-3xl font-display font-bold text-surface-900 capitalize">{role.replace('_', ' ')} Executive Portal</h1>
            <p className="text-sm text-surface-500 mt-1 max-w-2xl">
              Real-time institutional oversight across departments, finance, and academic records.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" size="sm" iconLeft={<BarChart3 size={16} />}>Export Reports</Button>
             <Button variant="primary" size="sm" iconLeft={<ArrowUpRight size={16} />}>System Settings</Button>
          </div>
        </div>
      </motion.div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isProvost ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'} gap-6 mb-8`}>
        {metrics.map((metric, i) => (
          <StatCard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color as any}
            delay={i * 0.05}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Financial / Admission Breakdown */}
        <div className="space-y-8">
          {(!isAdmissionOfficer && !isHOD && !isExamOfficer) ? (
            <>
              <Card>
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-600">
                        <TrendingUp size={20} />
                     </div>
                     <div>
                        <h3 className="font-bold text-surface-900">Financial Performance by Department</h3>
                        <p className="text-xs text-surface-500">Revenue collected per academic unit this session.</p>
                     </div>
                   </div>
                   <Badge variant="neutral">Live Metrics</Badge>
                </div>

                <div className="space-y-6">
                  {departmental_breakdown.map((dept) => (
                    <div key={dept.code} className="relative group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-surface-400 group-hover:text-brand-600 transition-colors">{dept.code}</span>
                           <span className="text-sm font-semibold text-surface-700">{dept.name}</span>
                        </div>
                        <span className="text-sm font-bold text-surface-900">{formatCurrency(dept.total_revenue || 0)}</span>
                      </div>
                      <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((dept.total_revenue || 0) / 10000, 100)}%` }}
                          className="h-full bg-brand-500 rounded-full group-hover:bg-brand-600 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                  {departmental_breakdown.length === 0 && (
                    <p className="text-center py-8 text-surface-400 italic text-sm">No payment data recorded yet for this session.</p>
                  )}
                </div>
              </Card>

              <Card padding="none" className="overflow-hidden">
                 <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                    <h3 className="font-bold text-surface-900">Recent Financial Transactions</h3>
                    <Link href="/bursary/payments" className="text-xs font-bold text-brand-600 hover:text-brand-700">View All</Link>
                 </div>
                 <div className="divide-y divide-surface-100">
                    {recent_payments.map((payment) => (
                      <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-success-50 text-success-600 flex items-center justify-center">
                              <ArrowUpRight size={14} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-surface-900">{payment.student?.user?.name}</p>
                              <p className="text-[10px] text-surface-400 font-medium">{formatDate(payment.created_at)}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-surface-900">{formatCurrency(payment.amount)}</p>
                           <Badge variant="success" className="text-[10px] py-0">Successful</Badge>
                        </div>
                      </div>
                    ))}
                 </div>
              </Card>
            </>
          ) : (
            <Card padding="none" className="overflow-hidden">
               <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <h3 className="font-bold text-surface-900">{isExamOfficer ? 'Recent Grade Submissions' : 'Recent Applications'}</h3>
                  <Link href={isExamOfficer ? '/exam-office/dashboard' : '/admissions/manage'} className="text-xs font-bold text-brand-600 hover:text-brand-700">View All</Link>
               </div>
               <div className="divide-y divide-surface-100">
                  {recent_applications.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                            <BookOpen size={14} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-surface-900">{app.applicant_name || app.student?.user?.name}</p>
                            <p className="text-[10px] text-surface-400 font-medium">{isExamOfficer && app.course ? `${app.course} · ` : ''}{formatDate(app.created_at)}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <Badge variant={['admitted', 'approved'].includes(app.status) ? 'success' : ['pending', 'submitted', 'hod_approved'].includes(app.status) ? 'warning' : 'neutral'} className="text-[10px] py-0 capitalize">
                           {app.status?.replace('_', ' ')}
                         </Badge>
                      </div>
                    </div>
                  ))}
               </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
