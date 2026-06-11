// ─── Admin Fees Page ─────────────────────────────────────────────────────────
import { useState } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, DollarSign, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Badge, EmptyState } from '@/Components/UI'
import { PageHeader, Modal, Select, Pagination, SearchInput } from '@/Components/UI/Advanced'
import { Input, Textarea } from '@/Components/UI/Advanced'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import type { PageProps, PaginatedData, Fee, ClassRoom } from '@/types'

interface AdminFeesProps extends PageProps {
  fees: PaginatedData<Fee & { student: { user: { name: string }; class_room: { name: string } } }>
  summary: { total_collected: number; total_pending: number; total_overdue: number }
  classrooms: ClassRoom[]
  filters: { status?: string; search?: string; class_room_id?: string }
}

export default function AdminFees({ fees, summary, classrooms, filters, auth }: AdminFeesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const defaultTerm = (auth?.tenant?.current_term && auth?.tenant?.current_session) 
    ? `${auth.tenant.current_term} ${auth.tenant.current_session}`
    : ''

  const { data, setData, post, processing, errors, reset } = useForm({
    title:           '',
    term:            defaultTerm,
    amount:          '',
    due_date:        '',
    assignment_type: 'class',
    student_id:      '',
    class_room_id:   '',
  })

  function handleCreate() {
    post('/admin/fees', { onSuccess: () => { setShowCreateModal(false); reset() } })
  }

  function applyFilter(params: Record<string, string>) {
    router.get('/admin/fees', { ...filters, ...params }, { preserveState: true, replace: true })
  }

  const statusIcon = { paid: <CheckCircle2 size={16} className="text-success-500" />, pending: <Clock size={16} className="text-warning-500" />, overdue: <AlertCircle size={16} className="text-danger-500" />, partial: <Clock size={16} className="text-brand-500" /> }

  return (
    <AppLayout title="Fees">
      <Head title="Fees Management" />
      <PageHeader title="Fee Management" subtitle="Assign and track student fees"
        breadcrumbs={[{ label: 'School Admin' }, { label: 'Fees' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.post('/admin/fees/bulk-assign-portal-fee')}>
              Assign Portal Fee
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>
              Create Fee
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Collected', value: formatCurrency(summary.total_collected), icon: <DollarSign size={18} />, c: 'bg-success-50 text-success-600' },
          { label: 'Pending',         value: formatCurrency(summary.total_pending),   icon: <Clock size={18} />,       c: 'bg-warning-50 text-warning-600' },
          { label: 'Overdue',         value: formatCurrency(summary.total_overdue),   icon: <AlertCircle size={18} />, c: 'bg-danger-50 text-danger-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`card p-4 flex items-center gap-3 ${s.c.split(' ')[0]}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.c}`}>{s.icon}</div>
            <div><p className="text-xs text-surface-500">{s.label}</p><p className={`text-base font-bold ${s.c.split(' ')[1]}`}>{s.value}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput value={filters.search ?? ''} onChange={v => applyFilter({ search: v })} placeholder="Search student…" className="flex-1 max-w-xs" />
        <select className="input text-sm py-2 max-w-[160px]" value={filters.status ?? ''} onChange={e => applyFilter({ status: e.target.value })}>
          <option value="">All Status</option>
          {['paid','pending','overdue','partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select className="input text-sm py-2 max-w-[180px]" value={filters.class_room_id ?? ''} onChange={e => applyFilter({ class_room_id: e.target.value })}>
          <option value="">All Classes</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        {fees.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-surface-50 border-b border-surface-200">
                  {['Student', 'Class', 'Fee Title', 'Term', 'Amount', 'Due Date', 'Status'].map(h => <th key={h} className="table-head text-left whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {fees.data.map((fee, i) => (
                    <motion.tr key={fee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="table-row">
                      <td className="table-cell font-medium text-sm">{fee.student?.user?.name ?? '—'}</td>
                      <td className="table-cell text-sm text-surface-500">{fee.student?.class_room?.name ?? '—'}</td>
                      <td className="table-cell text-sm">{fee.title}</td>
                      <td className="table-cell text-xs text-surface-500">{fee.term}</td>
                      <td className="table-cell font-semibold">{formatCurrency(fee.amount)}</td>
                      <td className="table-cell text-xs text-surface-500">{formatDate(fee.due_date)}</td>
                      <td className="table-cell"><Badge variant={statusColor(fee.status) as any} dot className="capitalize">{fee.status}</Badge></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination links={fees.links} from={fees.from} to={fees.to} total={fees.total} />
          </>
        ) : (
          <EmptyState icon={<DollarSign size={28} />} title="No fees found"
            action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>Create Fee</Button>} />
        )}
      </Card>

      {/* Create Fee Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Fee Assignment" size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" loading={processing} onClick={handleCreate}>Assign Fee</Button>
          </>
        }>
        <div className="space-y-4">
          <Input label="Fee Title *" value={data.title} onChange={e => setData('title', e.target.value)} error={errors.title} placeholder="First Term School Fees" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Term *" value={data.term} onChange={e => setData('term', e.target.value)} error={errors.term}
              options={[{ value: 'First Term 2024/2025', label: 'First Term 2024/2025' }, { value: 'Second Term 2024/2025', label: 'Second Term 2024/2025' }, { value: 'Third Term 2024/2025', label: 'Third Term 2024/2025' }]}
              placeholder="Select term" />
            <Input label="Amount (₦) *" type="number" value={data.amount} onChange={e => setData('amount', e.target.value)} error={errors.amount} placeholder="45000" />
          </div>
          <Input label="Due Date *" type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} error={errors.due_date} />
          <Select label="Assign To *" value={data.assignment_type} onChange={e => setData('assignment_type', e.target.value)}
            options={[{ value: 'class', label: 'Entire Class' }, { value: 'all', label: 'All Students' }, { value: 'individual', label: 'Individual Student' }]} />
          {data.assignment_type === 'class' && (
            <Select label="Select Class *" value={data.class_room_id} onChange={e => setData('class_room_id', e.target.value)} error={errors.class_room_id}
              options={classrooms.map(c => ({ value: c.id, label: c.name }))} placeholder="Choose class…" />
          )}
        </div>
      </Modal>
    </AppLayout>
  )
}
