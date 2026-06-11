// ─── Teacher Dashboard ────────────────────────────────────────────────────────
import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { BookOpen, PenLine, Calendar, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { StatCard, Card, Badge, Button, Avatar, EmptyState } from '@/Components/UI'
import { Timeline } from '@/Components/UI/Advanced'
import { formatDate, statusColor, staggerContainer, staggerItem } from '@/lib/utils'
import type { PageProps, ClassRoom } from '@/types'

// ── Types ──
interface TeacherDashboardProps extends PageProps {
  myClasses: Array<ClassRoom & { students_count: number }>
  todaySchedule: Array<{ time: string; subject: string; class: string; room?: string }>
  pendingGrades: Array<{ exam_id: number; exam_title: string; class: string; count: number }>
  recentActivity: Array<{ id: number; title: string; description: string; time: string; color: 'success' | 'brand' | 'warning' }>
  stats: { total_students: number; classes_today: number; pending_exams: number; avg_attendance: number }
}

export function TeacherDashboard({ stats, myClasses, todaySchedule, pendingGrades, recentActivity }: TeacherDashboardProps) {
  return (
    <AppLayout title="My Dashboard">
      <Head title="Lecturer Dashboard" />
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="page-title">Lecturer Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">{formatDate(new Date().toISOString(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Students"     value={stats.total_students} icon={<Users size={22} />}         color="brand"   delay={0} />
        <StatCard title="Classes Today"   value={stats.classes_today}  icon={<BookOpen size={22} />}      color="success" delay={0.07} />
        <StatCard title="Pending Grading" value={stats.pending_exams}  icon={<PenLine size={22} />}       color="warning" delay={0.14} />
        <StatCard title="Teaching Load"   value={myClasses.length}     icon={<CheckCircle2 size={22} />} color="success" delay={0.21} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* My Classes */}
        <Card padding="none" className="overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900">My Classes</h3>
            <Link href="/lecturer/my-courses"><Button variant="ghost" size="sm">View all</Button></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {myClasses.map((cls, i) => (
              <motion.div key={cls.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-50 border border-surface-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {cls.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-900 truncate">{cls.name}</p>
                  <p className="text-xs text-surface-500">{cls.students_count} students · {cls.academic_year}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Today's schedule */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
            <Clock size={16} className="text-brand-500" />
            <h3 className="font-semibold text-surface-900 text-sm">Today's Schedule</h3>
          </div>
          {todaySchedule.length > 0 ? (
            <div className="divide-y divide-surface-100">
              {todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-mono text-surface-500 w-16 flex-shrink-0">{s.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-800 truncate">{s.subject}</p>
                    <p className="text-xs text-surface-500">{s.class}{s.room ? ` · ${s.room}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-4 text-xs text-surface-500">No classes scheduled today.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending grades */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
            <AlertCircle size={16} className="text-warning-500" />
            <h3 className="font-semibold text-surface-900 text-sm">Pending Grade Entry</h3>
          </div>
          {pendingGrades.length > 0 ? (
            <div className="divide-y divide-surface-100">
              {pendingGrades.map((pg, i) => (
                <div key={pg.exam_id} className="flex items-center gap-3 px-6 py-3.5">
                  <PenLine size={16} className="text-warning-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{pg.exam_title}</p>
                    <p className="text-xs text-surface-500">{pg.class} · {pg.count} students to grade</p>
                  </div>
                  <Link href={`/lecturer/grades?exam=${pg.exam_id}`}>
                    <Button variant="outline" size="sm">Grade</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-4 text-sm text-success-600 flex items-center gap-2">
              <CheckCircle2 size={16} /> All grades are up to date!
            </p>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0
            ? <Timeline events={recentActivity.map(a => ({ id: a.id, title: a.title, description: a.description, time: a.time, color: a.color }))} />
            : <EmptyState title="No recent activity" description="Your activity will appear here." />
          }
        </Card>
      </div>
    </AppLayout>
  )
}
export default TeacherDashboard
