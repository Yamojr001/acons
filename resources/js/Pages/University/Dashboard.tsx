import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  BarChart3, BookOpen, Calendar, CreditCard, FileText, 
  GraduationCap, Megaphone, Users, ArrowRight,
  ClipboardList, AlertCircle, CheckCircle
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, StatCard, Badge, Button } from '@/Components/UI'
import { formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface DashboardProps extends PageProps {
  role: string
  title: string
  subtitle: string
  stats: Record<string, any>
  actions: Array<{ label: string; href: string; description: string }>
  lecturerCourses?: any[]
  currentSemester?: any
  lecturer_status?: string
  courseNotices?: any[]
}

const roleAccent: Record<string, { icon: any; color: string }> = {
  lecturer: { icon: BookOpen, color: 'brand' },
  admissions_officer: { icon: FileText, color: 'warning' },
  exam_officer: { icon: Calendar, color: 'success' },
  registrar: { icon: GraduationCap, color: 'brand' },
  bursar: { icon: CreditCard, color: 'warning' },
  hod: { icon: Users, color: 'success' },
  dean: { icon: BarChart3, color: 'danger' },
}

export default function Dashboard({ 
  role, title, subtitle, stats, actions, 
  lecturerCourses = [], currentSemester, 
  lecturer_status, courseNotices = [] 
}: DashboardProps) {
  const Accent = roleAccent[role]?.icon ?? Megaphone
  const accentColor = roleAccent[role]?.color ?? 'brand'

  const metrics = [
    { label: 'Active Students', value: stats.students_active, icon: <GraduationCap size={20} /> },
    { label: 'Teacher Status', value: lecturer_status === 'active' ? 'Active' : 'Inactive', icon: <Users size={20} /> },
    { label: 'Dept. Courses', value: stats.courses, icon: <BookOpen size={20} /> },
    { label: 'Approved Results', value: stats.results, icon: <CheckCircle size={20} /> },
  ]

  return (
    <AppLayout title={title}>
      <Head title={title} />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 text-surface-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Accent size={14} /> {role.replace('_', ' ')}
            </div>
            <h1 className="text-2xl font-display font-bold text-surface-900">{title}</h1>
            <p className="text-sm text-surface-500 mt-1 max-w-2xl">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="brand" className="font-bold">
               {currentSemester?.name ?? 'Academic Session'}
            </Badge>
            <p className="text-[10px] text-surface-400 font-medium">
              {formatDate(new Date().toISOString(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, i) => (
          <StatCard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={i % 2 === 0 ? 'brand' : 'success'}
            delay={i * 0.05}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workload Section */}
        <div className="lg:col-span-2 space-y-6">
          {role === 'lecturer' && (
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-brand-500" />
                  <h3 className="font-bold text-surface-900">Current Teaching Workload</h3>
                </div>
                <Badge variant="neutral">{lecturerCourses.length} Courses Assigned</Badge>
              </div>
              
              <div className="divide-y divide-surface-100">
                {lecturerCourses.length > 0 ? lecturerCourses.map((course) => (
                  <div key={course.id} className="p-6 hover:bg-surface-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-surface-900">{course.code}: {course.name}</p>
                          <Badge variant="outline" className="text-[10px] py-0">{course.units} Units</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-surface-500">
                          <span className="flex items-center gap-1"><Users size={12} /> {course.student_count} Registered Students</span>
                          {course.pending_grades > 0 ? (
                            <span className="flex items-center gap-1 text-warning-600 font-medium">
                              <AlertCircle size={12} /> {course.pending_grades} Results Pending Entry
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-success-600 font-medium">
                              <CheckCircle size={12} /> Grading Complete
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/lecturer/courses/${course.id}/grades`}>
                        <Button size="sm" variant="brand" iconRight={<ArrowRight size={14} />}>
                          Open Sheet
                        </Button>
                      </Link>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center">
                    <BookOpen size={40} className="mx-auto text-surface-200 mb-3" />
                    <p className="text-surface-500 italic">No courses assigned to you for this semester.</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {role === 'lecturer' && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-brand-50 text-brand-600">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">My Course Notices</h3>
                    <p className="text-sm text-surface-500">Public announcements for your students.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" iconLeft={<AlertCircle size={16} />}>Post New Notice</Button>
              </div>
              <div className="space-y-4">
                {courseNotices.length > 0 ? courseNotices.map((notice) => (
                  <div key={notice.id} className="p-4 rounded-xl border border-surface-200 bg-surface-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-surface-900 text-sm">{notice.title}</h4>
                      <span className="text-[10px] text-surface-400 uppercase font-bold">{formatDate(notice.created_at)}</span>
                    </div>
                    <p className="text-xs text-surface-600 line-clamp-2">{notice.body}</p>
                  </div>
                )) : (
                  <p className="text-sm text-surface-400 italic text-center py-4">No notices posted for your courses.</p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-brand-50 text-brand-600">
                <Accent size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900">Administrative Tools</h3>
                <p className="text-sm text-surface-500">Quick access to essential modules for your role.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actions.map(action => (
                <div key={action.label} className="rounded-2xl border border-surface-200 p-4 bg-surface-50/60 hover:border-brand-200 hover:bg-brand-50/20 transition-all group">
                  <p className="font-semibold text-surface-900 mb-1 group-hover:text-brand-600 transition-colors">{action.label}</p>
                  <p className="text-xs text-surface-500 mb-4 line-clamp-2">{action.description}</p>
                  {action.href !== '#' ? (
                    <Link href={action.href}>
                      <Button variant="outline" size="sm" className="w-full">Launch</Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" disabled>Coming soon</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {role !== 'lecturer' && (
            <Card>
              <h3 className="font-bold text-surface-900 mb-4 uppercase tracking-wider text-xs">Personnel Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Active Staff', value: stats.staff_active, color: 'text-success-600' },
                  { label: 'Suspended Staff', value: stats.staff_suspended, color: 'text-danger-600' },
                  { label: 'Staff on Leave', value: stats.staff_on_leave, color: 'text-warning-600' },
                  { label: 'Graduated Students', value: stats.students_graduated, color: 'text-brand-600' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-surface-500 font-medium">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
            <Megaphone size={24} className="mb-4 opacity-50" />
            <h4 className="font-bold mb-1">System Notification</h4>
            <p className="text-xs text-white/80 leading-relaxed">
              Grade submission for the {currentSemester?.name} First Semester closes in 14 days. Please ensure all score sheets are uploaded.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
