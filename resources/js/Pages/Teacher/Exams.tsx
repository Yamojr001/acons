import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { PenLine, Calendar, FileText, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PageProps, Exam, Subject, ClassRoom } from '@/types'

type ExamData = Exam & {
  subject?: Subject
  class_room?: ClassRoom
  grades_count?: number
}

interface Props extends PageProps {
  exams: {
    data: ExamData[]
    current_page: number
    last_page: number
    total: number
  }
}

export default function Exams({ exams }: Props) {
  return (
    <AppLayout title="My Exams">
      <Head title="My Exams" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Exams & Assessments</h1>
          <p className="text-sm text-surface-500 mt-1">
            View upcoming exams and manage grade entries.
          </p>
        </div>
      </div>

      {exams.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.data.map((exam) => {
            const isPast = new Date(exam.exam_date) < new Date()
            return (
              <Card key={exam.id} className="flex flex-col border-l-4" style={{ borderLeftColor: isPast ? 'var(--color-surface-300)' : 'var(--color-brand-500)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant={isPast ? 'secondary' : 'primary'} className="mb-2">
                      {isPast ? 'Completed' : 'Upcoming'}
                    </Badge>
                    <h3 className="text-lg font-semibold text-surface-900">{exam.title}</h3>
                  </div>
                  <div className="p-2 bg-brand-50 rounded-lg">
                    <FileText size={20} className="text-brand-600" />
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center text-sm text-surface-600">
                    <Calendar size={16} className="mr-2 text-surface-400" />
                    {formatDate(exam.exam_date, { dateStyle: 'medium' })}
                  </div>
                  {exam.subject && (
                    <div className="flex items-center text-sm text-surface-600">
                      <BookOpenIcon size={16} className="mr-2 text-surface-400" />
                      {exam.subject.name}
                    </div>
                  )}
                  {exam.class_room && (
                    <div className="flex items-center text-sm text-surface-600">
                      <UsersIcon size={16} className="mr-2 text-surface-400" />
                      {exam.class_room.name}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-surface-600">
                    <PenLine size={16} className="mr-2 text-surface-400" />
                    {exam.grades_count || 0} Grades Entered
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-100">
                  <Link href={`/lecturer/grades?exam=${exam.id}`} className="block">
                    <Button variant={isPast ? "primary" : "outline"} className="w-full justify-between group">
                      {isPast ? 'Enter / Edit Grades' : 'View Details'}
                      <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="py-12">
          <EmptyState
            title="No Exams Scheduled"
            description="You don't have any assessments scheduled for your classes currently. Assessments will appear here once the institution admin creates them."
            icon={<FileText size={48} className="text-surface-300" />}
          />
        </Card>
      )}
    </AppLayout>
  )
}

function BookOpenIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
}

function UsersIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
