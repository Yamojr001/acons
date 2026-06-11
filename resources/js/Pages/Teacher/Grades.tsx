import { useState, useCallback } from 'react'
import { Head, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Save, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Badge } from '@/Components/UI'
import { PageHeader, Select } from '@/Components/UI/Advanced'
import { cn, debounce } from '@/lib/utils'
import type { PageProps, Exam, Student } from '@/types'

interface GradeEntry { student_id: number; score: number | ''; grade_letter: string; remarks: string; saved: boolean; error?: string }

interface TeacherGradesProps extends PageProps {
  exams: Exam[]
  selectedExam: Exam | null
  students: Array<Student & { user: { name: string; avatar: string | null }; existing_grade?: { score: number; grade_letter: string; remarks: string } }>
}

function scoreToGrade(score: number, total: number): string {
  const pct = (score / total) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 75) return 'B+'
  if (pct >= 70) return 'B'
  if (pct >= 65) return 'C+'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

function gradeColor(letter: string): string {
  if (letter.startsWith('A')) return 'text-success-600 bg-success-50'
  if (letter.startsWith('B')) return 'text-blue-600 bg-blue-50'
  if (letter.startsWith('C')) return 'text-warning-600 bg-warning-50'
  if (letter === 'D') return 'text-orange-600 bg-orange-50'
  return 'text-danger-600 bg-danger-50'
}

export default function TeacherGrades({ exams, selectedExam, students }: TeacherGradesProps) {
  const [grades, setGrades] = useState<Record<number, GradeEntry>>(() => {
    const init: Record<number, GradeEntry> = {}
    students.forEach(s => {
      init[s.id] = {
        student_id: s.id,
        score: s.existing_grade?.score ?? '',
        grade_letter: s.existing_grade?.grade_letter ?? '',
        remarks: s.existing_grade?.remarks ?? '',
        saved: !!s.existing_grade,
      }
    })
    return init
  })
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [bulkSaving, setBulkSaving] = useState(false)

  const updateScore = useCallback((studentId: number, value: string) => {
    const numeric = value === '' ? '' : Math.min(Number(value), selectedExam?.total_marks ?? 100)
    const letter = typeof numeric === 'number' && numeric >= 0 ? scoreToGrade(numeric, selectedExam?.total_marks ?? 100) : ''
    setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], score: numeric, grade_letter: letter, saved: false } }))
  }, [selectedExam])

  function saveGrade(studentId: number) {
    const grade = grades[studentId]
    if (grade.score === '') return
    setSaving(prev => ({ ...prev, [studentId]: true }))
    router.post('/lecturer/grades', {
      exam_id: selectedExam?.id,
      student_id: studentId,
      score: grade.score,
      grade_letter: grade.grade_letter,
      remarks: grade.remarks,
    }, {
      preserveState: true,
      onSuccess: () => {
        setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], saved: true } }))
        setSaving(prev => ({ ...prev, [studentId]: false }))
      },
      onError: () => setSaving(prev => ({ ...prev, [studentId]: false })),
    })
  }

  function saveAll() {
    setBulkSaving(true)
    const entries = Object.values(grades).filter(g => g.score !== '')
    router.post('/lecturer/grades/bulk', { exam_id: selectedExam?.id, entries }, {
      onSuccess: () => {
        setGrades(prev => {
          const updated = { ...prev }
          Object.keys(updated).forEach(id => { updated[+id].saved = true })
          return updated
        })
        setBulkSaving(false)
      },
      onError: () => setBulkSaving(false),
    })
  }

  const savedCount = Object.values(grades).filter(g => g.saved).length
  const enteredCount = Object.values(grades).filter(g => g.score !== '').length

  return (
    <AppLayout title="Grade Entry">
      <Head title="Grade Entry" />
      <PageHeader title="Grade Entry" subtitle="Enter and save student scores for exams"
        breadcrumbs={[{ label: 'Lecturer' }, { label: 'Grades' }]}
        actions={selectedExam && enteredCount > 0 ? (
          <Button variant="success" loading={bulkSaving} icon={<Save size={14} />} onClick={saveAll}>
            Save All ({enteredCount})
          </Button>
        ) : undefined}
      />

      {/* Exam selector */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Select Exam" value={selectedExam?.id ?? ''} placeholder="Choose an exam…"
            options={exams.map(e => ({ value: e.id, label: `${e.title} — ${e.term}` }))}
            onChange={e => router.get('/lecturer/grades', { exam_id: e.target.value }, { preserveState: true })} />
          {selectedExam && (
            <div className="flex items-end gap-4 pb-0.5">
              <div className="text-sm text-surface-500">
                <span className="font-medium text-surface-800">{selectedExam.title}</span><br />
                Total marks: <strong>{selectedExam.total_marks}</strong> · Pass: <strong>{selectedExam.passing_marks}</strong>
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedExam && students.length > 0 ? (
        <>
          {/* Stats */}
          <div className="flex items-center gap-6 mb-4 text-sm text-surface-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-success-500" /> {savedCount} saved</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={15} className="text-brand-500" /> {enteredCount} entered</span>
            <span>{students.length} total students</span>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="table-head text-left w-64">Student</th>
                    <th className="table-head text-left w-32">Score <span className="font-normal text-surface-400">/ {selectedExam.total_marks}</span></th>
                    <th className="table-head text-left w-24">Grade</th>
                    <th className="table-head text-left">Remarks</th>
                    <th className="table-head text-left w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => {
                    const g = grades[student.id]
                    const isBelowPass = typeof g?.score === 'number' && g.score < selectedExam.passing_marks
                    return (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className={cn('table-row', isBelowPass && typeof g.score === 'number' && g.score >= 0 ? 'bg-danger-50/30' : '')}>
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                              {student.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900">{student.user.name}</p>
                              <p className="text-xs text-surface-500">{student.admission_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <input
                            type="number" min={0} max={selectedExam.total_marks}
                            value={g?.score ?? ''}
                            onChange={e => updateScore(student.id, e.target.value)}
                            onBlur={() => saveGrade(student.id)}
                            className={cn('w-24 input py-1.5 text-sm text-center font-mono',
                              isBelowPass ? 'border-danger-300 bg-danger-50' : ''
                            )}
                            placeholder="0"
                          />
                        </td>
                        <td className="table-cell">
                          {g?.grade_letter ? (
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold', gradeColor(g.grade_letter))}>
                              {g.grade_letter}
                            </span>
                          ) : <span className="text-surface-300 text-sm">—</span>}
                        </td>
                        <td className="table-cell">
                          <input type="text" value={g?.remarks ?? ''} placeholder="Optional remarks"
                            onChange={e => setGrades(prev => ({ ...prev, [student.id]: { ...prev[student.id], remarks: e.target.value, saved: false } }))}
                            onBlur={() => g.score !== '' && saveGrade(student.id)}
                            className="input py-1.5 text-sm w-full min-w-[160px]" />
                        </td>
                        <td className="table-cell">
                          {saving[student.id] ? (
                            <span className="text-xs text-surface-400 animate-pulse">Saving…</span>
                          ) : g?.saved ? (
                            <span className="flex items-center gap-1 text-xs text-success-600"><CheckCircle2 size={13} /> Saved</span>
                          ) : g?.score !== '' ? (
                            <span className="text-xs text-warning-600 flex items-center gap-1"><AlertCircle size={13} /> Unsaved</span>
                          ) : <span className="text-xs text-surface-300">—</span>}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="text-center py-16 text-surface-400">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Select an exam above to begin entering grades.</p>
          </div>
        </Card>
      )}
    </AppLayout>
  )
}
