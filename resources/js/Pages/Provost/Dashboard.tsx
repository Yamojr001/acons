import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import {
  GraduationCap, Users, BookOpen, Building2, Wallet,
  CheckCircle, Clock, AlertCircle, Megaphone,
  ShieldCheck, TrendingUp, Award, ChevronRight, BarChart3
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button } from '@/Components/UI'
import { formatCurrency } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  stats: {
    total_students: number
    active_students: number
    total_lecturers: number
    total_departments: number
    total_courses: number
    pending_release: number
    released_this_semester: number
    rejected_results: number
    revenue_this_month: number
    total_income: number
  }
  current_semester: {
    id: number
    name: string
    academic_session?: { name: string }
  } | null
  pending_courses: Array<{
    id: number
    code: string
    title: string
    credit_units: number
    department: string
    lecturer: string
    total_students: number
    pending_grades: number
    avg_score: number
  }>
  recent_releases: Array<{
    student: string
    matric: string
    course: string
    score: number
    grade: string
    released: string
  }>
  announcements: any[]
}

export default function ProvostDashboard({ stats, current_semester, pending_courses = [], recent_releases = [], announcements = [] }: Props) {
  return (
    <AppLayout title="Provost Dashboard">
      <Head title="Provost — Office of the Chief Academic Officer" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest mb-3">
              <ShieldCheck size={12} /> Office of the Provost
            </div>
            <h1 className="text-3xl font-display font-bold text-surface-900">Provost Dashboard</h1>
            <p className="text-sm text-surface-500 mt-1">
              Chief Academic Officer — Ameenatu College of Nursing Science
            </p>
          </div>
          {current_semester && (
            <Badge variant="brand" className="px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
              Active: {current_semester.name} — {current_semester.academic_session?.name}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Result Release Alert */}
      {stats.pending_release > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900 text-sm">
              {stats.pending_release} result record(s) are awaiting your release
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              HOD-approved grades are ready for final provost release to students for the current semester.
            </p>
          </div>
          <Link href="/provost/results">
            <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 border-none text-xs font-bold uppercase whitespace-nowrap">
              Review & Release
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Students',
            value: stats.total_students,
            sub: `${stats.active_students} active`,
            icon: <GraduationCap size={20} />,
            color: 'from-brand-500 to-brand-600'
          },
          {
            label: 'Academic Staff',
            value: stats.total_lecturers,
            sub: 'Lecturers & HODs',
            icon: <Users size={20} />,
            color: 'from-emerald-500 to-emerald-600'
          },
          {
            label: 'Pending Release',
            value: stats.pending_release,
            sub: 'Awaiting provost approval',
            icon: <Clock size={20} />,
            color: stats.pending_release > 0 ? 'from-amber-500 to-amber-600' : 'from-surface-400 to-surface-500'
          },
          {
            label: 'Revenue (MTD)',
            value: formatCurrency(stats.revenue_this_month),
            sub: `Total: ${formatCurrency(stats.total_income)}`,
            icon: <Wallet size={20} />,
            color: 'from-sky-500 to-sky-600'
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={`bg-gradient-to-br ${stat.color} text-white border-none shadow-md`}>
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-white/20">{stat.icon}</div>
              </div>
              <p className="text-2xl font-display font-bold mt-3">{stat.value}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-0.5">{stat.label}</p>
              <p className="text-xs opacity-70 mt-1">{stat.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="text-center border border-surface-150">
          <p className="text-3xl font-display font-bold text-indigo-600">{stats.total_departments}</p>
          <p className="text-[10px] uppercase font-bold tracking-wider text-surface-500 mt-1">Departments</p>
        </Card>
        <Card className="text-center border border-surface-150">
          <p className="text-3xl font-display font-bold text-emerald-600">{stats.released_this_semester}</p>
          <p className="text-[10px] uppercase font-bold tracking-wider text-surface-500 mt-1">Released This Semester</p>
        </Card>
        <Card className="text-center border border-surface-150">
          <p className="text-3xl font-display font-bold text-surface-600">{stats.total_courses}</p>
          <p className="text-[10px] uppercase font-bold tracking-wider text-surface-500 mt-1">Active Courses</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Pending Release Courses */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-surface-900">Courses Awaiting Release</h3>
              <p className="text-xs text-surface-500 mt-0.5">HOD-approved results pending your final approval</p>
            </div>
            <Link href="/provost/results">
              <Button variant="outline" className="text-xs h-8 px-3 rounded-xl flex items-center gap-1">
                View All <ChevronRight size={13} />
              </Button>
            </Link>
          </div>

          {pending_courses.length > 0 ? (
            <div className="space-y-3">
              {pending_courses.slice(0, 5).map(course => (
                <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100 hover:bg-amber-50/50 hover:border-amber-200 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-surface-900 truncate">{course.code} — {course.title}</p>
                    <p className="text-[10px] text-surface-500 truncate">{course.department} · {course.total_students} students · Avg: {course.avg_score}%</p>
                  </div>
                  <Badge variant="warning" className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                    {course.pending_grades} pending
                  </Badge>
                </div>
              ))}
              {pending_courses.length > 5 && (
                <p className="text-xs text-center text-brand-600 font-semibold pt-1">
                  +{pending_courses.length - 5} more courses →
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-400">
              <CheckCircle size={36} className="mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-600">All results have been released</p>
              <p className="text-xs text-surface-400 mt-1">No courses are pending provost approval</p>
            </div>
          )}
        </Card>

        {/* Recent Releases */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-surface-900">Recent Releases</h3>
              <p className="text-xs text-surface-500 mt-0.5">Latest results published to students</p>
            </div>
            <Award size={16} className="text-emerald-500" />
          </div>

          {recent_releases.length > 0 ? (
            <div className="space-y-2.5">
              {recent_releases.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={13} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-surface-800 truncate">{r.student}</p>
                    <p className="text-[10px] text-surface-500 font-mono">{r.matric} · {r.course}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${r.grade === 'F' ? 'bg-danger-50 text-danger-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {r.grade}
                    </span>
                    <p className="text-[9px] text-surface-400 mt-0.5">{r.released}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-400">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No results released yet this semester</p>
            </div>
          )}
        </Card>

      </div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { href: '/provost/results', icon: <Award size={20} />, label: 'Release Results', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
          { href: '/provost/registrar/dashboard', icon: <Users size={20} />, label: 'Registrar Portal', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' },
          { href: '/provost/bursary/dashboard', icon: <Wallet size={20} />, label: 'Bursary Portal', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
          { href: '/provost/announcements', icon: <Megaphone size={20} />, label: 'Announcements', color: 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all font-semibold text-sm ${item.color}`}
          >
            {item.icon}
            {item.label}
            <ChevronRight size={14} className="ml-auto" />
          </Link>
        ))}
      </motion.div>
    </AppLayout>
  )
}
