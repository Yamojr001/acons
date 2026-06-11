import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { GraduationCap, UserCheck, DollarSign, CheckCircle2, TrendingUp, AlertTriangle, Clock, ArrowRight, Plus, PenLine, Megaphone, Calendar } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { StatCard, Card, Badge, Button, Avatar, EmptyState } from '@/Components/UI'
import { formatCurrency, formatDate, statusColor, staggerContainer, staggerItem } from '@/lib/utils'
import type { PageProps } from '@/types'

interface AdminDashboardProps extends PageProps {
  stats: {
    total_students: number; total_teachers: number; total_classes: number
    revenue_this_month: number; pending_fees: number; attendance_rate: number
    enrollment_trend: Array<{ month: string; count: number }>
    fee_collection: Array<{ month: string; amount: number }>
  }
  recent_payments: Array<{ id: number; reference: string; amount: number; payment_method: string; status: string; created_at: string; student?: { user?: { name: string } } }>
  upcoming_exams: Array<{ title: string; subject: string; date: string; class: string }>
}

const QUICK_ACTIONS = [
  { label: 'Add Student',    icon: <GraduationCap size={18} />, href: '/admin/students/create',       color: 'bg-brand-500' },
  { label: 'Create Exam',    icon: <PenLine size={18} />,       href: '/admin/exams/create',           color: 'bg-warning-500' },
  { label: 'Send Notice',    icon: <Megaphone size={18} />,     href: '/admin/announcements/create',   color: 'bg-purple-500' },
]

export default function AdminDashboard({ stats, recent_payments, upcoming_exams }: AdminDashboardProps) {
  return (
    <AppLayout title="Dashboard">
      <Head title="Dashboard" />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-display font-bold text-surface-900">Institution Overview</h1>
        <p className="text-surface-500 text-sm mt-0.5">{formatDate(new Date().toISOString(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link href={a.href}>
              <div className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all duration-200 cursor-pointer group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${a.color} group-hover:scale-110 transition-transform`}>{a.icon}</div>
                <span className="text-sm font-medium text-surface-700 group-hover:text-surface-900">{a.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students"   value={stats.total_students.toLocaleString()} change={4.2} icon={<GraduationCap size={22} />} color="brand"   delay={0} />
        <StatCard title="Total Teachers"   value={stats.total_teachers.toLocaleString()} change={1.5} icon={<UserCheck size={22} />}     color="success" delay={0.07} />
        <StatCard title="Monthly Revenue"  value={formatCurrency(stats.revenue_this_month)} change={8.1} icon={<DollarSign size={22} />} color="warning" delay={0.14} />
        <StatCard title="Upcoming Exams"  value={upcoming_exams.length} icon={<Calendar size={22} />} color="success" delay={0.21} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div variants={staggerItem} initial="hidden" animate="show" className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <div><h3 className="font-semibold text-surface-900">Enrollment Trend</h3><p className="text-xs text-surface-500 mt-0.5">New registrations per month</p></div>
              <TrendingUp size={16} className="text-brand-500" />
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.enrollment_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="Students" stroke="#6366f1" strokeWidth={2.5} fill="url(#eg)" dot={{ fill: '#6366f1', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} initial="hidden" animate="show">
          <Card padding="none" className="overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900">Fee Collection</h3>
              <p className="text-xs text-surface-500 mt-0.5">Monthly revenue</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.fee_collection} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Collected']} contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={staggerItem} initial="hidden" animate="show" className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900">Recent Payments</h3>
              <Link href="/admin/payments"><Button variant="ghost" size="sm" iconRight={<ArrowRight size={13} />}>View all</Button></Link>
            </div>
            {recent_payments?.length > 0 ? (
              <div className="divide-y divide-surface-100">
                {recent_payments.slice(0, 6).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 + 0.2 }}
                    className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 flex-shrink-0"><DollarSign size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{p.student?.user?.name ?? p.reference}</p>
                      <p className="text-xs text-surface-500 capitalize">{p.payment_method} · {formatDate(p.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-surface-900">{formatCurrency(p.amount)}</span>
                      <Badge variant={statusColor(p.status) as any} dot className="capitalize">{p.status}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<DollarSign size={24} />} title="No payments yet" description="Payments appear once students pay their fees." />
            )}
          </Card>
        </motion.div>

        <div className="space-y-4">
          <motion.div variants={staggerItem} initial="hidden" animate="show">
            <Card padding="none" className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-surface-100 flex items-center gap-2">
                <AlertTriangle size={15} className="text-warning-500" />
                <h3 className="font-semibold text-surface-900 text-sm">Academic Alerts</h3>
              </div>
              <div className="divide-y divide-surface-100">
                {[
                  'Review pending result submissions.',
                  'Monitor fee reconciliation updates.',
                  'Check active admissions review queues.',
                ].map((item, i) => (
                  <div key={i} className="px-5 py-3 text-xs text-surface-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning-500" /> {item}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem} initial="hidden" animate="show">
            <Card padding="none" className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-surface-100 flex items-center gap-2">
                <Clock size={15} className="text-brand-500" />
                <h3 className="font-semibold text-surface-900 text-sm">Upcoming Exams</h3>
              </div>
              {upcoming_exams?.length > 0 ? (
                <div className="divide-y divide-surface-100">
                  {upcoming_exams.slice(0, 4).map((e, i) => (
                    <div key={i} className="px-5 py-3">
                      <p className="text-xs font-medium text-surface-800 truncate">{e.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-surface-500">{e.subject} · {e.class}</p>
                        <span className="text-xs text-brand-600 font-medium">{formatDate(e.date, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-4 text-xs text-surface-500">No exams scheduled soon.</p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
