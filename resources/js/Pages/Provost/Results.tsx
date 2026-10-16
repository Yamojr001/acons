import { Head, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, AlertCircle, X, Search,
  FileText, Eye, Shield, Lock, Unlock, Filter, RefreshCw
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { useState } from 'react'
import type { PageProps } from '@/types'

interface CourseResult {
  id: number
  code: string
  title: string
  name?: string
  credit_units: number
  department_id?: number
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

interface DepartmentItem {
  id: number
  name: string
  code: string
}

interface SemesterItem {
  id: number
  name: string
  academic_session?: { id: number; name: string }
}

interface Props extends PageProps {
  courses: CourseResult[]
  current_semester: SemesterItem | null
  active_semester?: SemesterItem | null
  semesters: SemesterItem[]
  departments: DepartmentItem[]
  selected_department_id: number | null
  selected_semester_id: number | null
  summary: {
    total_courses: number
    fully_released: number
    awaiting_release: number
    awaiting_hod: number
    in_draft: number
    pending_grades_count: number
    released_grades_count: number
    draft_grades_count: number
  }
}

function TextareaField({ label, required, placeholder, value, onChange, error }: {
  label: string; required?: boolean; placeholder?: string
  value: string; onChange: (val: string) => void; error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-600 mb-1.5">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      <textarea
        required={required}
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
      />
      {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
    </div>
  )
}

export default function ProvostResults({
  courses = [],
  current_semester,
  semesters = [],
  departments = [],
  selected_department_id = null,
  selected_semester_id = null,
  summary
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isBlockDepartmentOpen, setIsBlockDepartmentOpen] = useState(false)

  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [blockReason, setBlockReason] = useState('')

  const pendingCount = summary?.pending_grades_count ?? courses.reduce((sum, c) => sum + c.counts.hod_approved, 0)
  const releasedCount = summary?.released_grades_count ?? courses.reduce((sum, c) => sum + c.counts.approved, 0)

  const handleSemesterChange = (semesterId: string) => {
    router.get('/provost/results', {
      semester_id: semesterId || undefined,
      department_id: selected_department_id || undefined,
    }, { preserveState: true })
  }

  const handleDepartmentChange = (deptId: string) => {
    router.get('/provost/results', {
      semester_id: selected_semester_id || undefined,
      department_id: deptId || undefined,
    }, { preserveState: true })
  }

  const activeDepartment = departments.find(d => d.id === selected_department_id) || (departments.length === 1 ? departments[0] : null)

  const handleReleaseDepartment = (deptId?: number) => {
    const targetDeptId = deptId || selected_department_id || departments[0]?.id
    if (!targetDeptId) {
      alert('Please select a department first.')
      return
    }
    const dept = departments.find(d => d.id === targetDeptId)
    const semesterName = current_semester?.name || 'this semester'
    const sessionName = current_semester?.academic_session?.name ? ` (${current_semester.academic_session.name})` : ''

    if (!confirm(`AUTHORIZE OFFICIAL RELEASE?\n\nRelease examination results for "${dept?.name || 'Department'}" for ${semesterName}${sessionName}?\n\nAll HOD-approved student grades will be published and immediately accessible on student portals.`)) {
      return
    }

    setProcessingAction(`dept-${targetDeptId}`)
    router.post('/provost/results/release-department', {
      department_id: targetDeptId,
      semester_id: selected_semester_id ?? current_semester?.id,
    }, {
      preserveScroll: true,
      onFinish: () => setProcessingAction(null),
    })
  }

  const handleBlockDepartment = (e: React.FormEvent) => {
    e.preventDefault()
    const targetDeptId = selected_department_id || departments[0]?.id
    if (!targetDeptId) return

    setProcessingAction('block-dept')
    router.post('/provost/results/block-department', {
      department_id: targetDeptId,
      semester_id: selected_semester_id ?? current_semester?.id,
      reason: blockReason,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsBlockDepartmentOpen(false)
        setBlockReason('')
      },
      onFinish: () => setProcessingAction(null),
    })
  }

  const handleReleaseAll = () => {
    const semName = current_semester?.name || 'the current semester'
    if (!confirm(`Release ALL ${pendingCount} pending result records to students for ${semName}?\n\nGrades will become immediately visible on student result portals.`)) return

    setProcessingAction('all')
    router.post('/provost/results/release-all', {
      semester_id: selected_semester_id ?? current_semester?.id,
      department_id: selected_department_id || undefined,
    }, {
      preserveScroll: true,
      onFinish: () => setProcessingAction(null),
    })
  }

  const handleReleaseCourse = (course: CourseResult) => {
    const title = course.title || course.name || course.code
    const count = course.counts.hod_approved > 0 ? course.counts.hod_approved : course.counts.total
    if (!confirm(`Release results for ${course.code} — ${title} to students?\n\n${count} grade record(s) will be published immediately to student portals.`)) return

    setProcessingAction(`course-${course.id}`)
    router.post(`/provost/results/${course.id}/release`, {
      semester_id: selected_semester_id ?? current_semester?.id,
    }, {
      preserveScroll: true,
      onSuccess: () => setSelectedCourse(null),
      onFinish: () => setProcessingAction(null),
    })
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    if (!rejectReason.trim()) {
      setRejectError('Please enter a rejection reason.')
      return
    }

    setProcessingAction(`reject-${selectedCourse.id}`)
    router.post(`/provost/results/${selectedCourse.id}/reject`, {
      reason: rejectReason,
      semester_id: selected_semester_id ?? current_semester?.id,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsRejectOpen(false)
        setSelectedCourse(null)
        setRejectReason('')
        setRejectError(null)
      },
      onFinish: () => setProcessingAction(null),
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
    if (c.counts.hod_approved > 0) return { label: 'Blocked (Pending Release)', variant: 'warning' as const }
    if (c.counts.approved > 0 && c.counts.hod_approved === 0) return { label: 'Released', variant: 'success' as const }
    if (c.counts.submitted > 0) return { label: 'Pending HOD', variant: 'neutral' as const }
    return { label: 'Draft', variant: 'neutral' as const }
  }

  return (
    <AppLayout title="Result Release Authority">
      <Head title="Provost — Result Release Authority" />

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
            <Shield size={13} /> Provost Official Authority
          </div>
          <h1 className="text-2xl font-display font-bold text-surface-900 tracking-tight">
            Academic Results Release Portal
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Authorize and publish student results by department and academic session. Results remain strictly blocked from student view until released.
          </p>
        </div>

        {/* Global / Department Release Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {activeDepartment && (
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-semibold py-2 h-9 px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              onClick={() => handleReleaseDepartment(activeDepartment.id)}
              disabled={processingAction !== null || pendingCount === 0}
            >
              <Unlock size={14} />
              {processingAction === `dept-${activeDepartment.id}`
                ? 'Authorizing Release...'
                : `Release ${activeDepartment.code || 'Dept'} Results (${pendingCount})`}
            </Button>
          )}

          <Button
            variant={activeDepartment ? 'outline' : 'primary'}
            className={`${
              activeDepartment
                ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-none'
            } text-xs font-semibold py-2 h-9 px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all`}
            onClick={handleReleaseAll}
            disabled={processingAction !== null || pendingCount === 0}
          >
            <Unlock size={14} />
            {processingAction === 'all'
              ? 'Releasing All...'
              : `Release All Pending (${pendingCount})`}
          </Button>

          {releasedCount > 0 && activeDepartment && (
            <Button
              variant="outline"
              className="border-surface-300 text-surface-700 hover:bg-surface-50 text-xs font-semibold py-2 h-9 px-3 rounded-lg flex items-center gap-1.5"
              onClick={() => setIsBlockDepartmentOpen(true)}
              disabled={processingAction !== null}
            >
              <Lock size={13} /> Withhold / Block
            </Button>
          )}
        </div>
      </div>

      {/* Scope Selector: Academic Section / Semester & Department */}
      <Card className="p-4 mb-6 bg-surface-50/60 border border-surface-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Section / Semester Selector */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Academic Section / Semester
            </label>
            <select
              value={selected_semester_id ?? current_semester?.id ?? ''}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            >
              {semesters.map(s => {
                const label = s.academic_session?.name
                  ? `${s.academic_session.name} — ${s.name}`
                  : s.name
                return (
                  <option key={s.id} value={s.id}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Department Selector */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Department
            </label>
            <select
              value={selected_department_id ?? ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Info Badge */}
          <div className="md:col-span-3 flex md:justify-end items-end h-full pt-1 md:pt-5">
            <div className="text-xs text-surface-600 bg-white border border-surface-200 rounded-lg px-3 py-2 w-full text-center md:text-right">
              <span className="font-semibold text-surface-900">{pendingCount}</span> blocked /{' '}
              <span className="font-semibold text-emerald-700">{releasedCount}</span> released
            </div>
          </div>
        </div>
      </Card>

      {/* Block Status Banner */}
      {pendingCount > 0 ? (
        <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-950 text-xs">
          <Lock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
              Results Blocked From Student View ({pendingCount} pending grades)
            </p>
            <p className="mt-1 font-normal leading-relaxed text-amber-900">
              Exam records for <strong>{activeDepartment?.name || 'the selected scope'}</strong> in <strong>{current_semester?.name}</strong> are currently locked. Students cannot view their grades or transcripts until you click <strong>"Release {activeDepartment?.code || 'Department'} Results"</strong>.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-semibold whitespace-nowrap self-center"
            onClick={activeDepartment ? () => handleReleaseDepartment(activeDepartment.id) : handleReleaseAll}
            disabled={processingAction !== null}
          >
            <Unlock size={13} className="mr-1" />
            {processingAction === 'all' || processingAction?.startsWith('dept-')
              ? 'Releasing...'
              : activeDepartment
                ? `Release ${activeDepartment.code || 'Dept'} Now`
                : 'Release All Now'}
          </Button>
        </div>
      ) : (
        <div className="mb-6 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-950 text-xs">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="font-medium text-emerald-900">
            All submitted results for this selection ({releasedCount} records) have been officially released to students.
          </p>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 border border-surface-200 bg-white">
          <p className="text-xs font-medium text-surface-500">Total Courses</p>
          <p className="text-2xl font-bold font-display text-surface-900 mt-1">{summary?.total_courses ?? courses.length}</p>
          <p className="text-[11px] text-surface-400 mt-1">Cataloged in semester</p>
        </Card>

        <Card className="p-4 border border-amber-200 bg-amber-50/30">
          <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
            <Lock size={12} /> Blocked (Pending Release)
          </p>
          <p className="text-2xl font-bold font-display text-amber-900 mt-1">{pendingCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-1">
            {summary?.awaiting_release ?? 0} course{summary?.awaiting_release === 1 ? '' : 's'} awaiting release
          </p>
        </Card>

        <Card className="p-4 border border-emerald-200 bg-emerald-50/30">
          <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <Unlock size={12} /> Released to Students
          </p>
          <p className="text-2xl font-bold font-display text-emerald-900 mt-1">{releasedCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            {summary?.fully_released ?? 0} course{summary?.fully_released === 1 ? '' : 's'} fully published
          </p>
        </Card>

        <Card className="p-4 border border-surface-200 bg-white">
          <p className="text-xs font-medium text-surface-500">In Draft / Lecturer</p>
          <p className="text-2xl font-bold font-display text-surface-900 mt-1">{summary?.draft_grades_count ?? 0}</p>
          <p className="text-[11px] text-surface-400 mt-1">
            {summary?.awaiting_hod ?? 0} awaiting HOD endorsement
          </p>
        </Card>
      </div>

      {/* Search & Tabs */}
      <Card className="mb-6 p-3.5 bg-surface-50/40 border border-surface-200">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
            <input
              type="text"
              placeholder="Search by course code, title, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'pending', label: `Pending Release (${summary?.awaiting_release ?? 0})` },
              { id: 'released', label: 'Released' },
              { id: 'draft', label: 'Draft / HOD Pending' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap
                  ${statusFilter === f.id
                    ? 'bg-surface-900 text-white border-surface-900'
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(course => {
              const status = getStatus(course)
              return (
                <Card key={course.id} className="flex flex-col justify-between border border-surface-200 hover:border-surface-300 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2.5 border-b border-surface-100 pb-3 mb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {course.code}
                        </span>
                        <h3 className="font-bold text-surface-900 text-sm mt-1.5 line-clamp-1">
                          {course.title || course.name}
                        </h3>
                      </div>
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                    </div>

                    <div className="text-xs text-surface-600 space-y-1.5 mb-3.5">
                      <div className="flex justify-between">
                        <span className="text-surface-400">Department:</span>
                        <span className="font-medium text-surface-800 truncate ml-2">{course.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-400">Credit Load:</span>
                        <span className="font-mono font-medium text-surface-800">{course.credit_units} Units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-400">Lecturer:</span>
                        <span className="font-medium text-surface-800 truncate ml-2">{course.lecturer}</span>
                      </div>
                    </div>

                    {/* Breakdown counts */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-surface-50 border border-surface-100 text-center text-xs">
                      <div>
                        <p className="text-[10px] text-surface-400 uppercase font-semibold">Enrolled</p>
                        <p className="font-bold text-surface-800 mt-0.5">{course.counts.total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-600 uppercase font-semibold">Blocked</p>
                        <p className="font-bold text-amber-700 mt-0.5">{course.counts.hod_approved}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-600 uppercase font-semibold">Released</p>
                        <p className="font-bold text-emerald-700 mt-0.5">{course.counts.approved}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-surface-100 mt-3 pt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs py-1.5 h-8 rounded-lg font-semibold flex items-center justify-center gap-1"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <Eye size={13} /> Details
                    </Button>
                    {(course.counts.hod_approved > 0 || course.counts.submitted > 0) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs py-1.5 h-8 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 border-none flex items-center justify-center gap-1"
                        onClick={() => handleReleaseCourse(course)}
                        disabled={processingAction !== null}
                      >
                        <Unlock size={13} /> {processingAction === `course-${course.id}` ? 'Releasing...' : 'Release'}
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
            description="No courses match your current search, semester, or department filter."
            icon={<FileText size={36} />}
          />
        )}
      </AnimatePresence>

      {/* Course Detail Drawer */}
      <AnimatePresence>
        {selectedCourse && (
          <>
            <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-xs z-50" onClick={() => { setSelectedCourse(null); setIsRejectOpen(false) }} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl flex flex-col border-l border-surface-200"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-surface-150 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {selectedCourse.code}
                    </span>
                    <Badge variant={getStatus(selectedCourse).variant} size="sm">
                      {getStatus(selectedCourse).label}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-surface-900 text-base mt-1">{selectedCourse.title || selectedCourse.name}</h3>
                  <p className="text-xs text-surface-500">{selectedCourse.department} · {selectedCourse.credit_units} Credit Units</p>
                </div>
                <button
                  onClick={() => { setSelectedCourse(null); setIsRejectOpen(false) }}
                  className="text-surface-400 hover:text-surface-600 p-1.5 rounded-lg hover:bg-surface-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-surface-50 rounded-lg border border-surface-150">
                    <p className="text-[10px] uppercase font-semibold text-surface-500">Enrolled Students</p>
                    <p className="text-xl font-bold font-display text-surface-900 mt-0.5">{selectedCourse.counts.total}</p>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                    <p className="text-[10px] uppercase font-semibold text-amber-700">Blocked (HOD Approved)</p>
                    <p className="text-xl font-bold font-display text-amber-900 mt-0.5">{selectedCourse.counts.hod_approved}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                    <p className="text-[10px] uppercase font-semibold text-emerald-700">Released to Portal</p>
                    <p className="text-xl font-bold font-display text-emerald-900 mt-0.5">{selectedCourse.counts.approved}</p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg border border-surface-150">
                    <p className="text-[10px] uppercase font-semibold text-surface-500">Average Score</p>
                    <p className="text-xl font-bold font-display text-surface-900 mt-0.5">{selectedCourse.counts.avg_score}%</p>
                  </div>
                </div>

                {/* Course Actions */}
                {(selectedCourse.counts.hod_approved > 0 || selectedCourse.counts.submitted > 0) && !isRejectOpen && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Provost Authority Action</p>

                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                      <p className="text-xs font-bold text-emerald-900">Authorize Release to Students</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Immediately make {selectedCourse.counts.hod_approved || selectedCourse.counts.total} student results accessible on student result slips.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-2.5 bg-emerald-600 hover:bg-emerald-700 border-none text-xs font-semibold"
                        onClick={() => handleReleaseCourse(selectedCourse)}
                        disabled={processingAction !== null}
                      >
                        <Unlock size={13} className="mr-1.5" />
                        {processingAction === `course-${selectedCourse.id}` ? 'Releasing...' : 'Confirm Release to Students'}
                      </Button>
                    </div>

                    <div className="p-3.5 bg-danger-50/60 border border-danger-200 rounded-xl">
                      <p className="text-xs font-bold text-danger-900">Reject & Send Back to Department</p>
                      <p className="text-xs text-danger-700 mt-0.5">
                        Return grades to draft status with revision notes if errors or anomalies exist.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2.5 border-danger-300 text-danger-700 hover:bg-danger-50 text-xs font-semibold"
                        onClick={() => setIsRejectOpen(true)}
                        disabled={processingAction !== null}
                      >
                        Reject & Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reject Form */}
                {isRejectOpen && (
                  <form onSubmit={handleRejectSubmit} className="space-y-3 p-3.5 bg-surface-50 border border-surface-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-danger-700 uppercase tracking-wider">Revision Reason</p>
                      <button type="button" onClick={() => setIsRejectOpen(false)} className="text-surface-400 hover:text-surface-600">
                        <X size={14} />
                      </button>
                    </div>
                    <TextareaField
                      label="Explain reason for returning grades"
                      required
                      placeholder="Specify the reason (e.g., incorrect CA computation, missing test scores, data entry error)..."
                      value={rejectReason}
                      onChange={(val) => {
                        setRejectReason(val)
                        if (rejectError) setRejectError(null)
                      }}
                      error={rejectError || undefined}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="flex-1 bg-danger-600 hover:bg-danger-700 border-none text-xs font-semibold"
                        disabled={processingAction !== null || !rejectReason.trim()}
                      >
                        {processingAction?.startsWith('reject-') ? 'Submitting...' : 'Confirm Rejection'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectOpen(false)} className="text-xs">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {selectedCourse.counts.hod_approved === 0 && selectedCourse.counts.approved > 0 && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>All {selectedCourse.counts.approved} grade records for this course have been published to students.</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Withhold / Block Department */}
      <AnimatePresence>
        {isBlockDepartmentOpen && activeDepartment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full border border-surface-200 p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-150">
                <div className="flex items-center gap-2 text-danger-700 font-bold text-sm">
                  <Lock size={16} /> Withhold Department Results
                </div>
                <button onClick={() => setIsBlockDepartmentOpen(false)} className="text-surface-400 hover:text-surface-600">
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-surface-600">
                Are you sure you want to withhold / block all results for <strong>{activeDepartment.name}</strong> for <strong>{current_semester?.name}</strong>?
                This will immediately remove student access until re-authorized.
              </p>

              <form onSubmit={handleBlockDepartment} className="space-y-3">
                <TextareaField
                  label="Administrative Reason (Optional)"
                  placeholder="e.g., Audit in progress, pending senate clearance..."
                  value={blockReason}
                  onChange={(val) => setBlockReason(val)}
                />

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsBlockDepartmentOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-danger-600 hover:bg-danger-700 border-none text-xs font-semibold"
                    disabled={processingAction === 'block-dept'}
                  >
                    {processingAction === 'block-dept' ? 'Withholding...' : 'Confirm Withhold'}
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
