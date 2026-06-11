import { Head } from '@inertiajs/react'
import { BookOpen, Users, ArrowRight } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  courses: any[]
  currentSemester: any
}

export default function LecturerCourses({ courses, currentSemester }: Props) {
  return (
    <AppLayout title="My Courses">
      <Head title="Assigned Courses" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-surface-900">Teaching Assignments</h1>
        <p className="text-sm text-surface-500 mt-1">Manage your courses for the {currentSemester?.name || 'current semester'}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.length > 0 ? courses.map(course => (
          <Card key={course.id} className="hover:border-brand-200 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <BookOpen size={24} />
              </div>
              <Badge variant="outline">{course.credit_units} Units</Badge>
            </div>
            <h3 className="font-bold text-lg text-surface-900 mb-1">{course.code}: {course.name}</h3>
            <p className="text-sm text-surface-500 mb-6">{course.department?.name || 'Academic Course'}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-surface-100">
              <div className="flex items-center gap-2 text-surface-600">
                <Users size={16} />
                <span className="text-sm font-medium">{course.registrations_count} Students</span>
              </div>
              <Button size="sm" variant="brand" iconRight={<ArrowRight size={14} />}>View Students</Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-full">
            <EmptyState 
              title="No Courses Assigned"
              description="You have not been assigned any courses for this semester yet."
              icon={<BookOpen size={48} />}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
