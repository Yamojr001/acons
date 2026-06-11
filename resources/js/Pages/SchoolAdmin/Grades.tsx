import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Badge } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Grade { id: number; score: number; grade_letter?: string; student?: { user: { name: string } } }
interface Exam { id: number; title: string; class_room?: { name: string }; subject?: { name: string }; exam_date: string; total_marks: number }
interface GradesProps extends PageProps {
  exams: Exam[]
  selected_exam?: Exam & { classRoom?: { students?: any[] }; grades?: Grade[] }
  filters: { exam_id?: string }
}

const gradeColor: Record<string, any> = { 'A+': 'success', 'A': 'success', 'B+': 'brand', 'B': 'brand', 'C+': 'warning', 'C': 'warning', 'D': 'danger', 'F': 'danger' }

export default function Grades({ exams, selected_exam, filters }: GradesProps) {
  return (
    <AppLayout title="Grades">
      <Head title="Grade Book" />
      <PageHeader title="Grade Book" subtitle="Record and review student exam scores" />

      <div className="flex gap-4 mb-6">
        <select
          className="input text-sm py-2 max-w-xs"
          defaultValue={filters.exam_id ?? ''}
          onChange={e => { window.location.href = `/admin/grades?exam_id=${e.target.value}` }}
        >
          <option value="">— Select Exam —</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>
              {e.title} — {e.class_room?.name} ({e.exam_date})
            </option>
          ))}
        </select>
      </div>

      {selected_exam ? (
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-surface-900">{selected_exam.title}</h3>
              <p className="text-xs text-surface-500">{selected_exam.class_room?.name} — Max marks: {selected_exam.total_marks}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-50 border-b border-surface-200 text-xs text-surface-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Percentage</th>
                  <th className="px-6 py-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {(selected_exam.grades ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-surface-400">No grades recorded for this exam yet.</td></tr>
                ) : (
                  (selected_exam.grades ?? []).map(g => (
                    <tr key={g.id} className="hover:bg-surface-50">
                      <td className="px-6 py-4 text-sm font-medium text-surface-900">{g.student?.user?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm font-mono">{g.score} / {selected_exam.total_marks}</td>
                      <td className="px-6 py-4 text-sm">{Math.round((g.score / selected_exam.total_marks) * 100)}%</td>
                      <td className="px-6 py-4">
                        <Badge variant={gradeColor[g.grade_letter ?? 'F'] ?? 'danger'}>{g.grade_letter ?? 'F'}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="py-12 text-center text-surface-400">
          Select an exam above to view or enter grades.
        </Card>
      )}
    </AppLayout>
  )
}
