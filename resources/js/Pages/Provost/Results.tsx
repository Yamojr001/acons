import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, AlertCircle, X, Search,
  FileText, HelpCircle, Eye, Award, Shield, Clock
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { useState } from 'react'
import type { PageProps } from '@/types'

interface CourseResult {
  id: number
  code: string
  title: string
  credit_units: number
  department: string
  lecturer: string
  counts: {
    total: number
    draft: number
    submitted: number
    hod_approved: number
    approved: number
    avg_score: number
  }
}

interface Props extends PageProps {
  courses: CourseResult[]
  current_semester: { id: number; name: string; academic_session?: { name: string } } | null
  semesters: any[]
  summary: {
    total_courses: number
    fully_released: number
    awaiting_release: number
    awaiting_hod: number
    in_draft: number
  }
}

function TextareaField({ label, required, placeholder, value, onChange, error }: {
  label: string; required?: boolean; placeholder?: string
  value: string; onChange: (val: string) => void; error?: string
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

export default function ProvostResults({ courses = [], current_semester, summary }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  const releaseAllForm = useForm({})
  const releaseCourseForm = useForm({})
  const rejectForm = useForm({ reason: '' })

  const pendingCount = courses.reduce((sum, c) => sum + c.counts.hod_approved, 0)

  const handleReleaseAll = () => {
    if (!confirm(`Release ALL ${pendingCount} HOD-approved result records to students for the current semester?\n\nThis will make grades visible to all affected students immediately. This action cannot be undone.`)) return
    releaseAllForm.post('/provost/results/release-all', { onSuccess: () => {} })
  }

  const handleReleaseCourse = (course: CourseResult) => {
    if (!confirm(`Release results for ${course.code} — ${course.title} to students?\n\n${course.counts.hod_approved} grade records will be published immediately.`)) return
    releaseCourseForm.post(`/provost/results/${course.id}/release`, {
      onSuccess: () => setSelectedCourse(null)
    })
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    rejectForm.post(`/provost/results/${selectedCourse.id}/reject`, {
      onSuccess: () => {
        setIsRejectOpen(false)
        setSelectedCourse(null)
        rejectForm.reset()
      }
    })
  }

  const filtered = courses.filter(c => {
    const matchSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.department.toLowerCase().includes(searchTerm.toLowerCase())
    if (statusFilter === 'pending') return matchSearch && c.counts.hod_approved > 0
    if (statusFilter === 'released') return matchSearch && c.counts.approved > 0 && c.counts.hod_approved === 0
    if (statusFilter === 'draft') return matchSearch && (c.counts.draft > 0 || c.counts.submitted > 0)
    return matchSearch
  })

  const getStatus = (c: CourseResult) => {
    if (c.counts.hod_approved > 0) return { label: 'Pending Release', variant: 'warning' as const }
    if (c.counts.approved > 0 && c.counts.hod_approved === 0) return { label: 'Released', variant: 'success' as const }
    if (c.counts.submitted > 0) return { label: 'Pending HOD', variant: 'neutral' as const }
    return { label: 'Draft', variant: 'neutral' as const }
  }

  return (
    <AppLayout title="Result Release Portal">
      <Head title="Provost — Result Release Authority" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Shield size={12} /> Provost — Exclusive Release Authority
          </div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Results Release Portal</h1>
          <p className="text-sm text-surface-500 mt-1">
            Review all HOD-approved results and release them to students.
            Only the Provost can authorise final grade release.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          {current_semester && (
            <Badge variant="brand" className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider shadow-sm h-10 flex items-center">
              Active: {current_semester.name}
            </Badge>
          )}
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-bold uppercase py-2 h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
            onClick={handleReleaseAll}
            disabled={releaseAllForm.processing || pendingCount === 0}
          >
            <CheckCircle size={16} />
            {releaseAllForm.processing ? 'Releasing...' : `Release All (${pendingCount})`}
          </Button>
        </div>
      </div>

      {/* Policy Banner */}
      <div className="mb-8 p-4 bg-indigo-50 border border-indigo-150 rounded-2xl flex gap-3 text-indigo-800 text-xs shadow-sm">
        <Award size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px]">Provost Release Policy — Academic Integrity</p>
          <p className="mt-1 font-medium leading-relaxed">
            Results follow a 4-stage workflow: <strong>Lecturer → HOD Approval → Provost Release → Student View</strong>.
            Only grades with status <strong>"Pending Release"</strong> (HOD-approved) can be released.
            Releasing sends all pending results to students at once, ensuring no partial disclosure.
            You may reject individual courses back to draft for revision before bulk release.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Courses', value: summary?.total_courses ?? 0, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Pending Release', value: summary?.awaiting_release ?? 0, color: 'from-amber-500 to-amber-600' },
          { label: 'Released', value: summary?.fully_released ?? 0, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Pending HOD', value: summary?.awaiting_hod ?? 0, color: 'from-sky-500 to-sky-600' },
          { label: 'In Draft', value: summary?.in_draft ?? 0, color: 'from-surface-400 to-surface-500' },
        ].map(s => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.color} text-white border-none shadow-md text-center`}>
            <p className="text-3xl font-display font-bold">{s.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
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
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'pending', label: `Pending Release (${summary?.awaiting_release ?? 0})` },
              { id: 'released', label: 'Released' },
              { id: 'draft', label: 'Draft / HOD Pending' },
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

      {/* Courses Grid */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map(course => {
              const status = getStatus(course)
              return (
                <Card key={course.id} className="flex flex-col justify-between border border-surface-150 hover:shadow-md transition-all overflow-hidden">
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-surface-100 pb-4 mb-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">{course.code}</p>
                        <h3 className="font-bold text-surface-900 mt-0.5 line-clamp-2">{course.title}</h3>
                      </div>
                      <Badge variant={status.variant} className="font-bold uppercase tracking-wider text-[10px] flex-shrink-0">
                        {status.label}
                      </Badge>
                    </div>

                    <div className="text-xs text-surface-500 font-medium space-y-2">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span className="font-bold text-surface-700 text-right truncate ml-2">{course.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lecturer:</span>
                        <span className="font-bold text-surface-700 text-right truncate ml-2">{course.lecturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Units:</span>
                        <span className="font-bold text-surface-700">{course.credit_units}</span>
                      </div>
                    </div>

                    {/* Grade counts */}
                    <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-surface-50 border border-surface-100 text-center">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-surface-400">Enrolled</p>
                        <p className="text-xs font-bold text-surface-800 mt-0.5">{course.counts.total}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-amber-500">Pending</p>
                        <p className="text-xs font-bold text-amber-700 mt-0.5">{course.counts.hod_approved}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-emerald-500">Released</p>
                        <p className="text-xs font-bold text-emerald-700 mt-0.5">{course.counts.approved}</p>
                      </div>
                    </div>

                    {course.counts.avg_score > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-surface-500">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${course.counts.avg_score >= 50 ? 'bg-emerald-500' : 'bg-danger-500'}`}
                            style={{ width: `${Math.min(course.counts.avg_score, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-surface-700 w-12 text-right">Avg {course.counts.avg_score}%</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-surface-100 mt-4 pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-xs py-2 h-9 rounded-xl font-bold flex items-center justify-center gap-1.5"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <Eye size={14} /> Review
                    </Button>
                    {course.counts.hod_approved > 0 && (
                      <Button
                        variant="primary"
                        className="flex-1 text-xs py-2 h-9 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 border-none flex items-center justify-center gap-1.5"
                        onClick={() => handleReleaseCourse(course)}
                        disabled={releaseCourseForm.processing}
                      >
                        <CheckCircle size={14} /> Release
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </motion.div>
        ) : (
          <EmptyState
            title="No Courses Found"
            description="No courses match your current search or filter."
            icon={<FileText size={40} />}
          />
        )}
      </AnimatePresence>

      {/* Course Detail Drawer */}
      <AnimatePresence>
        {selectedCourse && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50" onClick={() => { setSelectedCourse(null); setIsRejectOpen(false) }} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" className="font-bold uppercase tracking-wider text-[10px]">{selectedCourse.code}</Badge>
                    <Badge variant={getStatus(selectedCourse).variant} className="font-bold uppercase tracking-wider text-[10px]">
                      {getStatus(selectedCourse).label}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-surface-900 text-lg mt-1">{selectedCourse.title}</h3>
                  <p className="text-xs text-surface-500">{selectedCourse.department} · {selectedCourse.lecturer}</p>
                </div>
                <button
                  onClick={() => { setSelectedCourse(null); setIsRejectOpen(false) }}
                  className="text-surface-400 hover:text-surface-600 transition-colors p-1.5 hover:bg-surface-100 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Grade counts detail */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Enrolled', value: selectedCourse.counts.total, color: 'bg-surface-50' },
                    { label: 'HOD Approved (Pending)', value: selectedCourse.counts.hod_approved, color: 'bg-amber-50' },
                    { label: 'Released to Students', value: selectedCourse.counts.approved, color: 'bg-emerald-50' },
                    { label: 'Average Score', value: `${selectedCourse.counts.avg_score}%`, color: 'bg-indigo-50' },
                  ].map(s => (
                    <div key={s.label} className={`p-3 ${s.color} rounded-xl border border-surface-100`}>
                      <p className="text-[10px] uppercase font-bold text-surface-500 tracking-wider">{s.label}</p>
                      <p className="text-xl font-display font-bold text-surface-900 mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Provost Actions */}
                {selectedCourse.counts.hod_approved > 0 && !isRejectOpen && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Provost Actions</p>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-emerald-900">Release Results to Students</p>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Publish {selectedCourse.counts.hod_approved} HOD-approved result records immediately to students.
                          </p>
                          <Button
                            variant="primary"
                            className="mt-3 bg-emerald-600 hover:bg-emerald-700 border-none text-xs font-bold uppercase"
                            onClick={() => handleReleaseCourse(selectedCourse)}
                            disabled={releaseCourseForm.processing}
                          >
                            {releaseCourseForm.processing ? 'Releasing...' : 'Confirm Release'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-danger-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-danger-900">Send Back for Revision</p>
                          <p className="text-xs text-danger-700 mt-0.5">
                            Return this course's grades to draft status for the department to revise.
                          </p>
                          <Button
                            variant="outline"
                            className="mt-3 border-danger-300 text-danger-700 hover:bg-danger-50 text-xs font-bold uppercase"
                            onClick={() => setIsRejectOpen(true)}
                          >
                            Reject & Send Back
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reject Form */}
                {isRejectOpen && (
                  <form onSubmit={handleRejectSubmit} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-danger-700 uppercase tracking-wider">Rejection Reason</p>
                      <button type="button" onClick={() => setIsRejectOpen(false)} className="text-surface-400 hover:text-surface-600">
                        <X size={16} />
                      </button>
                    </div>
                    <TextareaField
                      label="Reason for rejection"
                      required
                      placeholder="Describe the specific issue requiring revision (e.g., data entry errors, missing scores, anomalous results)..."
                      value={rejectForm.data.reason}
                      onChange={(val) => rejectForm.setData('reason', val)}
                      error={rejectForm.errors.reason}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1 bg-danger-600 hover:bg-danger-700 border-none text-xs font-bold uppercase"
                        disabled={rejectForm.processing || !rejectForm.data.reason.trim()}
                      >
                        {rejectForm.processing ? 'Submitting...' : 'Confirm Rejection'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)} className="text-xs">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {selectedCourse.counts.hod_approved === 0 && selectedCourse.counts.approved > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-3">
                    <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Results Released</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        All {selectedCourse.counts.approved} grade records for this course have been released to students.
                      </p>
                    </div>
                  </div>
                )}

                {selectedCourse.counts.total === 0 && (
                  <div className="p-4 bg-surface-50 border border-surface-200 rounded-2xl flex gap-3">
                    <HelpCircle size={18} className="text-surface-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-surface-600">No grades submitted yet</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Lecturers have not entered or submitted any grades for this course.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
