import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, AlertCircle, X, Search, FileText, 
  HelpCircle, Eye, CornerDownRight, Check, Award, ArrowLeftRight
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
  lecturer_name: string
  total_graded: number
  passed: number
  failed: number
  absent: number
  mean_score: number
  status: 'no_grades' | 'pending_approval' | 'approved'
  rejection_reason: string | null
  students: StudentRecord[]
}

interface Props extends PageProps {
  courses: CourseResult[]
  department_name: string
  semester_name: string
}

export default function HODResultsIndex({ courses, department_name, semester_name }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    course_id: '' as string | number,
    reason: ''
  })

  const handleOpenReview = (course: CourseResult) => {
    setSelectedCourse(course)
  }

  const handleApprove = (courseId: number) => {
    if (confirm('Are you sure you want to approve and finalize this grades sheet? Approved scores will immediately be visible to students.')) {
      post('/hod/results/approve', {
        data: { course_id: courseId },
        onSuccess: () => {
          setSelectedCourse(null)
        }
      })
    }
  }

  const handleRejectClick = (courseId: number) => {
    setData({ course_id: courseId, reason: '' })
    setIsRejectOpen(true)
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.reason.trim()) return

    post('/hod/results/reject', {
      onSuccess: () => {
        setIsRejectOpen(false)
        setSelectedCourse(null)
        reset()
      }
    })
  }

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'pending') return matchesSearch && c.status === 'pending_approval'
    if (statusFilter === 'approved') return matchesSearch && c.status === 'approved'
    if (statusFilter === 'no_grades') return matchesSearch && c.status === 'no_grades'
    return matchesSearch
  })

  // Global aggregates
  const gradedCourses = courses.filter(c => c.total_graded > 0)
  const totalGraded = gradedCourses.reduce((sum, c) => sum + c.total_graded, 0)
  const totalPassed = gradedCourses.reduce((sum, c) => sum + c.passed, 0)
  const totalFailed = gradedCourses.reduce((sum, c) => sum + c.failed, 0)
  const passRate = totalGraded > 0 ? Math.round((totalPassed / totalGraded) * 100) : 0

  return (
    <AppLayout title="Grades Approvals">
      <Head title="Results Approvals Desk" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Grades Approval Desk</h1>
          <p className="text-sm text-surface-500 mt-1">
            Department of {department_name} — Review lecturers score sheets, aggregates statistics, and finalize approvals.
          </p>
        </div>
        <Badge variant="brand" className="px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
          Active: {semester_name} Semester
        </Badge>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Graded Scripts</p>
          <p className="text-3xl font-display font-bold mt-1">{totalGraded}</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Passed Candidates</p>
          <p className="text-3xl font-display font-bold mt-1">{totalPassed}</p>
        </Card>
        <Card className="bg-gradient-to-br from-danger-500 to-danger-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Failed Candidates</p>
          <p className="text-3xl font-display font-bold mt-1">{totalFailed}</p>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-none shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Overall Pass Rate</p>
          <p className="text-3xl font-display font-bold mt-1">{passRate}%</p>
        </Card>
      </div>

      {/* Filter and search bar */}
      <Card className="mb-8 p-4 bg-surface-50/50">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by course code or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'approved', label: 'Approved Sheets' },
              { id: 'no_grades', label: 'Not Graded' }
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

      {/* Courses Results Queue Grid */}
      <AnimatePresence mode="wait">
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map((c, idx) => {
              const total = c.passed + c.failed + c.absent
              const passPct = total > 0 ? Math.round((c.passed / total) * 100) : 0
              
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-200 border-surface-200 flex flex-col h-full bg-white relative overflow-hidden group">
                    {/* Status corner badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-bold text-brand-600 tracking-wider uppercase">{c.code}</span>
                        <h3 className="text-base font-bold text-surface-900 mt-0.5 leading-snug">{c.name}</h3>
                      </div>
                      <Badge 
                        variant={
                          c.status === 'approved' 
                            ? 'success' 
                            : c.status === 'pending_approval' 
                            ? 'warning' 
                            : 'neutral'
                        }
                        className="font-bold uppercase tracking-wider text-[10px]"
                      >
                        {c.status === 'approved' 
                          ? 'Approved' 
                          : c.status === 'pending_approval' 
                          ? 'Pending' 
                          : 'No Grades'}
                      </Badge>
                    </div>

                    <div className="text-xs text-surface-500 font-medium space-y-2 mt-2">
                      <div className="flex justify-between">
                        <span>Lecturer:</span>
                        <span className="font-bold text-surface-700">{c.lecturer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Load / Level:</span>
                        <span className="font-bold text-surface-700">{c.credit_units} Credits / Level {c.level}</span>
                      </div>
                    </div>

                    {/* Stats section */}
                    {c.total_graded > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-surface-50 border border-surface-100 text-center">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-surface-400">Graded</p>
                          <p className="text-sm font-bold text-surface-800 mt-0.5">{c.total_graded}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-surface-400">Passed / Failed</p>
                          <p className="text-sm font-bold text-surface-800 mt-0.5">
                            <span className="text-emerald-600">{c.passed}</span> / <span className="text-danger-600">{c.failed}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-surface-400">Average / Pass %</p>
                          <p className="text-sm font-bold text-surface-800 mt-0.5">
                            {c.mean_score} / <span className="text-indigo-600">{passPct}%</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-5 p-3 rounded-2xl bg-surface-50 border border-dashed border-surface-200 text-surface-400 text-xs">
                        <HelpCircle size={15} />
                        <span>Scores have not been uploaded by the lecturer for this semester.</span>
                      </div>
                    )}

                    {/* Warning about HOD previous revisions request comments */}
                    {c.rejection_reason && (
                      <div className="mt-4 p-3 rounded-xl bg-danger-50 text-danger-700 text-xs flex gap-2 items-start border border-danger-100">
                        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold uppercase text-[9px] tracking-wider leading-none mb-1">Previous Revision Comments</p>
                          <p className="italic">"{c.rejection_reason}"</p>
                        </div>
                      </div>
                    )}

                    {/* Actions panel */}
                    <div className="mt-6 pt-4 border-t border-surface-100 flex items-center justify-between gap-3">
                      {c.total_graded > 0 ? (
                        <>
                          <Button 
                            variant="neutral" 
                            size="sm" 
                            onClick={() => handleOpenReview(c)} 
                            iconLeft={<Eye size={14} />}
                          >
                            Review Scores
                          </Button>
                          {c.status === 'pending_approval' && (
                            <div className="flex gap-2">
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleRejectClick(c.id)}
                              >
                                Revise
                              </Button>
                              <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => handleApprove(c.id)}
                                iconLeft={<Check size={14} />}
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[10px] text-surface-400 italic font-medium">Awaiting score submissions</div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <Card className="py-24">
            <EmptyState 
              title="No Results to Approve"
              description="No curriculum scores matched your active queries."
              icon={<FileText size={48} className="text-surface-200" />}
            />
          </Card>
        )}
      </AnimatePresence>

      {/* Review Marks Sheet Drawer/Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedCourse(null)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-surface-100 relative z-10 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-100 bg-surface-50/50 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">{selectedCourse.code}</span>
                    <h2 className="text-lg font-bold text-surface-900">{selectedCourse.name}</h2>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">Lecturer: {selectedCourse.lecturer_name} • Total Enrolled: {selectedCourse.students.length} students</p>
                </div>
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <table className="w-full text-left">
                  <thead className="bg-surface-50 text-[10px] uppercase tracking-wider text-surface-500 font-bold border-b border-surface-100 sticky top-0 bg-white">
                    <tr>
                      <th className="px-6 py-3">Matric Number</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3 text-center w-24">CA (30)</th>
                      <th className="px-6 py-3 text-center w-24">Exam (70)</th>
                      <th className="px-6 py-3 text-center w-24">Total</th>
                      <th className="px-6 py-3 text-center w-24">Grade</th>
                      <th className="px-6 py-3 text-center w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {selectedCourse.students.map((stud, sidx) => (
                      <tr key={sidx} className="hover:bg-brand-50/10 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-mono font-bold text-surface-900">{stud.matric_number}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-medium text-surface-700">{stud.student_name}</span>
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-surface-800">
                          {stud.ca_score ?? '-'}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-surface-800">
                          {stud.exam_score ?? '-'}
                        </td>
                        <td className="px-6 py-3.5 text-center font-mono font-bold text-surface-900">
                          {stud.total_score ?? '-'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <Badge 
                            variant={stud.grade_letter === 'F' || stud.grade_letter === 'ABS' ? 'danger' : stud.grade_letter === 'A' ? 'success' : 'neutral'}
                            className="w-10 justify-center font-bold"
                          >
                            {stud.grade_letter || '-'}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <Badge 
                            variant={stud.approval_status === 'hod_approved' ? 'success' : 'warning'} 
                            className="text-[10px] font-semibold uppercase"
                          >
                            {stud.approval_status === 'hod_approved' ? 'Finalized' : 'Draft'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons inside Review drawer */}
              <div className="px-6 py-4 border-t border-surface-100 bg-surface-50/50 flex justify-between items-center flex-shrink-0">
                <Button variant="neutral" onClick={() => setSelectedCourse(null)}>
                  Close Reviewer
                </Button>
                {selectedCourse.status === 'pending_approval' && (
                  <div className="flex gap-2">
                    <Button 
                      variant="danger" 
                      onClick={() => handleRejectClick(selectedCourse.id)}
                    >
                      Send Back for Revisions
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={() => handleApprove(selectedCourse.id)}
                      iconLeft={<CheckCircle size={16} />}
                    >
                      Approve Scores List
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Back / Preview Rejections Modal */}
      <AnimatePresence>
        {isRejectOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsRejectOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-surface-100 relative z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-100 bg-surface-50/50">
                <div className="flex items-center gap-2 text-danger-600">
                  <AlertCircle size={18} />
                  <h2 className="text-base font-bold">Request Result Revisions</h2>
                </div>
                <button 
                  onClick={() => setIsRejectOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                <p className="text-xs text-surface-500 leading-normal">
                  Provide granular revision instructions. The assigned lecturer will instantly view this comment and will be required to re-verify/edit the grades list.
                </p>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Revision Reason / Remarks</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. Please verify the exam scores for students A and B. Marks appear transposed on the physical score script..."
                    value={data.reason}
                    onChange={(e) => setData('reason', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                  />
                  {errors.reason && <p className="text-xs text-danger-500 mt-1">{errors.reason}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="neutral" type="button" onClick={() => setIsRejectOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" type="submit" disabled={processing || !data.reason.trim()}>
                    {processing ? 'Sending...' : 'Confirm Send Back'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
