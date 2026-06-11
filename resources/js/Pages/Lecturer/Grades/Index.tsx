import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Save, AlertTriangle, Users, BookOpen, CheckCircle } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, Input } from '@/Components/UI'
import { useState } from 'react'

interface StudentRegistration {
  id: number
  status: string
  student: {
    matriculation_number: string
    user: { name: string }
  }
  grade?: {
    ca_score: number
    exam_score: number
    total_score: number
    grade_letter: string
    approval_status: 'draft' | 'hod_approved' | 'dean_approved' | 'senate_approved'
  }
}

interface Course {
  id: number
  code: string
  name: string
  credit_units: number
}

interface GradesIndexProps {
  course: Course
  registrations: StudentRegistration[]
  gradingScale: '4.0' | '5.0'
}

export default function LecturerGradesIndex({ course, registrations, gradingScale }: GradesIndexProps) {
  // Initialize form state with existing grades
  const { data, setData, post, processing, errors } = useForm({
    grades: registrations.map(reg => ({
      registration_id: reg.id,
      ca_score: reg.grade?.ca_score ?? '',
      exam_score: reg.grade?.exam_score ?? '',
    }))
  })

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Determine if grades are locked (anything past draft)
  const isLocked = registrations.some(reg => 
    reg.grade && reg.grade.approval_status !== 'draft'
  )

  const handleScoreChange = (index: number, field: 'ca_score' | 'exam_score', value: string) => {
    if (isLocked) return

    const numValue = value === '' ? '' : Math.max(0, Number(value))
    
    // Prevent exceeding limits (CA: 40 max, Exam: 60/100 depending on rules. We'll enforce 40/60 here conceptually)
    if (field === 'ca_score' && Number(numValue) > 40) return
    if (field === 'exam_score' && Number(numValue) > 60) return

    const newGrades = [...data.grades]
    newGrades[index] = { ...newGrades[index], [field]: numValue }
    
    setData('grades', newGrades)
    setHasUnsavedChanges(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/lecturer/courses/${course.id}/grades`, {
      onSuccess: () => setHasUnsavedChanges(false)
    })
  }

  // Calculate dynamic letter grade for UI feedback
  const previewGrade = (ca: number | string, exam: number | string) => {
    const total = Number(ca || 0) + Number(exam || 0)
    if (total === 0) return '-'
    
    if (gradingScale === '5.0') {
      if (total >= 70) return 'A'
      if (total >= 60) return 'B'
      if (total >= 50) return 'C'
      if (total >= 45) return 'D'
      if (total >= 40) return 'E'
      return 'F'
    } else {
      if (total >= 75) return 'A'
      if (total >= 65) return 'AB'
      if (total >= 60) return 'B'
      if (total >= 55) return 'BC'
      if (total >= 50) return 'C'
      return 'F'
    }
  }

  return (
    <AppLayout title="Grade Processing">
      <Head title={`${course.code} - Grades`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Result Processing</h1>
          <p className="text-surface-500 flex items-center gap-2 mt-1">
            <BookOpen size={16} /> {course.code} - {course.name} ({course.credit_units} Units)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="neutral" className="px-3 py-1">
            <Users size={14} className="mr-1 inline" /> {registrations.length} Students
          </Badge>
          <Badge variant="brand" className="px-3 py-1 uppercase">{gradingScale} Scale</Badge>
        </div>
      </div>

      {isLocked ? (
        <div className="mb-6 p-4 rounded-xl bg-warning-50 border border-warning-200 flex items-start gap-3">
          <AlertTriangle className="text-warning-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-warning-800">Results Locked</h3>
            <p className="text-sm text-warning-700">These results have been forwarded to the HOD/Dean for approval. You can no longer edit them without an official alteration request.</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-success-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-surface-900">Draft Mode Active</p>
              <p className="text-sm text-surface-500">Grades are automatically saved as 'Draft'. They will only become visible to students after Senate approval.</p>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={processing || !hasUnsavedChanges}
            iconLeft={<Save size={16} />}
          >
            {processing ? 'Saving...' : 'Save Drafts'}
          </Button>
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-50 text-surface-500 uppercase tracking-wider text-xs font-semibold border-b border-surface-100">
              <tr>
                <th className="px-6 py-4">Matric No.</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4 w-32">C.A (40)</th>
                <th className="px-6 py-4 w-32">Exam (60)</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {registrations.length > 0 ? registrations.map((reg, index) => {
                const currentData = data.grades[index]
                const total = Number(currentData.ca_score || 0) + Number(currentData.exam_score || 0)
                const gradeLetter = previewGrade(currentData.ca_score, currentData.exam_score)
                
                return (
                  <motion.tr 
                    key={reg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-surface-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-surface-900">
                      {reg.student.matriculation_number}
                    </td>
                    <td className="px-6 py-4 text-surface-700">
                      {reg.student.user.name}
                    </td>
                    <td className="px-6 py-3">
                      <Input 
                        type="number"
                        min="0" max="40"
                        value={currentData.ca_score}
                        onChange={(e) => handleScoreChange(index, 'ca_score', e.target.value)}
                        disabled={isLocked}
                        className="w-full text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <Input 
                        type="number"
                        min="0" max="60"
                        value={currentData.exam_score}
                        onChange={(e) => handleScoreChange(index, 'exam_score', e.target.value)}
                        disabled={isLocked}
                        className="w-full text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-surface-900">
                      {total > 0 ? total : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {total > 0 ? (
                        <div className={`inline-flex w-8 h-8 rounded-lg items-center justify-center font-bold
                          ${gradeLetter.includes('A') ? 'bg-success-100 text-success-700' :
                            gradeLetter === 'F' ? 'bg-danger-100 text-danger-700' :
                            'bg-brand-100 text-brand-700'}`}
                        >
                          {gradeLetter}
                        </div>
                      ) : '-'}
                    </td>
                  </motion.tr>
                )
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-400">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No students have registered for this course yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  )
}
