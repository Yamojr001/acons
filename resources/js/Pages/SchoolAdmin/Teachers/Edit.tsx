import { Head, useForm, Link } from '@inertiajs/react'
import { Save, ChevronLeft, UserCheck } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card } from '@/Components/UI'
import { Input, Select, Textarea, PageHeader } from '@/Components/UI/Advanced'
import type { PageProps, Teacher } from '@/types'

interface Props extends PageProps {
  teacher: Teacher & { user: { name: string; email: string; phone: string | null } }
}

export default function EditTeacher({ teacher }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name:          teacher.user.name,
    employee_id:   teacher.employee_id,
    hire_date:     teacher.hire_date,
    qualification: teacher.qualification || '',
    phone:         teacher.user.phone || '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    put(`/admin/teachers/${teacher.id}`)
  }

  return (
    <AppLayout title="Edit Teacher">
      <Head title="Edit Teacher" />
      <PageHeader title={`Edit Teacher: ${teacher.user.name}`}
        breadcrumbs={[{ label: 'Teachers', href: '/admin/teachers' }, { label: 'Edit' }]} />

      <Card className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} />
            <Input label="Email Address" type="email" value={teacher.user.email} disabled hint="Email cannot be changed." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Employee ID *" value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} error={errors.employee_id} />
            <Input label="Hire Date *" type="date" value={data.hire_date} onChange={e => setData('hire_date', e.target.value)} error={errors.hire_date} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Number" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} error={errors.phone} />
            <Input label="Qualification" value={data.qualification} onChange={e => setData('qualification', e.target.value)} error={errors.qualification} />
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-surface-100">
            <Link href="/admin/teachers">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button variant="primary" loading={processing} icon={<Save size={16} />}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  )
}
