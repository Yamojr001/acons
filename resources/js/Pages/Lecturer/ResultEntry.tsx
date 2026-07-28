import { Head, router, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Search, Users, Save, 
  AlertCircle, CheckCircle, ChevronDown, Filter,
  UserMinus, UserCheck, Calculator, Send
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { useState, useEffect } from 'react'
import type { PageProps } from '@/types'

interface StudentResult {
  registration_id: number
  name: string
  matric_number: string
  ca_score: number | null
  exam_score: number | null
  is_absent: boolean
  total_score: number | null
  grade: string | null
}

interface Props extends PageProps {
  courses: any[]
  students: StudentResult[]
  selectedCourseId: number | null
  selectedCourse: any
  rejectionReason: string | null
  sheetStatus: 'no_grades' | 'draft' | 'submitted' | 'approved'
}

export default function ResultEntry({ courses, students, selectedCourseId, selectedCourse, rejectionReason, sheetStatus }: Props) {
  const [localResults, setLocalResults] = useState<StudentResult[]>(students)
  
  const { data, setData, post, processing } = useForm({
    course_id: selectedCourseId,
    results: localResults as unknown as Record<string, any>[]
  })

  useEffect(() => {
    setLocalResults(students)
  }, [students])

  useEffect(() => {
    setLocalResults(students)
  }, [students])

  const handleScoreChange = (index: number, field: 'ca_score' | 'exam_score', value: string) => {
    const updated = [...localResults]
    let numValue = value === '' ? null : parseFloat(value)
    
    // Prevent exceeding max capacity
    if (numValue !== null) {
      if (field === 'ca_score' && numValue > 30) numValue = 30;
      if (field === 'exam_score' && numValue > 70) numValue = 70;
      if (numValue < 0) numValue = 0;
    }

    updated[index][field] = numValue
    
    // Auto-calculate total and grade for UI feedback
    if (!updated[index].is_absent) {
       const total = (updated[index].ca_score || 0) + (updated[index].exam_score || 0)
       updated[index].total_score = total
       updated[index].grade = calculateGradeLetter(total)
    }
    
    setLocalResults(updated)
  }

  const toggleAbsent = (index: number) => {
    const updated = [...localResults]
    updated[index].is_absent = !updated[index].is_absent
    if (updated[index].is_absent) {
      updated[index].ca_score = null
      updated[index].exam_score = null
      updated[index].total_score = null
      updated[index].grade = 'ABS'
    } else {
       updated[index].grade = null
    }
    setLocalResults(updated)
  }

  const calculateGradeLetter = (score: number) => {
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 45) return 'D'
    if (score >= 40) return 'E'
    return 'F'
  }

  const [isSaving, setIsSaving] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    router.post(`/lecturer/courses/${selectedCourseId}/grades`, {
      course_id: selectedCourseId,
      results: localResults as unknown as Record<string, any>[]
    }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsSaving(false),
      onError: (errors) => {
        const errorMsg = Object.values(errors)[0] as string;
        alert("Failed to save draft: " + errorMsg);
      }
    })
  }

  const handleSubmitToHod = () => {
    if (confirm('Are you sure you want to submit this grade sheet to the HOD? Once submitted, scores cannot be modified unless sent back for revisions.')) {
      router.post(`/lecturer/courses/${selectedCourseId}/grades/submit`, {}, {
        preserveState: true
      })
    }
  }

  const handleCourseSelect = (id: string) => {
    router.get('/lecturer/grades', { course_id: id }, { preserveState: true })
  }

  const isSheetLocked = sheetStatus === 'submitted' || sheetStatus === 'approved'

  return (
    <AppLayout title="Result Entry">
      <Head title="Academic Grading" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Score Sheet Management</h1>
          <p className="text-sm text-surface-500 mt-1">Enter Continuous Assessment (CA) and Examination marks.</p>
        </div>
        {selectedCourse && (
          <div className="flex items-center gap-2">
            {!isSheetLocked ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={submit} 
                  disabled={isSaving} 
                  iconLeft={<Save size={18} />}
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button 
                  variant="brand" 
                  onClick={handleSubmitToHod} 
                  disabled={isSaving || localResults.length === 0} 
                  iconLeft={<Send size={18} />}
                >
                  Submit to HOD
                </Button>
              </>
            ) : (
              <Badge 
                variant={sheetStatus === 'approved' ? 'success' : 'neutral'} 
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                {sheetStatus === 'approved' ? 'Approved & Finalized' : 'Submitted to HOD (Locked)'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {rejectionReason && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-100 rounded-2xl flex gap-3 items-start shadow-sm">
          <AlertCircle size={20} className="text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-danger-800">HOD Score Sheet Revision Required</h4>
            <p className="text-xs text-danger-700 mt-1 italic font-medium">"{rejectionReason}"</p>
            <p className="text-[10px] text-danger-600 mt-2 font-bold uppercase tracking-wider">Please review the marks list below, apply edits, and re-save to resubmit.</p>
          </div>
        </div>
      )}

      {isSheetLocked && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 items-start shadow-sm">
          <CheckCircle size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-indigo-800">Grade Sheet Locked</h4>
            <p className="text-xs text-indigo-700 mt-1">
              This score sheet has been {sheetStatus === 'approved' ? 'approved and finalized by the department' : 'submitted to the HOD for verification'}. Further modifications are blocked.
            </p>
          </div>
        </div>
      )}

      <Card className="mb-8 bg-surface-50/50">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Select Course to Grade</label>
            <div className="relative">
              <select 
                value={selectedCourseId || ''}
                onChange={(e) => handleCourseSelect(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white border border-surface-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none transition-all cursor-pointer shadow-sm"
              >
                <option value="">Choose a course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" size={18} />
            </div>
          </div>
          
          {selectedCourse && (
            <div className="flex items-center gap-4 pb-1">
              <div className="text-right">
                <p className="text-[10px] text-surface-400 uppercase font-bold">Grading Status</p>
                <Badge variant={sheetStatus === 'approved' ? 'success' : sheetStatus === 'submitted' ? 'neutral' : 'warning'} className="capitalize font-bold text-[10px] mt-0.5">
                  {sheetStatus === 'no_grades' ? 'Not Graded' : sheetStatus.replace('_', ' ')}
                </Badge>
              </div>
              <div className="h-8 w-px bg-surface-200" />
              <div className="text-right">
                <p className="text-[10px] text-surface-400 uppercase font-bold">Students</p>
                <p className="text-sm font-bold text-surface-900">{students.length}</p>
              </div>
              <div className="h-8 w-px bg-surface-200" />
              <div className="text-right">
                <p className="text-[10px] text-surface-400 uppercase font-bold">Course Units</p>
                <p className="text-sm font-bold text-surface-900">{selectedCourse.credit_units}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {selectedCourseId ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {localResults.length > 0 ? (
              <Card padding="none" className="overflow-hidden shadow-xl border-surface-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-50 text-[10px] uppercase tracking-wider text-surface-500 font-bold border-b border-surface-100">
                      <tr>
                        <th className="px-6 py-4">Matric Number</th>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4 text-center w-32">CA (30)</th>
                        <th className="px-6 py-4 text-center w-32">Exam (70)</th>
                        <th className="px-6 py-4 text-center w-24">Total</th>
                        <th className="px-6 py-4 text-center w-24">Grade</th>
                        <th className="px-6 py-4 text-center w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 bg-white">
                      {localResults.map((res, i) => (
                        <tr key={res.registration_id} className={`hover:bg-brand-50/20 transition-colors group ${res.is_absent ? 'bg-surface-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono font-bold text-surface-900">{res.matric_number}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-surface-700">{res.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="number"
                              min={0}
                              max={30}
                              disabled={res.is_absent || isSheetLocked}
                              value={res.ca_score === null ? '' : res.ca_score}
                              onChange={(e) => handleScoreChange(i, 'ca_score', e.target.value)}
                              className={`w-full px-3 py-2 text-center rounded-lg border text-sm font-bold outline-none transition-all
                                ${res.is_absent || isSheetLocked ? 'bg-surface-100 border-surface-200' : 'border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'}`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="number"
                              min={0}
                              max={70}
                              disabled={res.is_absent || isSheetLocked}
                              value={res.exam_score === null ? '' : res.exam_score}
                              onChange={(e) => handleScoreChange(i, 'exam_score', e.target.value)}
                              className={`w-full px-3 py-2 text-center rounded-lg border text-sm font-bold outline-none transition-all
                                ${res.is_absent || isSheetLocked ? 'bg-surface-100 border-surface-200' : 'border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'}`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-surface-900">
                             {res.is_absent ? '-' : (res.total_score ?? '-')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge 
                              variant={res.grade === 'F' || res.grade === 'ABS' ? 'danger' : res.grade === 'A' ? 'success' : 'neutral'}
                              className="w-10 justify-center font-bold"
                            >
                              {res.grade || '-'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              type="button"
                              disabled={isSheetLocked}
                              onClick={() => toggleAbsent(i)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all
                                ${res.is_absent 
                                  ? 'bg-danger-50 text-danger-700 border border-danger-100' 
                                  : 'bg-surface-100 text-surface-600 border border-surface-200 hover:bg-surface-200'}
                                ${isSheetLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {res.is_absent ? <UserMinus size={12} /> : <UserCheck size={12} />}
                              {res.is_absent ? 'Absent' : 'Present'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="py-20">
                <EmptyState 
                  title="No Registered Students" 
                  description="No students have registered for this course in the current semester."
                  icon={<Users size={48} className="text-surface-200" />}
                />
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <Calculator size={64} className="mx-auto text-surface-100 mb-4" />
            <h2 className="text-xl font-bold text-surface-400">Select a course to start result entry</h2>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
