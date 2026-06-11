import { Head, Link } from '@inertiajs/react'
import { ChevronLeft, Pencil, User, Mail, Phone, Calendar, BookOpen, GraduationCap } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Avatar, Badge } from '@/Components/UI'
import { PageHeader } from '@/Components/UI/Advanced'
import { formatDate } from '@/lib/utils'
import type { PageProps, Teacher, ClassRoom } from '@/types'

interface Props extends PageProps {
  teacher: Teacher & {
    user: { name: string; email: string; avatar: string | null; phone: string | null }
    class_rooms: ClassRoom[]
  }
}

export default function ShowTeacher({ teacher }: Props) {
  return (
    <AppLayout title="Teacher Details">
      <Head title={`Teacher: ${teacher.user.name}`} />
      
      <div className="mb-6">
        <Link href="/admin/teachers" className="inline-flex items-center text-sm text-surface-500 hover:text-brand-600 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Teachers
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={teacher.user.name} src={teacher.user.avatar} size="xl" className="mb-4" />
            <h2 className="text-xl font-bold text-surface-900">{teacher.user.name}</h2>
            <p className="text-sm text-surface-500 mb-4">{teacher.qualification || 'No qualification listed'}</p>
            <Badge variant="success">Active Staff</Badge>
            
            <div className="w-full mt-6 pt-6 border-t border-surface-100 space-y-4">
              <div className="flex items-center gap-3 text-sm text-surface-600">
                <Mail size={16} className="text-surface-400" />
                <span className="truncate">{teacher.user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-surface-600">
                <Phone size={16} className="text-surface-400" />
                <span>{teacher.user.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-surface-600">
                <Calendar size={16} className="text-surface-400" />
                <span>Joined {formatDate(teacher.hire_date)}</span>
              </div>
            </div>

            <Link href={`/admin/teachers/${teacher.id}/edit`} className="w-full mt-6">
              <Button variant="outline" className="w-full" icon={<Pencil size={14} />}>Edit Profile</Button>
            </Link>
          </div>
        </Card>

        {/* Details & Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Employment Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wider font-bold mb-1">Employee ID</p>
                <p className="text-sm font-medium text-surface-900">{teacher.employee_id}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 uppercase tracking-wider font-bold mb-1">Hire Date</p>
                <p className="text-sm font-medium text-surface-900">{formatDate(teacher.hire_date)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-surface-400 uppercase tracking-wider font-bold mb-1">Qualification</p>
                <p className="text-sm font-medium text-surface-900">{teacher.qualification || '—'}</p>
              </div>
            </div>
          </Card>

          <Card title="Assigned Classes">
            {teacher.class_rooms?.length > 0 ? (
              <div className="divide-y divide-surface-100">
                {teacher.class_rooms.map(cls => (
                  <div key={cls.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-900">{cls.name}</p>
                      <p className="text-xs text-surface-500">{cls.academic_year}</p>
                    </div>
                    <Link href={`/admin/classrooms/${cls.id}`}>
                      <Button variant="ghost" size="sm">View Class</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 py-4 italic">No classes assigned yet.</p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
