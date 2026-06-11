import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, AlertCircle, X, Search, FileText, 
  HelpCircle, Eye, CornerDownRight, Check, Award, ArrowLeftRight, ChevronRight, Download
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { useState } from 'react'
import type { PageProps } from '@/types'

interface StudentRecord {
  student_name: string
  matric_number: string
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade_letter: string | null
  approval_status: string
}

interface CourseResult {
  id: number
  name: string
  code: string
  credit_units: number
  level: string
  department_name: string
  lecturer_name: string
  total_graded: number
  passed: number
  failed: number
  absent: number
  pass_rate: number
  failure_rate: number
  mean_score: number
  status: 'released' | 'pending_release' | 'pending_hod' | 'draft' | 'no_grades'
  rejection_reason: string | null
  students: StudentRecord[]
}

interface Props extends PageProps {
  courses: CourseResult[]
  semester_name: string
  is_provost: boolean
}

// Declare reusable form input subcomponents outside component render scope to avoid keystroke focus issues
function TextareaField({ label, required, placeholder, value, onChange, error }: {
  label: string
  required?: boolean
  placeholder?: string
  value: string
  onChange: (val: string) => void
  error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      <textarea
        required={required}
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none shadow-sm"
      />
      {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
    </div>
  )
}

export default function RegistrarResultsIndex({ courses = [], semester_name, is_provost }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  const rejectForm = useForm({
    reason: ''
  })

  const releaseForm = useForm({})

  // Metrics Calculations
  const gradedCourses = courses.filter(c => c.total_graded > 0)
  const totalGraded = gradedCourses.reduce((sum, c) => sum + c.total_graded, 0)
  const totalPassed = gradedCourses.reduce((sum, c) => sum + c.passed, 0)
  const totalFailed = gradedCourses.reduce((sum, c) => sum + c.failed, 0)
  const passRate = totalGraded > 0 ? Math.round((totalPassed / totalGraded) * 100) : 0

  // Bulk pending release counter
  const pendingCount = courses.filter(c => c.status === 'pending_release').length

  const handleOpenReview = (course: CourseResult) => {
    setSelectedCourse(course)
  }

  const handleReleaseAll = () => {
    if (confirm(`Are you sure you want to approve and release all ${pendingCount} HOD-approved course results for the entire semester? This will instantly publish grades and allow students to view their full results together without any partial results.`)) {
      releaseForm.post('/registrar/results/release-all', {
        onSuccess: () => {
          setSelectedCourse(null)
        }
      })
    }
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return

    rejectForm.post(`/registrar/results/${selectedCourse.id}/reject`, {
      onSuccess: () => {
        setIsRejectOpen(false)
        setSelectedCourse(null)
        rejectForm.reset()
      }
    })
  }

  // Filters
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.department_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'pending_release') return matchesSearch && c.status === 'pending_release'
    if (statusFilter === 'released') return matchesSearch && c.status === 'released'
    if (statusFilter === 'pending_hod') return matchesSearch && (c.status === 'pending_hod' || c.status === 'draft')
    return matchesSearch
  })

  return (
    <AppLayout>
      <Head title="Results Approval Queue" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Results & Records Portal</h1>
          <p className="text-sm text-surface-500 mt-1">Review full course result aggregates, audit performance metrics, and release semester grades to students in bulk.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <Badge variant="brand" className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider shadow-sm h-10 flex items-center justify-center">
            Active Session: {semester_name} Semester
          </Badge>
          {is_provost ? (
            <Button 
              variant="primary" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-bold uppercase py-2 h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              onClick={handleReleaseAll}
              disabled={releaseForm.processing || pendingCount === 0}
            >
              <CheckCircle size={16} />
              {releaseForm.processing ? 'Releasing...' : `Release All Results (${pendingCount})`}
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-100 text-surface-600 font-bold uppercase tracking-wider text-xs border border-surface-200 shadow-sm h-10">
              <Award size={15} />
              Audit Mode (Registrar)
            </div>
          )}
        </div>
      </div>

      {/* Caching/Single Release Information Banner */}
      <div className="mb-8 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex gap-3 text-emerald-800 text-xs shadow-sm">
        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px]">Academic Integrity & Unified Release Policy</p>
          <p className="mt-1 font-medium leading-relaxed">
            Results are released in bulk for the entire semester. This ensures students can access their complete performance summary (no partial results). Any course card displaying <span className="font-bold">"Pending Release"</span> indicates HOD-approved grades that are waiting for the final bulk release trigger. {is_provost ? 'As Provost, you have authority to approve and release grades.' : 'As Registrar, you are operating in read-only audit mode.'}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Total Graded Scripts</p>
          <p className="text-3xl font-display font-bold mt-1">{totalGraded}</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Passed Scripts</p>
          <p className="text-3xl font-display font-bold mt-1">{totalPassed}</p>
        </Card>
        <Card className="bg-gradient-to-br from-danger-500 to-danger-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Failed Scripts</p>
          <p className="text-3xl font-display font-bold mt-1">{totalFailed}</p>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Aggregated Pass Rate</p>
          <p className="text-3xl font-display font-bold mt-1">{passRate}%</p>
        </Card>
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="mb-8 p-4 bg-surface-50/50">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by course code, title, or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'pending_release', label: `Pending Release (${pendingCount})` },
              { id: 'released', label: 'Released' },
              { id: 'pending_hod', label: 'Pending HOD / Draft' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm border whitespace-nowrap
                  ${statusFilter === f.id 
                    ? 'bg-brand-500 text-white border-brand-500' 
                    : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Courses Queue */}
      <AnimatePresence mode="wait">
        {filteredCourses.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCourses.map((c) => {
              const passPct = c.total_graded > 0 ? Math.round((c.passed / c.total_graded) * 100) : 0
              return (
                <Card key={c.id} className="hover:shadow-md transition-all border border-surface-150 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex items-start justify-between gap-4 border-b border-surface-100 pb-4 mb-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">{c.code}</p>
                        <h3 className="font-bold text-surface-900 mt-0.5 line-clamp-1">{c.name}</h3>
                      </div>
                      <Badge 
                        variant={
                          c.status === 'released' 
                            ? 'success' 
                            : c.status === 'pending_release' 
                            ? 'warning' 
                            : c.status === 'pending_hod'
                            ? 'neutral'
                            : 'neutral'
                        }
                        className="font-bold uppercase tracking-wider text-[10px]"
                      >
                        {c.status === 'released' 
                          ? 'Released' 
                          : c.status === 'pending_release' 
                          ? 'Pending Release' 
                          : c.status === 'pending_hod' 
                          ? 'Pending HOD' 
                          : c.status === 'no_grades'
                          ? 'No Grades'
                          : 'Draft'}
                      </Badge>
                    </div>

                    <div className="text-xs text-surface-500 font-medium space-y-2 mt-2">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span className="font-bold text-surface-700">{c.department_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lecturer:</span>
                        <span className="font-bold text-surface-700">{c.lecturer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Load:</span>
                        <span className="font-bold text-surface-700">{c.credit_units} Credits / Level {c.level}</span>
                      </div>
                    </div>

                    {/* Stats metrics block */}
                    {c.total_graded > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-surface-50 border border-surface-100 text-center">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-surface-400">Total Graded</p>
                          <p className="text-xs font-bold text-surface-800 mt-0.5">{c.total_graded}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-surface-400">Pass / Fail</p>
                          <p className="text-xs font-bold text-surface-800 mt-0.5">
                            <span className="text-emerald-600">{c.passed}</span> / <span className="text-danger-600">{c.failed}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-surface-400">Pass Rate</p>
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">{passPct}%</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-5 p-3 rounded-2xl bg-surface-50 border border-dashed border-surface-200 text-surface-400 text-xs">
                        <HelpCircle size={15} />
                        <span>Results have not been processed.</span>
                      </div>
                    )}

                    {/* Warning warning warning */}
                    {c.rejection_reason && (
                      <div className="mt-4 p-3 rounded-xl bg-danger-50 text-danger-700 text-xs flex gap-2 items-start border border-danger-100">
                        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">Rejection Comment: {c.rejection_reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-surface-100 mt-5 pt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs py-2 h-9 rounded-xl font-bold flex items-center justify-center gap-1.5"
                      onClick={() => handleOpenReview(c)}
                    >
                      <Eye size={14} />
                      Audit Details & Review
                    </Button>
                  </div>
                </Card>
              )
            })}
          </motion.div>
        ) : (
          <EmptyState 
            title="No Results Found"
            description="We couldn't find any courses matching your search query or selected tab filters."
            icon={<FileText size={40} />}
          />
        )}
      </AnimatePresence>

      {/* Grade Sheet Review Drawer Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setSelectedCourse(null)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Badge variant="brand" className="font-bold uppercase tracking-wider text-[10px]">{selectedCourse.code}</Badge>
                    <Badge 
                      variant={
                        selectedCourse.status === 'released' 
                          ? 'success' 
                          : selectedCourse.status === 'pending_release' 
                          ? 'warning' 
                          : 'neutral'
                      }
                      className="font-bold uppercase tracking-wider text-[10px]"
                    >
                      {selectedCourse.status === 'released' ? 'Released' : selectedCourse.status === 'pending_release' ? 'Pending Approval' : selectedCourse.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-surface-900 text-lg mt-1">{selectedCourse.name}</h3>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="text-surface-400 hover:text-surface-600 transition-colors p-1.5 hover:bg-surface-100 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Course Details Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] uppercase font-bold text-surface-450 tracking-wider">Department</span>
                    <p className="text-sm font-bold text-surface-800 mt-0.5 line-clamp-1">{selectedCourse.department_name}</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] uppercase font-bold text-surface-450 tracking-wider">Lecturer</span>
                    <p className="text-sm font-bold text-surface-800 mt-0.5 line-clamp-1">{selectedCourse.lecturer_name}</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] uppercase font-bold text-surface-450 tracking-wider">Pass Rate</span>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">{selectedCourse.total_graded > 0 ? `${selectedCourse.pass_rate}%` : '0%'}</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] uppercase font-bold text-surface-450 tracking-wider">Failure Rate</span>
                    <p className="text-sm font-bold text-danger-600 mt-0.5">{selectedCourse.total_graded > 0 ? `${selectedCourse.failure_rate}%` : '0%'}</p>
                  </div>
                </div>

                {/* Students list */}
                <div>
                  <h4 className="font-bold text-surface-900 mb-3 text-xs uppercase tracking-wider">Student Grading Roster</h4>
                  {selectedCourse.students.length > 0 ? (
                    <div className="border border-surface-150 rounded-2xl overflow-hidden shadow-sm">
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead className="bg-surface-50/70 border-b border-surface-150 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs">Student</th>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs">Matric Number</th>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs text-center">CA (30)</th>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs text-center">Exam (70)</th>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs text-center">Total</th>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs text-center">Grade</th>
                              <th className="px-4 py-3 font-semibold text-surface-600 text-xs text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-100 bg-white">
                            {selectedCourse.students.map((student, idx) => (
                              <tr key={idx} className="hover:bg-surface-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-surface-800">{student.student_name}</td>
                                <td className="px-4 py-3 text-surface-600 font-mono text-xs">{student.matric_number}</td>
                                <td className="px-4 py-3 text-center text-surface-600 font-semibold">{student.ca_score ?? '-'}</td>
                                <td className="px-4 py-3 text-center text-surface-600 font-semibold">{student.exam_score ?? '-'}</td>
                                <td className="px-4 py-3 text-center font-bold text-indigo-600">{student.total_score ?? '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${student.grade_letter === 'F' ? 'bg-danger-50 text-danger-700' : 'bg-brand-50 text-brand-700'}`}>
                                    {student.grade_letter ?? '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Badge variant={student.approval_status === 'approved' ? 'success' : student.approval_status === 'hod_approved' ? 'warning' : 'neutral'} className="text-[10px] uppercase font-bold tracking-wider">
                                    {student.approval_status === 'approved' ? 'Released' : student.approval_status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-surface-200 rounded-2xl text-surface-400 text-sm">
                      No student records found enrolled for this course in the current semester.
                    </div>
                  )}
                </div>

                {/* Audit Actions block */}
                {selectedCourse.rejection_reason && (
                  <div className="p-4 bg-danger-50 border border-danger-100 rounded-2xl text-xs text-danger-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <AlertCircle size={14} />
                      Active Audit Review Hold Comment
                    </p>
                    <p className="mt-1 font-medium">{selectedCourse.rejection_reason}</p>
                  </div>
                )}

              </div>

              {/* Drawer Footer Actions */}
              <div className="px-6 py-4 border-t border-surface-100 bg-surface-50/50 flex justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>Close</Button>
                {selectedCourse.status === 'pending_release' && is_provost && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 border-danger-200 hover:border-danger-300"
                      size="sm" 
                      onClick={() => setIsRejectOpen(true)}
                    >
                      Send Back for HOD Review
                    </Button>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </AnimatePresence>

      {/* Rejection Form Comment Drawer Modal */}
      <AnimatePresence>
        {isRejectOpen && selectedCourse && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-[60] transition-opacity" onClick={() => setIsRejectOpen(false)} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold text-surface-900">Request Course Results Review</h3>
                  <button onClick={() => setIsRejectOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors p-1 rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRejectSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="bg-amber-50 border border-amber-150 rounded-xl p-3.5 text-xs text-amber-800 flex gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <p className="font-medium">
                      By sending this course result sheet back, you are requesting the HOD and course lecturer to correct errors, adjust, or verify entries. Rejection requires a detailed note.
                    </p>
                  </div>

                  <TextareaField
                    label="Rejection Reason & Revision Guidelines"
                    required
                    placeholder="Provide a clear, itemized detail of the issues or errors observed in this sheet..."
                    value={rejectForm.data.reason}
                    onChange={(val) => rejectForm.setData('reason', val)}
                    error={rejectForm.errors.reason}
                  />

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="bg-danger-600 hover:bg-danger-700 text-white border-0" size="sm" loading={rejectForm.processing}>
                      Confirm Send Back
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </AppLayout>
  )
}
