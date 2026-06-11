import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Eye, UserCheck } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Badge, Avatar, EmptyState } from '@/Components/UI'
import { PageHeader, Pagination, SearchInput, ConfirmDialog } from '@/Components/UI/Advanced'
import { formatDate } from '@/lib/utils'
import type { PageProps, Teacher, PaginatedData } from '@/types'

interface Props extends PageProps {
  teachers: PaginatedData<Teacher & {
    user: { name: string; email: string; avatar: string | null; phone: string | null }
    classes_count: number; subjects_count: number
  }>
  filters: { search?: string }
}

export default function Teachers({ teachers, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? '')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  return (
    <AppLayout title="Lecturers">
      <Head title="Lecturers" />
      <PageHeader title="Lecturers" subtitle={`${teachers.total} staff members`}
        breadcrumbs={[{ label: 'Registry' }, { label: 'Lecturers' }]}
        actions={<Link href="/admin/teachers/create"><Button variant="primary" size="sm" icon={<Plus size={14} />}>Add Lecturer</Button></Link>}
      />

      <div className="flex gap-3 mb-5">
          <SearchInput value={search} onChange={v => { setSearch(v); router.get('/admin/teachers', { search: v }, { preserveState: true, replace: true }) }}
          placeholder="Search lecturers…" className="max-w-xs flex-1" />
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
                    <p className="text-xs text-surface-500 mt-0.5">{t.user.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="neutral">ID: {t.employee_id}</Badge>
                      <span className="text-xs text-surface-400">{t.subjects_count} subjects · {t.classes_count} classes</span>
                    </div>
                  </div>
                  <p className="text-xs text-surface-400 hidden lg:block">Joined {formatDate(t.hire_date)}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
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
          <EmptyState icon={<UserCheck size={28} />} title="No lecturers found"
            description="Add your first lecturer to get started."
            action={<Link href="/admin/teachers/create"><Button variant="primary" icon={<Plus size={14} />}>Add Lecturer</Button></Link>}
          />
        )}
      </Card>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { router.delete(`/admin/teachers/${deleteId}`); setDeleteId(null) }}
        title="Remove Lecturer" message="This will delete the lecturer account and all associated data. This cannot be undone." confirmLabel="Delete" />
    </AppLayout>
  )
}
