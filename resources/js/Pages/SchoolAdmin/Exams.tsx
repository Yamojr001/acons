import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Button, Badge } from '@/Components/UI'
import { Plus, Calendar } from 'lucide-react'
import type { PageProps } from '@/types'

interface Exam {
  id: number; title: string; term: string; exam_date: string;
  total_marks: number; passing_marks: number;
  class_room?: { name: string }; subject?: { name: string }
  grades_count?: number
}
interface ExamsProps extends PageProps {
  exams: { data: Exam[]; links: any[] }
  classrooms: { id: number; name: string }[]
  filters: any
}

export default function Exams({ exams, classrooms, filters }: ExamsProps) {
  return (
    <AppLayout title="Exams">
      <Head title="Exams" />
      <PageHeader
        title="Exams"
        subtitle="Schedule, manage and track academic assessments"
        actions={<Button variant="primary" icon={<Plus size={16} />}>Schedule Exam</Button>}
      />
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-50 border-b border-surface-200 text-xs text-surface-500 uppercase">
              <tr>
                {['Title', 'Subject', 'Class', 'Term', 'Date', 'Marks', 'Graded'].map(h => (
                  <th key={h} className="px-6 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {exams.data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-surface-400">No exams scheduled yet.</td></tr>
              ) : (
                exams.data.map(exam => (
                  <tr key={exam.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-sm text-surface-900">{exam.title}</td>
                    <td className="px-6 py-4 text-sm text-surface-600">{exam.subject?.name ?? '—'}</td>
                    <td className="px-6 py-4"><Badge variant="brand">{exam.class_room?.name ?? '—'}</Badge></td>
                    <td className="px-6 py-4 text-xs text-surface-500 capitalize">{exam.term} term</td>
                    <td className="px-6 py-4 text-sm flex items-center gap-1.5 text-surface-700">
                      <Calendar size={13} /> {exam.exam_date}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold">{exam.total_marks}</span>
                      <span className="text-surface-400"> / pass {exam.passing_marks}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {exam.grades_count ?? 0} graded
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
