import { Head, useForm, Link } from '@inertiajs/react'
import { Save, ChevronLeft, UserPlus } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card } from '@/Components/UI'
import { Input, Select, Textarea, PageHeader } from '@/Components/UI/Advanced'
import type { PageProps } from '@/types'

export default function CreateTeacher({ auth }: PageProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    employee_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    qualification: '',
    phone: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/teachers')
  }

  return (
    <AppLayout title="Add Teacher">
      <Head title="Add Teacher" />
      <PageHeader title="Add New Teacher"
        breadcrumbs={[{ label: 'Teachers', href: '/admin/teachers' }, { label: 'New Teacher' }]} />

      <Card className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} placeholder="e.g. John Doe" />
            <Input label="Email Address *" type="email" value={data.email} onChange={e => setData('email', e.target.value)} error={errors.email} placeholder="john@school.com" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Employee ID *" value={data.employee_id} onChange={e => setData('employee_id', e.target.value)} error={errors.employee_id} placeholder="e.g. TCH-001" />
            <Input label="Hire Date *" type="date" value={data.hire_date} onChange={e => setData('hire_date', e.target.value)} error={errors.hire_date} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Number" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} error={errors.phone} placeholder="+234..." />
            <Input label="Qualification" value={data.qualification} onChange={e => setData('qualification', e.target.value)} error={errors.qualification} placeholder="e.g. B.Ed, M.Sc" />
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-surface-100">
            <Link href="/admin/teachers">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button variant="primary" loading={processing} icon={<UserPlus size={16} />}>
              Add Teacher
            </Button>
          </div>
        </form>
      </Card>
    </AppLayout>
  )
}
