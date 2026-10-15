import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { 
  Trophy, Search, Filter, UploadCloud, ChevronLeft, 
  ChevronRight, ArrowUpDown, FileSpreadsheet, CheckCircle2,
  AlertTriangle, BookOpen, User, GraduationCap
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Session {
  id: number
  name: string
}

interface Semester {
  id: number
  name: string
  academic_session?: Session
}

interface Course {
  id: number
  code: string
  name: string
}

interface GradeRecord {
  id: number
  ca_score: number | null
  exam_score: number | null
  total_score: number | null
  grade_letter: string | null
  grade_points: number | null
  is_absent: boolean
  approval_status: string
  created_at: string
  registration?: {
    student?: {
      id: number
      matriculation_number: string
      current_level: string
      academic_status: string
      user?: {
        name: string
        email: string
      }
      department?: {
        name: string
      }
    }
    course?: {
      id: number
      code: string
      name: string
      credit_units: number
    }
    semester?: {
      id: number
      name: string
      academic_session?: {
        name: string
      }
    }
  }
}

interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  prev_page_url: string | null
  next_page_url: string | null
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
}

interface Props extends PageProps {
  grades: Paginated<GradeRecord>
  sessions: Session[]
  semesters: Semester[]
  courses: Course[]
  filters: {
    semester_id?: number | null
    course_id?: number | null
    search?: string | null
  }
}

export default function Results({
  grades,
  sessions = [],
  semesters = [],
  courses = [],
  filters,
}: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [selectedSemester, setSelectedSemester] = useState<string | number>(filters.semester_id || '')
  const [selectedCourse, setSelectedCourse] = useState<string | number>(filters.course_id || '')

  const handleFilterChange = (params: {
    semester_id?: string | number
    course_id?: string | number
    search?: string
  }) => {
    router.get(
      route('exam_officer.results.index'),
      {
        semester_id: params.semester_id !== undefined ? params.semester_id : selectedSemester,
        course_id: params.course_id !== undefined ? params.course_id : selectedCourse,
        search: params.search !== undefined ? params.search : searchTerm,
      },
      { preserveState: true, replace: true }
    )
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange({ search: searchTerm })
  }

  const getGradeBadge = (letter: string | null, total: number | null) => {
    if (!letter && total === null) {
      return <span className="text-surface-400 text-xs">—</span>
    }
    const cleanLetter = (letter || '').toUpperCase()

    if (cleanLetter === 'A') {
      return <Badge variant="success" size="sm">A (70-100)</Badge>
    }
    if (cleanLetter === 'B') {
      return <Badge variant="info" size="sm">B (60-69)</Badge>
    }
    if (cleanLetter === 'C') {
      return <Badge variant="brand" size="sm">C (50-59)</Badge>
    }
    if (cleanLetter === 'D') {
      return <Badge variant="warning" size="sm">D (45-49)</Badge>
    }
    if (cleanLetter === 'E') {
      return <Badge variant="warning" size="sm">E (40-44)</Badge>
    }
    if (cleanLetter === 'F' || cleanLetter === 'FAIL') {
      return <Badge variant="danger" size="sm">{cleanLetter} (&lt;50)</Badge>
    }
    if (cleanLetter === 'PASS') {
      return <Badge variant="success" size="sm">PASS</Badge>
    }
    return <Badge variant="neutral" size="sm">{cleanLetter}</Badge>
  }

  return (
    <AppLayout title="Master Examination Results">
      <Head title="Master Examination Results" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 tracking-tight">
              Master Academic Results Broadsheet
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Browse, search, and verify student course grades, CA breakdowns, and final remarks.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href={route('exam_officer.results.broadsheet', selectedSemester ? { semester_id: selectedSemester } : {})}>
              <Button variant="outline" size="sm" iconLeft={<FileSpreadsheet size={15} />}>
                Master Broadsheet View
              </Button>
            </Link>
            <Link href={route('exam_officer.results.import')}>
              <Button variant="primary" size="sm" iconLeft={<UploadCloud size={15} />}>
                Import Results
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 mb-6 bg-white border border-surface-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or registration number..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
            />
          </form>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value)
                handleFilterChange({ semester_id: e.target.value })
              }}
              className="text-xs sm:text-sm py-2 rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.academic_session ? `${s.academic_session.name} - ` : ''}{s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value)
                handleFilterChange({ course_id: e.target.value })
              }}
              className="text-xs sm:text-sm py-2 rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>

            {(searchTerm || selectedSemester || selectedCourse) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedSemester('')
                  setSelectedCourse('')
                  router.get(route('exam_officer.results.index'), {}, { replace: true })
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="bg-white border border-surface-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50/70 text-surface-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4 text-center">Semester</th>
                <th className="py-3 px-4 text-right">CA (/30)</th>
                <th className="py-3 px-4 text-right">Exam (/70)</th>
                <th className="py-3 px-4 text-right font-bold text-surface-900">Total (/100)</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700">
              {grades.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-surface-500">
                    <Trophy size={36} className="mx-auto text-surface-300 mb-2" />
                    <p className="font-medium text-surface-700">No results found</p>
                    <p className="text-xs text-surface-400 mt-1">
                      No grades matching the filter criteria. Use the Import feature to upload results.
                    </p>
                    <Link href={route('exam_officer.results.import')} className="inline-block mt-4">
                      <Button variant="primary" size="sm">
                        Import Academic Results
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                grades.data.map((grade) => {
                  const student = grade.registration?.student
                  const course = grade.registration?.course
                  const semester = grade.registration?.semester

                  return (
                    <tr key={grade.id} className="hover:bg-surface-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-surface-900">
                        {student?.matriculation_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-surface-900">{student?.user?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-surface-400">{student?.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-brand-700">{course?.code || '—'}</span>
                          {course?.credit_units && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface-100 text-surface-600 font-mono">
                              {course.credit_units}U
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-surface-500 truncate max-w-[180px]">
                          {course?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-surface-600 whitespace-nowrap">
                        {semester?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-surface-600">
                        {grade.ca_score !== null ? grade.ca_score : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-surface-600">
                        {grade.exam_score !== null ? grade.exam_score : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-surface-900">
                        {grade.is_absent ? (
                          <span className="text-danger-600 font-semibold">ABS</span>
                        ) : grade.total_score !== null ? (
                          grade.total_score
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getGradeBadge(grade.grade_letter, grade.total_score)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {grade.approval_status === 'hod_approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Blocked (Awaiting Provost)
                          </span>
                        ) : grade.approval_status === 'approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Released
                          </span>
                        ) : grade.approval_status === 'submitted' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            Pending HOD
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-100 text-surface-600 border border-surface-200">
                            Draft
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {grades.total > 0 && (
          <div className="py-3 px-4 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500">
            <div>
              Showing <span className="font-semibold text-surface-800">{((grades.current_page - 1) * grades.per_page) + 1}</span> to{' '}
              <span className="font-semibold text-surface-800">{Math.min(grades.current_page * grades.per_page, grades.total)}</span> of{' '}
              <span className="font-semibold text-surface-800">{grades.total.toLocaleString()}</span> entries
            </div>

            <div className="flex items-center gap-1">
              {grades.links.map((link, idx) => {
                if (!link.url) {
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs text-surface-300 rounded border border-transparent"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  )
                }

                return (
                  <Link
                    key={idx}
                    href={link.url}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      link.active
                        ? 'bg-brand-500 border-brand-500 text-white font-semibold'
                        : 'border-surface-200 text-surface-700 hover:bg-surface-50'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
