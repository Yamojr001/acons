import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import {
  FileText, Download, Printer, Search, UploadCloud,
  CheckCircle, AlertCircle, Award, LayoutList, Grid, ArrowLeft
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import type { PageProps } from '@/types'

interface CourseItem {
  id: number
  code: string
  name: string
  credit_units: number
  department_id?: number
}

interface ScoreItem {
  ca: number | null
  exam: number | null
  total: number | null
  grade: string | null
  points: number
  is_absent: boolean
  status: string
}

interface StudentRow {
  id: number
  matric_number: string
  name: string
  email?: string
  avatar_url?: string | null
  department: string
  level?: string
  scores: Record<number, ScoreItem | null>
  summary: {
    total_score: number
    total_units: number
    gpa: number
    passed_count: number
    failed_count: number
    remark: string
  }
}

interface Props extends PageProps {
  semester: {
    id: number
    name: string
    academic_session?: { id: number; name: string }
  }
  semesters: Array<{
    id: number
    name: string
    academic_session?: { id: number; name: string }
  }>
  departments: Array<{
    id: number
    name: string
    code: string
  }>
  courses: CourseItem[]
  students: StudentRow[]
  filters: {
    semester_id: number
    department_id: number | null
    search: string | null
  }
  stats: {
    total_students: number
    passed_students: number
    resit_students: number
    avg_score: number
    avg_gpa: number
  }
}

export default function MasterBroadsheet({
  semester,
  semesters = [],
  departments = [],
  courses = [],
  students = [],
  filters,
  stats,
  auth
}: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const tenant = auth?.tenant

  const handleFilterChange = (params: Partial<typeof filters>) => {
    router.get('/exam-office/broadsheet', {
      semester_id: params.semester_id !== undefined ? params.semester_id : filters.semester_id,
      department_id: params.department_id !== undefined ? params.department_id : filters.department_id,
      search: params.search !== undefined ? params.search : filters.search,
    }, { preserveState: true, replace: true })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange({ search: searchTerm || null })
  }

  const handlePrint = () => {
    window.print()
  }

  const exportUrl = `/exam-office/broadsheet/export?semester_id=${filters.semester_id}${filters.department_id ? `&department_id=${filters.department_id}` : ''}`

  return (
    <AppLayout title="Master Examination Broadsheet">
      <Head title="Master Broadsheet — Exam Office" />

      {/* Header (Hidden on Print) */}
      <div className="print:hidden mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                Examination Office Matrix
              </span>
              <span className="text-xs text-surface-400">·</span>
              <span className="text-xs text-surface-500 font-medium">
                {semester?.academic_session?.name} — {semester?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 tracking-tight">
              Master Broadsheet Preview
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              Single-row student score broadsheet matrix with CA (/20), Examination (/80), and Total (/100) per course.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={route('exam_officer.results.index', { semester_id: filters.semester_id })}>
              <Button variant="outline" size="sm" iconLeft={<LayoutList size={14} />}>
                List View
              </Button>
            </Link>

            <a href={exportUrl} download>
              <Button variant="outline" size="sm" iconLeft={<Download size={14} />}>
                Export CSV
              </Button>
            </a>

            <Button variant="outline" size="sm" iconLeft={<Printer size={14} />} onClick={handlePrint}>
              Print Broadsheet
            </Button>

            <Link href={route('exam_officer.results.import')}>
              <Button variant="primary" size="sm" iconLeft={<UploadCloud size={14} />}>
                Import More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Printable Institution Header (Visible ONLY on Print) */}
      <div className="hidden print:block mb-4 text-center border-b-2 border-gray-800 pb-3">
        <div className="flex items-center justify-center gap-3">
          <img
            src="/assets/images/acons_logo.png"
            alt="Logo"
            className="w-16 h-16 object-contain"
            onError={(e) => {
              const target = e.currentTarget
              if (!target.src.endsWith('/logo.png')) target.src = '/logo.png'
            }}
          />
          <div>
            <h1 className="text-xl font-black uppercase text-gray-900">
              {tenant?.name || 'Ameenatu College of Nursing Sciences (ACONS)'}
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Master Academic Broadsheet · {semester?.academic_session?.name} ({semester?.name})
            </h2>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Hidden on Print) */}
      <Card className="print:hidden p-4 mb-6 bg-surface-50/60 border border-surface-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Semester Selector */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Academic Section / Semester
            </label>
            <select
              value={filters.semester_id}
              onChange={(e) => handleFilterChange({ semester_id: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            >
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.academic_session?.name ? `${s.academic_session.name} — ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Department
            </label>
            <select
              value={filters.department_id ?? ''}
              onChange={(e) => handleFilterChange({ department_id: e.target.value ? Number(e.target.value) : null })}
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

          {/* Search Box */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-surface-700 mb-1">
              Find Student
            </label>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={15} />
                <input
                  type="text"
                  placeholder="Search by reg number or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="px-3.5">
                Filter
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {/* Summary KPI Band (Hidden on Print) */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Card className="p-3.5 border border-surface-200 bg-white">
          <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider">Total Enrolled</p>
          <p className="text-xl font-bold font-display text-surface-900 mt-0.5">{stats.total_students}</p>
          <p className="text-[11px] text-surface-400">{courses.length} courses offered</p>
        </Card>

        <Card className="p-3.5 border border-emerald-200 bg-emerald-50/30">
          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle size={12} /> Clear Pass
          </p>
          <p className="text-xl font-bold font-display text-emerald-900 mt-0.5">{stats.passed_students}</p>
          <p className="text-[11px] text-emerald-700/80">
            {stats.total_students > 0 ? Math.round((stats.passed_students / stats.total_students) * 100) : 0}% pass rate
          </p>
        </Card>

        <Card className="p-3.5 border border-amber-200 bg-amber-50/30">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle size={12} /> Resit Required
          </p>
          <p className="text-xl font-bold font-display text-amber-900 mt-0.5">{stats.resit_students}</p>
          <p className="text-[11px] text-amber-700/80">
            {stats.total_students > 0 ? Math.round((stats.resit_students / stats.total_students) * 100) : 0}% of cohort
          </p>
        </Card>

        <Card className="p-3.5 border border-surface-200 bg-white">
          <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider">Cohort Avg. Score</p>
          <p className="text-xl font-bold font-display text-surface-900 mt-0.5">{stats.avg_score}</p>
          <p className="text-[11px] text-surface-400">Total points across courses</p>
        </Card>

        <Card className="p-3.5 border border-surface-200 bg-white">
          <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider">Cohort Avg. GPA</p>
          <p className="text-xl font-bold font-display text-brand-700 mt-0.5">{stats.avg_gpa.toFixed(2)}</p>
          <p className="text-[11px] text-surface-400">Out of 4.00 scale</p>
        </Card>
      </div>

      {/* Broadsheet Matrix Container */}
      {courses.length === 0 ? (
        <Card className="py-16 text-center">
          <EmptyState
            title="No Results or Courses Found"
            description="No course registrations or broadsheet scores recorded for this semester."
            icon={<FileText size={40} />}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border border-surface-200 shadow-sm print:border-none print:shadow-none">
          <div className="overflow-x-auto max-h-[75vh] print:max-h-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Header Row 1: Course Grouping Headers */}
                <tr className="bg-surface-100 text-surface-800 border-b border-surface-200 font-bold sticky top-0 z-20 print:static">
                  {/* Fixed left headers */}
                  <th className="py-2.5 px-2.5 text-center w-12 sticky left-0 bg-surface-100 z-30 border-r border-surface-200 print:static">
                    S/N
                  </th>
                  <th className="py-2.5 px-3 text-left w-36 sticky left-12 bg-surface-100 z-30 border-r border-surface-200 whitespace-nowrap print:static">
                    Registration No.
                  </th>
                  <th className="py-2.5 px-3 text-left min-w-[180px] max-w-[220px] sticky left-48 bg-surface-100 z-30 border-r-2 border-surface-300 whitespace-nowrap print:static">
                    Student Name
                  </th>

                  {/* Course Group Headers: span 3 sub-columns (CA, Exam, Total) */}
                  {courses.map(course => (
                    <th
                      key={course.id}
                      colSpan={3}
                      className="py-2 px-2 text-center border-r-2 border-surface-200 bg-surface-50 whitespace-nowrap"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-brand-700 text-[11px]">
                          {course.code}
                        </span>
                        <span className="text-[10px] text-surface-500 font-normal truncate max-w-[130px]" title={course.name}>
                          {course.name} ({course.credit_units}U)
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Right summary headers */}
                  <th className="py-2 px-2.5 text-center w-20 border-r border-surface-200 bg-surface-100 font-bold whitespace-nowrap">
                    Total
                  </th>
                  <th className="py-2 px-2 text-center w-14 border-r border-surface-200 bg-surface-100 font-bold whitespace-nowrap">
                    Units
                  </th>
                  <th className="py-2 px-2 text-center w-16 border-r border-surface-200 bg-surface-100 font-bold whitespace-nowrap">
                    GPA
                  </th>
                  <th className="py-2 px-3 text-center w-20 bg-surface-100 font-bold whitespace-nowrap">
                    Remark
                  </th>
                </tr>

                {/* Header Row 2: Sub-columns (CA, Exam, Total) under each course */}
                <tr className="bg-surface-50 text-surface-600 border-b-2 border-surface-300 font-semibold text-[10px] uppercase sticky top-[41px] z-20 print:static">
                  {/* Left spacer columns */}
                  <th className="py-1 px-1 text-center sticky left-0 bg-surface-50 z-30 border-r border-surface-200 print:static">
                    —
                  </th>
                  <th className="py-1 px-1 text-center sticky left-12 bg-surface-50 z-30 border-r border-surface-200 print:static">
                    —
                  </th>
                  <th className="py-1 px-1 text-center sticky left-48 bg-surface-50 z-30 border-r-2 border-surface-300 print:static">
                    —
                  </th>

                  {/* Sub-column triples for each course */}
                  {courses.map(course => (
                    <template key={`sub-${course.id}`}>
                      <th className="py-1 px-1.5 text-right w-12 border-r border-surface-200 text-surface-500 font-mono">
                        CA
                      </th>
                      <th className="py-1 px-1.5 text-right w-12 border-r border-surface-200 text-surface-500 font-mono">
                        EX
                      </th>
                      <th className="py-1 px-1.5 text-right w-14 border-r-2 border-surface-300 text-surface-900 font-bold font-mono bg-surface-100/50">
                        TOT
                      </th>
                    </template>
                  ))}

                  {/* Right summary sub-headers */}
                  <th className="py-1 px-1 text-center border-r border-surface-200 text-[9px]">Marks</th>
                  <th className="py-1 px-1 text-center border-r border-surface-200 text-[9px]">Load</th>
                  <th className="py-1 px-1 text-center border-r border-surface-200 text-[9px]">/4.00</th>
                  <th className="py-1 px-1 text-center text-[9px]">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-surface-200 bg-white">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3 + (courses.length * 3) + 4} className="py-12 text-center text-surface-400">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => {
                    const isEven = idx % 2 === 0
                    const rowBg = isEven ? 'bg-white' : 'bg-surface-50/40'

                    return (
                      <tr key={student.id} className={`${rowBg} hover:bg-brand-50/30 transition-colors`}>
                        {/* Fixed S/N */}
                        <td className={`py-2 px-2 text-center text-surface-400 sticky left-0 ${rowBg} z-10 border-r border-surface-200 font-mono print:static`}>
                          {idx + 1}
                        </td>

                        {/* Fixed Matric Number */}
                        <td className={`py-2 px-3 font-mono font-bold text-surface-900 sticky left-12 ${rowBg} z-10 border-r border-surface-200 whitespace-nowrap print:static`}>
                          {student.matric_number}
                        </td>

                        {/* Fixed Student Name */}
                        <td className={`py-2 px-3 font-semibold text-surface-800 uppercase sticky left-48 ${rowBg} z-10 border-r-2 border-surface-300 whitespace-nowrap truncate max-w-[220px] print:static`} title={student.name}>
                          {student.name}
                        </td>

                        {/* Course Score Triples (CA, Exam, Total) */}
                        {courses.map(course => {
                          const s = student.scores[course.id]

                          if (!s) {
                            return (
                              <template key={`score-${course.id}`}>
                                <td className="py-2 px-1.5 text-right font-mono text-surface-300 border-r border-surface-200">
                                  —
                                </td>
                                <td className="py-2 px-1.5 text-right font-mono text-surface-300 border-r border-surface-200">
                                  —
                                </td>
                                <td className="py-2 px-1.5 text-right font-mono text-surface-300 border-r-2 border-surface-300 bg-surface-50/30">
                                  —
                                </td>
                              </template>
                            )
                          }

                          const isFail = s.grade === 'F' || s.is_absent || (s.total !== null && s.total < 50)
                          const totalDisplay = s.is_absent ? 'ABS' : s.total !== null ? s.total : '—'

                          return (
                            <template key={`score-${course.id}`}>
                              {/* CA Score */}
                              <td className="py-2 px-1.5 text-right font-mono text-surface-600 border-r border-surface-200 text-[11px]">
                                {s.ca !== null ? s.ca : '—'}
                              </td>

                              {/* Exam Score */}
                              <td className="py-2 px-1.5 text-right font-mono text-surface-600 border-r border-surface-200 text-[11px]">
                                {s.exam !== null ? s.exam : '—'}
                              </td>

                              {/* Total Score */}
                              <td className={`py-2 px-1.5 text-right font-mono font-bold border-r-2 border-surface-300 text-[11px] ${
                                isFail ? 'text-danger-600 bg-danger-50/40' : 'text-surface-900 bg-surface-50/50'
                              }`}>
                                {totalDisplay}
                              </td>
                            </template>
                          )
                        })}

                        {/* Right Summary Columns */}
                        <td className="py-2 px-2 text-right font-mono font-semibold text-surface-800 border-r border-surface-200 text-[11px]">
                          {student.summary.total_score}
                        </td>

                        <td className="py-2 px-2 text-center font-mono text-surface-600 border-r border-surface-200 text-[11px]">
                          {student.summary.total_units}U
                        </td>

                        <td className="py-2 px-2 text-center font-mono font-bold text-brand-700 border-r border-surface-200 text-[11px]">
                          {student.summary.gpa.toFixed(2)}
                        </td>

                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          {student.summary.remark === 'PASS' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PASS
                            </span>
                          ) : student.summary.remark === 'RESIT' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              RESIT ({student.summary.failed_count})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-danger-50 text-danger-700 border border-danger-200">
                              REPEAT
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

          {/* Table Footer */}
          <div className="py-3 px-4 border-t border-surface-200 bg-surface-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500">
            <div>
              Showing <span className="font-semibold text-surface-800">{students.length}</span> students across{' '}
              <span className="font-semibold text-surface-800">{courses.length}</span> courses
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pass (&ge; 50)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-danger-500" /> Fail / Resit (&lt; 50)
              </span>
              <span className="text-surface-400">·</span>
              <span className="text-surface-500">CA: /20 · Exam: /80 · Total: /100</span>
            </div>
          </div>
        </Card>
      )}
    </AppLayout>
  )
}
