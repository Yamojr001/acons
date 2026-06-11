// ────────────────────────────────────────────────────────────────────────────
// School Admin: Teachers Page
// ────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Plus, Search, UserCheck, MoreHorizontal, Eye, Pencil, Trash2, BookOpen, Users } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Badge, Avatar, EmptyState } from '@/Components/UI'
import { PageHeader, DataTable, Column, Pagination, SearchInput, ConfirmDialog } from '@/Components/UI/Advanced'
import { formatDate, staggerContainer, staggerItem } from '@/lib/utils'
import type { PageProps, Teacher, PaginatedData, ClassRoom, Subject } from '@/types'

interface TeachersPageProps extends PageProps {
  teachers: PaginatedData<Teacher & {
    user: { name: string; email: string; avatar: string | null; phone: string | null }
    classes_count: number
    subjects_count: number
  }>
  filters: { search?: string }
}

export function TeachersPage({ teachers, filters }: TeachersPageProps) {
  const [search, setSearch] = useState(filters.search ?? '')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  function handleSearch(v: string) {
    setSearch(v)
    router.get('/admin/teachers', { search: v }, { preserveState: true, replace: true })
  }

  function confirmDelete() {
    if (!deleteId) return
    router.delete(`/admin/teachers/${deleteId}`, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <AppLayout title="Teachers">
      <Head title="Teachers" />
      <PageHeader title="Teachers" subtitle={`${teachers.total} staff members`}
        actions={<Link href="/admin/teachers/create"><Button variant="primary" size="sm" icon={<Plus size={14} />}>Add Teacher</Button></Link>} />

      <div className="flex gap-3 mb-5">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search teachers…" className="max-w-xs flex-1" />
      </div>

      <Card padding="none" className="overflow-hidden">
        {teachers.data.length > 0 ? (
          <>
            <div className="divide-y divide-surface-100">
              {teachers.data.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4">
                  <Avatar name={t.user.name} src={t.user.avatar} size="md" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900">{t.user.name}</p>
                    <p className="text-xs text-surface-500">{t.user.email} · {t.employee_id}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-surface-500">
                    <span className="flex items-center gap-1"><BookOpen size={13} /> {t.subjects_count} subjects</span>
                    <span className="flex items-center gap-1"><Users size={13} /> {t.classes_count} classes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/teachers/${t.id}`}><Button variant="ghost" size="sm" icon={<Eye size={14} />} /></Link>
                    <Link href={`/admin/teachers/${t.id}/edit`}><Button variant="ghost" size="sm" icon={<Pencil size={14} />} /></Link>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="hover:text-danger-600" onClick={() => setDeleteId(t.id)} />
                  </div>
                </motion.div>
              ))}
            </div>
            <Pagination links={teachers.links} from={teachers.from} to={teachers.to} total={teachers.total} />
          </>
        ) : (
          <EmptyState icon={<UserCheck size={28} />} title="No teachers found"
            action={<Link href="/admin/teachers/create"><Button variant="primary" icon={<Plus size={14} />}>Add First Teacher</Button></Link>} />
        )}
      </Card>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete}
        title="Remove Teacher" message="This will delete the teacher's account and all associated records. This action cannot be undone."
        confirmLabel="Delete Teacher" />
    </AppLayout>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// School Admin: Exams Page
// ────────────────────────────────────────────────────────────────────────────
import { Head as ExamHead, Link as ExamLink, router as examRouter } from '@inertiajs/react'
import type { Exam, ClassRoom as CR, Subject as Sub } from '@/types'

interface ExamsPageProps extends PageProps {
  exams: PaginatedData<Exam & { class_room: { name: string }; subject: { name: string }; grades_count: number }>
  classrooms: CR[]
  subjects: Sub[]
  filters: { search?: string; class_room_id?: string; term?: string }
}

function ExamsPage({ exams, classrooms, subjects, filters }: ExamsPageProps) {
  const [search, setSearch] = useState(filters.search ?? '')

  function applyFilter(params: Record<string, string>) {
    examRouter.get('/admin/exams', { ...filters, ...params }, { preserveState: true, replace: true })
  }

  function statusBadge(exam: Exam) {
    const date = new Date(exam.exam_date)
    if (date < new Date()) return <Badge variant="success">Completed</Badge>
    const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
    if (days <= 7) return <Badge variant="danger">This Week</Badge>
    return <Badge variant="brand">Upcoming</Badge>
  }

  return (
    <AppLayout title="Exams">
      <ExamHead title="Exams" />
      <PageHeader title="Exams & Assessments" subtitle={`${exams.total} exams scheduled`}
        actions={<ExamLink href="/admin/exams/create"><Button variant="primary" size="sm" icon={<Plus size={14} />}>Create Exam</Button></ExamLink>} />

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput value={search} onChange={v => { setSearch(v); applyFilter({ search: v }) }} placeholder="Search exams…" className="max-w-xs flex-1" />
        <select className="input text-sm py-2 max-w-[180px]" value={filters.class_room_id ?? ''} onChange={e => applyFilter({ class_room_id: e.target.value })}>
          <option value="">All Classes</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input text-sm py-2 max-w-[160px]" value={filters.term ?? ''} onChange={e => applyFilter({ term: e.target.value })}>
          <option value="">All Terms</option>
          <option value="first">First Term</option>
          <option value="second">Second Term</option>
          <option value="third">Third Term</option>
        </select>
      </div>

      <Card padding="none" className="overflow-hidden">
        {exams.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    {['Exam', 'Class', 'Subject', 'Date', 'Marks', 'Graded', 'Status', ''].map(h => (
                      <th key={h} className="table-head text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exams.data.map((exam, i) => (
                    <motion.tr key={exam.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                      <td className="table-cell font-medium text-surface-900">{exam.title}</td>
                      <td className="table-cell">{exam.class_room?.name}</td>
                      <td className="table-cell">{exam.subject?.name}</td>
                      <td className="table-cell text-surface-500 text-xs">{formatDate(exam.exam_date)}</td>
                      <td className="table-cell text-xs">{exam.passing_marks}/{exam.total_marks}</td>
                      <td className="table-cell text-xs">{exam.grades_count} grades</td>
                      <td className="table-cell">{statusBadge(exam)}</td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <ExamLink href={`/admin/exams/${exam.id}/edit`}><Button variant="ghost" size="sm" icon={<Pencil size={14} />} /></ExamLink>
                          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="hover:text-danger-600"
                            onClick={() => confirm('Delete exam?') && examRouter.delete(`/admin/exams/${exam.id}`)} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination links={exams.links} from={exams.from} to={exams.to} total={exams.total} />
          </>
        ) : (
          <EmptyState title="No exams yet" description="Create your first exam to get started."
            action={<ExamLink href="/admin/exams/create"><Button variant="primary" icon={<Plus size={14} />}>Create Exam</Button></ExamLink>} />
        )}
      </Card>
    </AppLayout>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// School Admin: Payments Page
// ────────────────────────────────────────────────────────────────────────────
import { Payment } from '@/types'

interface PaymentsPageProps extends PageProps {
  payments: PaginatedData<Payment & { student: { user: { name: string } }; fee: { title: string } }>
  summary: { total_collected: number; this_month: number; pending: number; failed: number }
  filters: { search?: string; status?: string }
}

function PaymentsPage({ payments, summary, filters }: PaymentsPageProps) {
  const [search, setSearch] = useState(filters.search ?? '')

  function applyFilter(params: Record<string, string>) {
    router.get('/admin/payments', { ...filters, ...params }, { preserveState: true, replace: true })
  }

  const methodIcons: Record<string, string> = { stripe: '💳', paystack: '🏦', monnify: '📱', cash: '💵' }

  return (
    <AppLayout title="Payments">
      <Head title="Payments" />
      <PageHeader title="Payment History" subtitle="All fee transactions" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Collected', value: formatCurrency(summary.total_collected), color: 'text-success-600', bg: 'bg-success-50' },
          { label: 'This Month',      value: formatCurrency(summary.this_month),      color: 'text-brand-600',   bg: 'bg-brand-50' },
          { label: 'Pending',         value: formatCurrency(summary.pending),          color: 'text-warning-600', bg: 'bg-warning-50' },
          { label: 'Failed',          value: formatCurrency(summary.failed),           color: 'text-danger-600',  bg: 'bg-danger-50' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-surface-500">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <SearchInput value={search} onChange={v => { setSearch(v); applyFilter({ search: v }) }} placeholder="Search by reference…" className="flex-1 max-w-xs" />
        <select className="input text-sm py-2 max-w-[160px]" value={filters.status ?? ''} onChange={e => applyFilter({ status: e.target.value })}>
          <option value="">All Status</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <Card padding="none" className="overflow-hidden">
        {payments.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    {['Student', 'Fee', 'Amount', 'Method', 'Reference', 'Date', 'Status'].map(h => (
                      <th key={h} className="table-head text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.data.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                      <td className="table-cell font-medium text-sm">{p.student?.user?.name ?? '—'}</td>
                      <td className="table-cell text-sm text-surface-600">{p.fee?.title ?? '—'}</td>
                      <td className="table-cell font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="table-cell text-sm capitalize">{methodIcons[p.payment_method] ?? '💰'} {p.payment_method}</td>
                      <td className="table-cell font-mono text-xs text-surface-500">{p.reference}</td>
                      <td className="table-cell text-xs text-surface-500">{formatDate(p.created_at)}</td>
                      <td className="table-cell"><Badge variant={statusColor(p.status) as any} dot>{p.status}</Badge></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination links={payments.links} from={payments.from} to={payments.to} total={payments.total} />
          </>
        ) : (
          <EmptyState title="No payments yet" description="Payment records will appear here once students start paying fees." />
        )}
      </Card>
    </AppLayout>
  )
}

// Re-export all as named exports + default for each
export { TeachersPage as default }

// ── Standalone export helpers so Inertia can resolve each page ────────────────
export { ExamsPage, PaymentsPage }
