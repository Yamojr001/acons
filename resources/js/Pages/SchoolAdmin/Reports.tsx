import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Download, Filter, TrendingUp, DollarSign, BookOpen, Users, Award } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { PageHeader, Tabs, Select } from '@/Components/UI/Advanced'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

// ─── Financial Reports ───────────────────────────────────────────────────────

interface FinancialReportProps extends PageProps {
  monthly_revenue: Array<{ month: string; collected: number; expected: number; outstanding: number }>
  payment_methods: Array<{ method: string; amount: number; count: number }>
  fee_collection_by_class: Array<{ class: string; collected: number; expected: number; rate: number }>
  summary: { total_collected: number; total_expected: number; collection_rate: number; overdue_amount: number }
}

export function FinancialReport({ monthly_revenue, payment_methods, fee_collection_by_class, summary }: FinancialReportProps) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <AppLayout title="Financial Reports">
      <Head title="Financial Reports" />
      <PageHeader title="Financial Reports" subtitle="Revenue collection analysis"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Financial' }]}
        actions={<Button variant="outline" size="sm" icon={<Download size={14} />}>Export PDF</Button>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Collected',   value: formatCurrency(summary.total_collected),   color: 'text-success-600 bg-success-50' },
          { label: 'Expected',          value: formatCurrency(summary.total_expected),     color: 'text-brand-600 bg-brand-50' },
          { label: 'Collection Rate',   value: `${summary.collection_rate}%`,              color: `${summary.collection_rate >= 80 ? 'text-success-600 bg-success-50' : 'text-warning-600 bg-warning-50'}` },
          { label: 'Overdue Amount',    value: formatCurrency(summary.overdue_amount),     color: 'text-danger-600 bg-danger-50' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`card p-4 ${s.color.split(' ')[1]}`}>
            <p className="text-xs text-surface-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card padding="none" className="overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Monthly Collection vs Expected</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly_revenue} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expected" name="Expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Payment Methods</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={payment_methods} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={60} strokeWidth={2}>
                  {payment_methods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {payment_methods.map((m, i) => (
                <div key={m.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="capitalize text-surface-600">{m.method}</span>
                  </div>
                  <span className="font-medium text-surface-700">{m.count} txns</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Fee collection by class */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Collection by Class</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-surface-50 border-b border-surface-200">
              {['Class', 'Collected', 'Expected', 'Rate'].map(h => <th key={h} className="table-head text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {fee_collection_by_class.map((row, i) => (
                <motion.tr key={row.class} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="table-row">
                  <td className="table-cell font-medium">{row.class}</td>
                  <td className="table-cell text-success-600 font-semibold">{formatCurrency(row.collected)}</td>
                  <td className="table-cell text-surface-600">{formatCurrency(row.expected)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px] h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.rate}%`, background: row.rate >= 80 ? '#10b981' : row.rate >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-xs font-medium text-surface-700">{row.rate}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  )
}

// ─── Academic Reports ─────────────────────────────────────────────────────────

interface AcademicReportProps extends PageProps {
  grade_distribution: Array<{ grade: string; count: number; percentage: number }>
  top_performers: Array<{ name: string; class: string; avg_score: number; grade_letter: string }>
  subject_averages: Array<{ subject: string; avg_score: number; pass_rate: number }>
  term: string
}

export function AcademicReport({ grade_distribution, top_performers, subject_averages, term }: AcademicReportProps) {
  const COLORS = { 'A+': '#10b981', 'A': '#34d399', 'B+': '#6366f1', 'B': '#818cf8', 'C+': '#f59e0b', 'C': '#fbbf24', 'D': '#f97316', 'F': '#ef4444' }

  return (
    <AppLayout title="Academic Reports">
      <Head title="Academic Reports" />
      <PageHeader title="Academic Performance" subtitle={`${term} results analysis`}
        breadcrumbs={[{ label: 'Reports' }, { label: 'Academic' }]}
        actions={<Button variant="outline" size="sm" icon={<Download size={14} />}>Export PDF</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Grade distribution */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100"><h3 className="font-semibold text-surface-900">Grade Distribution</h3></div>
          <div className="p-4">
            <div className="space-y-2.5">
              {grade_distribution.map(g => (
                <div key={g.grade} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-6 text-surface-700">{g.grade}</span>
                  <div className="flex-1 h-6 bg-surface-100 rounded-lg overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${g.percentage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-lg flex items-center justify-end pr-2"
                      style={{ background: (COLORS as any)[g.grade] ?? '#6366f1' }}>
                      <span className="text-xs text-white font-medium">{g.count}</span>
                    </motion.div>
                  </div>
                  <span className="text-xs text-surface-500 w-8 text-right">{g.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Subject averages */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100"><h3 className="font-semibold text-surface-900">Subject Performance</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={subject_averages} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                <Bar dataKey="avg_score" name="Avg Score" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top performers */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
          <Award size={16} className="text-warning-500" />
          <h3 className="font-semibold text-surface-900">Top Performers</h3>
        </div>
        <div className="divide-y divide-surface-100">
          {top_performers.slice(0, 10).map((s, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-surface-500 bg-surface-100 flex-shrink-0">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900">{s.name}</p>
                <p className="text-xs text-surface-500">{s.class}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-surface-900">{s.avg_score.toFixed(1)}%</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold
                  ${s.grade_letter.startsWith('A') ? 'bg-success-50 text-success-600' : 'bg-brand-50 text-brand-600'}`}>
                  {s.grade_letter}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  )
}

export default FinancialReport
