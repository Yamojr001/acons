import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Button, Avatar, Badge } from '@/Components/UI'
import { Input, Select } from '@/Components/UI/Advanced'
import { Plus, Search, MoreVertical, Trash2, Edit } from 'lucide-react'
import type { PageProps, Student, ClassRoom } from '@/types'

interface StudentsProps extends PageProps {
  students: { data: Student[]; links: any[] }
  classrooms: ClassRoom[]
  filters: any
}

export default function Students({ students, classrooms, filters }: StudentsProps) {
  const { data, setData, get } = useForm({
    search: filters.search || '',
    class_room_id: filters.class_room_id || '',
  })
  
  const { delete: destroy } = useForm()

  function handleFilter() {
    get('/admin/students', { preserveState: true })
  }

  return (
    <AppLayout title="Students Directory">
      <Head title="Students Directory" />

      <PageHeader
        title="Students Directory"
        subtitle="Manage enrollments, assign classes, and view academic standings."
        actions={
          <Link href="/admin/students/create">
            <Button variant="primary" icon={<Plus size={16} />}>
              Add Student
            </Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input 
            leftIcon={<Search size={16} />} 
            placeholder="Search students..." 
            value={data.search}
            onChange={(e) => setData('search', e.target.value)}
            className="flex-1"
          />
          <Select
            options={classrooms.map(c => ({ value: String(c.id), label: c.name }))}
            value={data.class_room_id}
            onChange={(e) => setData('class_room_id', e.target.value)}
            placeholder="All Classes"
            className="w-full sm:w-64"
          />
          <Button variant="outline" onClick={handleFilter}>Filter</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-surface-50 border-b border-surface-200 text-sm text-surface-500 font-medium">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Admission #</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 flex justify-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-surface-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.data.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.user?.name} size="sm" />
                        <div>
                          <p className="font-semibold text-surface-900">{student.user?.name}</p>
                          <p className="text-xs text-surface-500">{student.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm tracking-wider text-surface-700 bg-surface-100 px-2 py-1 rounded-md">
                        {student.admission_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="brand">{student.class_room?.name || 'Unassigned'}</Badge>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm text-surface-700">
                      {student.gender}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={student.status === 'active' ? 'success' : 'danger'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                         <Link href={`/admin/students/${student.id}/edit`}>
                           <Button variant="ghost" size="sm" icon={<Edit size={14} />} />
                         </Link>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-danger-500 hover:text-danger-700"
                           icon={<Trash2 size={14} />} 
                           onClick={() => {
                             if(confirm('Are you sure you want to completely remove this student?')) {
                               destroy(`/admin/students/${student.id}`);
                             }
                           }}
                         />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
    </AppLayout>
  )
}
