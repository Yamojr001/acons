import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trophy, ClipboardList, CreditCard, Bell, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, Avatar } from '@/Components/UI'
import { formatDate, formatCurrency, statusColor } from '@/lib/utils'
import type { PageProps, Student, Fee } from '@/types'

interface ChildData {
  student: Student & { user: { name: string; avatar: string | null }; class_room: { name: string } }
  recentResults: Array<{ subject: string; score: number; total: number; grade_letter: string; date: string }>
  attendance: { rate: number; present: number; total: number }
  fees: Array<Fee & { is_overdue: boolean }>
  outstanding: number
}

interface ParentDashboardProps extends PageProps {
  children: ChildData[]
  announcements: Array<{ id: number; title: string; published_at: string; audience: string }>
}

export default function ParentDashboard({ children: childrenData, announcements }: ParentDashboardProps) {
  const [activeChild, setActiveChild] = useState(0)
  const child = childrenData[activeChild]
  const totalOutstanding = childrenData.reduce((sum, c) => sum + c.outstanding, 0)

  return (
    <AppLayout title="Parent Dashboard">
      <Head title="Parent Dashboard" />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="page-title">Parent Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">Monitor your children's progress and pay fees online.</p>
      </motion.div>

      {/* Outstanding fees alert */}
      {totalOutstanding > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-5 p-4 bg-warning-50 border border-warning-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-warning-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-surface-900 text-sm">Outstanding Fees</p>
              <p className="text-xs text-surface-500">Total balance due: {formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
          <Link href="/parent/fees"><Button variant="warning" size="sm">Pay Now</Button></Link>
        </motion.div>
      )}

      {/* Child selector tabs */}
      {childrenData.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {childrenData.map((c, i) => (
            <button key={c.student.id} onClick={() => setActiveChild(i)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                activeChild === i ? 'bg-brand-500 text-white shadow-sm' : 'bg-white border border-surface-200 text-surface-600 hover:border-brand-300'
              }`}>
              <Avatar name={c.student.user.name} src={c.student.user.avatar} size="xs" />
              {c.student.user.name}
              {c.outstanding > 0 && <span className="w-2 h-2 rounded-full bg-danger-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {child && (
        <AnimatePresence mode="wait">
          <motion.div key={child.student.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>

            {/* Child profile card */}
            <div className="card p-5 flex items-center gap-4 mb-5">
              <Avatar name={child.student.user.name} src={child.student.user.avatar} size="lg"
                className="ring-4 ring-white shadow-md flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-display font-semibold text-surface-900">{child.student.user.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="brand">{child.student.class_room.name}</Badge>
                  <span className="text-xs text-surface-500 font-mono">{child.student.admission_number}</span>
                  <Badge variant={statusColor(child.student.status) as any}>{child.student.status}</Badge>
                </div>
              </div>
              <Link href={`/parent/children/${child.student.id}/results`}>
                <Button variant="outline" size="sm" iconRight={<ArrowRight size={14} />}>Full Report</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Recent results */}
              <Card padding="none" className="overflow-hidden lg:col-span-2">
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Trophy size={16} className="text-warning-500" /><h3 className="font-semibold text-sm text-surface-900">Recent Results</h3></div>
                  <Link href={`/parent/children/${child.student.id}/results`}><Button variant="ghost" size="sm">View all</Button></Link>
                </div>
                {child.recentResults.length > 0 ? (
                  <div className="divide-y divide-surface-100">
                    {child.recentResults.slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          r.grade_letter?.startsWith('A') ? 'bg-success-50 text-success-600' : r.grade_letter === 'F' ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600'
                        }`}>{r.grade_letter}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-800 truncate">{r.subject}</p>
                          <p className="text-xs text-surface-500">{formatDate(r.date)}</p>
                        </div>
                        <p className="text-sm font-semibold text-surface-900">{r.score}<span className="text-surface-400 text-xs font-normal">/{r.total}</span></p>
                      </div>
                    ))}
                  </div>
                ) : <p className="px-6 py-4 text-sm text-surface-400">No results yet.</p>}
              </Card>

              {/* Attendance + fees */}
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center gap-2 mb-3"><ClipboardList size={16} className="text-brand-500" /><h3 className="font-semibold text-sm text-surface-900">Attendance</h3></div>
                  <div className="flex items-end gap-3">
                    <span className={`text-3xl font-display font-bold ${child.attendance.rate >= 75 ? 'text-success-600' : child.attendance.rate >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                      {child.attendance.rate}%
                    </span>
                    <span className="text-sm text-surface-500 mb-0.5">{child.attendance.present}/{child.attendance.total} days</span>
                  </div>
                  <div className="mt-2 h-2 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${child.attendance.rate}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${child.attendance.rate >= 75 ? 'bg-success-500' : child.attendance.rate >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`} />
                  </div>
                </Card>

                {child.outstanding > 0 ? (
                  <Card className="border-danger-200">
                    <div className="flex items-center gap-2 mb-2"><CreditCard size={16} className="text-danger-500" /><h3 className="font-semibold text-sm text-surface-900">Outstanding</h3></div>
                    <p className="text-2xl font-bold text-danger-600">{formatCurrency(child.outstanding)}</p>
                    <p className="text-xs text-surface-500 mt-0.5 mb-3">{child.fees.filter(f => f.status !== 'paid').length} unpaid fees</p>
                    <Link href="/parent/fees"><Button variant="danger" size="sm" className="w-full">Pay Fees</Button></Link>
                  </Card>
                ) : (
                  <Card className="border-success-200 bg-success-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-success-500" />
                      <div>
                        <p className="text-sm font-semibold text-surface-900">All fees paid</p>
                        <p className="text-xs text-surface-500">No outstanding balance</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
            <Bell size={16} className="text-warning-500" />
            <h3 className="font-semibold text-sm text-surface-900">Institution Notices</h3>
          </div>
          <div className="divide-y divide-surface-100">
            {announcements.slice(0, 4).map(a => (
              <div key={a.id} className="px-6 py-3.5">
                <p className="text-sm font-medium text-surface-800">{a.title}</p>
                <p className="text-xs text-surface-400 mt-0.5">{formatDate(a.published_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppLayout>
  )
}
