import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { Users, BookOpen, ChevronRight } from 'lucide-react'
import type { PageProps, ClassRoom, Student, User } from '@/types'

type StudentWithUser = Student & { user?: User }
type ClassRoomData = ClassRoom & { students_count: number; students?: StudentWithUser[] }

interface Props extends PageProps {
  classes: ClassRoomData[]
}

export default function Classes({ classes }: Props) {
  return (
    <AppLayout title="My Classes">
      <Head title="My Classes" />

      <div className="mb-6">
        <h1 className="page-title">My Classes</h1>
        <p className="text-sm text-surface-500 mt-1">
          Manage your assigned classes and view student rosters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <Card key={cls.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                    <BookOpen size={24} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-surface-900">{cls.name}</h3>
                    <p className="text-sm text-surface-500">Academic Year: {cls.academic_year}</p>
                  </div>
                </div>
                <Badge variant="neutral" className="flex items-center gap-1.5">
                  <Users size={14} /> {cls.students_count} Students
                </Badge>
              </div>

              <div className="flex-1 mt-2">
                <h4 className="text-sm font-medium text-surface-700 mb-2">Recent Students</h4>
                {cls.students && cls.students.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cls.students.slice(0, 5).map(student => (
                      <div key={student.id} className="text-xs px-2.5 py-1 bg-surface-100 text-surface-700 rounded-md border border-surface-200">
                        {student.user?.name || 'Unknown'}
                      </div>
                    ))}
                    {cls.students.length > 5 && (
                      <div className="text-xs px-2.5 py-1 bg-surface-50 text-surface-500 rounded-md border border-surface-200">
                        +{cls.students.length - 5} more
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500 italic">No students enrolled yet.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-surface-100 flex flex-wrap gap-2 justify-end">
                <Link href={`/lecturer/my-courses/${cls.id}/subjects`}>
                  <Button variant="outline" size="sm">Manage Subjects</Button>
                </Link>
                <Button variant="primary" size="sm" className="group">
                  View Roster
                  <ChevronRight size={16} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
                <BookOpen size={32} className="text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">No Classes Assigned</h3>
              <p className="text-surface-500 max-w-sm">
                You haven't been assigned to any classes yet. Please contact the institution administrator.
              </p>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
