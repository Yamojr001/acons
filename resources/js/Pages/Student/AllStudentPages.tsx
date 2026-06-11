// ─── Student Results Page ─────────────────────────────────────────────────────
import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, BookOpen } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, EmptyState } from '@/Components/UI'
import { PageHeader, Pagination, Tabs } from '@/Components/UI/Advanced'
import { formatDate, statusColor } from '@/lib/utils'
import { useState } from 'react'
import type { PageProps, PaginatedData } from '@/types'

interface ResultItem {
  exam_title: string; subject: string; score: number; total: number
  grade_letter: string; date: string; term: string
}

interface ResultsProps extends PageProps {
  results: PaginatedData<ResultItem>
  examsByTerm: Record<string, { grades: ResultItem[]; avg_score: number }>
}

function gradeColor(g: string) {
  if (g?.startsWith('A')) return 'bg-success-50 text-success-700 border-success-200'
  if (g?.startsWith('B')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (g?.startsWith('C')) return 'bg-warning-50 text-warning-700 border-warning-200'
  if (g === 'D')          return 'bg-orange-50 text-orange-700 border-orange-200'
  return 'bg-danger-50 text-danger-700 border-danger-200'
}

export function StudentResults({ results, examsByTerm }: ResultsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list')
  const terms = Object.keys(examsByTerm)

  const chartData = results.data.map(r => ({
    name: r.subject.substring(0, 8),
    score: Math.round((r.score / r.total) * 100),
    full: r.exam_title,
  }))

  return (
    <AppLayout title="My Results">
      <Head title="My Results" />
      <PageHeader title="My Results" subtitle="All exam scores and grade history"
        breadcrumbs={[{ label: 'Student' }, { label: 'Results' }]} />

      <Tabs tabs={[{ id: 'list', label: 'List View' }, { id: 'chart', label: 'Chart View' }]}
        active={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {activeTab === 'chart' && (
        <Card className="mb-5">
          <h3 className="font-semibold text-surface-900 mb-4">Score Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} angle={-30} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
              <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        {results.data.length > 0 ? (
          <>
            <div className="divide-y divide-surface-100">
              {results.data.map((r, i) => {
                const pct = Math.round((r.score / r.total) * 100)
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-6 py-4">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold border flex-shrink-0 ${gradeColor(r.grade_letter)}`}>
                      {r.grade_letter || '?'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 truncate">{r.exam_title}</p>
                      <p className="text-xs text-surface-500">{r.subject} · {r.term} · {formatDate(r.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-surface-900">{r.score}<span className="text-surface-400 text-sm font-normal">/{r.total}</span></p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {pct >= 50 ? <TrendingUp size={13} className="text-success-500" /> : <TrendingDown size={13} className="text-danger-500" />}
                        <span className={`text-xs font-medium ${pct >= 50 ? 'text-success-600' : 'text-danger-600'}`}>{pct}%</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <Pagination links={results.links} from={results.from} to={results.to} total={results.total} />
          </>
        ) : (
          <EmptyState icon={<Trophy size={28} />} title="No results yet" description="Your exam results will appear here once your teacher enters grades." />
        )}
      </Card>
    </AppLayout>
  )
}
export default StudentResults

// ─── Student Attendance Page ──────────────────────────────────────────────────
export function StudentAttendance({ attendance, summary, selectedMonth }: any) {
  const statusStyles: Record<string, string> = {
    present: 'bg-success-100 text-success-700 border-success-200',
    absent:  'bg-danger-100 text-danger-700 border-danger-200',
    late:    'bg-warning-100 text-warning-700 border-warning-200',
    excused: 'bg-surface-100 text-surface-600 border-surface-200',
  }

  return (
    <AppLayout title="My Attendance">
      <Head title="Attendance" />
      <PageHeader title="My Attendance" subtitle="Monthly attendance records"
        breadcrumbs={[{ label: 'Student' }, { label: 'Attendance' }]} />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries({ present: summary.present, absent: summary.absent, late: summary.late, excused: summary.excused }).map(([status, count]) => (
          <motion.div key={status} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`card p-4 border ${statusStyles[status]}`}>
            <p className="text-xs font-medium capitalize">{status}</p>
            <p className="text-2xl font-bold mt-0.5">{count}</p>
          </motion.div>
        ))}
      </div>

      {/* Attendance rate bar */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700">Overall Attendance Rate</span>
          <span className={`text-lg font-bold ${summary.rate >= 75 ? 'text-success-600' : summary.rate >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>{summary.rate}%</span>
        </div>
        <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${summary.rate}%` }} transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${summary.rate >= 75 ? 'bg-success-500' : summary.rate >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`} />
        </div>
        {summary.rate < 75 && (
          <p className="text-xs text-warning-600 mt-2">⚠ Attendance below 75% threshold. Please attend classes regularly.</p>
        )}
      </Card>

      {/* Attendance records */}
      <Card padding="none" className="overflow-hidden">
        {attendance.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {attendance.map((att: any, i: number) => (
              <motion.div key={att.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-surface-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-surface-800">{new Date(att.date).getDate()}</span>
                  <span className="text-[10px] text-surface-400 uppercase">{new Date(att.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-800">{new Date(att.date).toLocaleDateString('en', { weekday: 'long' })}</p>
                  {att.note && <p className="text-xs text-surface-500">{att.note}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${statusStyles[att.status] ?? ''}`}>{att.status}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState title="No records" description="No attendance records for this period." />
        )}
      </Card>
    </AppLayout>
  )
}

// ─── Announcements Page (shared layout, used by all roles) ────────────────────
export function AnnouncementsPage({ announcements, role }: any) {
  return (
    <AppLayout title="Announcements">
      <Head title="Announcements" />
      <PageHeader title="Announcements" subtitle="Institution notices and updates"
        breadcrumbs={[{ label: role }, { label: 'Announcements' }]} />

      <div className="space-y-4">
        {announcements.data?.length > 0 ? (
          announcements.data.map((ann: any, i: number) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card hover>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="brand" className="capitalize">{ann.audience === 'all' ? 'Everyone' : ann.audience}</Badge>
                      <span className="text-xs text-surface-400">{formatDate(ann.published_at)}</span>
                    </div>
                    <h3 className="font-semibold text-surface-900 mb-2">{ann.title}</h3>
                    <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <EmptyState title="No announcements" description="Check back later for institution notices and updates." />
        )}
      </div>

      {announcements.last_page > 1 && (
        <div className="mt-5">
          <Pagination links={announcements.links} from={announcements.from} to={announcements.to} total={announcements.total} />
        </div>
      )}
    </AppLayout>
  )
}
