import React, { useState, useRef } from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'
import axios from 'axios'
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Database, Users, BookOpen,
  FileCheck2, Info, Layers, Award, Loader2, Sparkles
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Session {
  id: number
  name: string
  is_current?: boolean
}

interface Semester {
  id: number
  name: string
  academic_session_id: number
  is_current?: boolean
  academic_session?: Session
}

interface Program {
  id: number
  name: string
  code?: string
}

interface Department {
  id: number
  name: string
  code?: string
}

interface CourseItem {
  id: number
  name: string
  code: string
  credit_units: number
  level?: string
  semester_type?: string
}

interface DetectedCourse {
  code: string
  name: string
  credit_units: number
  existing_id?: number | null
}

interface Props extends PageProps {
  sessions: Session[]
  semesters: Semester[]
  programs: Program[]
  departments: Department[]
  courses: CourseItem[]
  currentSessionId?: number
  currentSemesterId?: number
  stats: {
    total_students: number
    total_grades: number
    recent_grades: number
    total_courses: number
  }
}

const UNIT_OPTIONS = [1, 2, 3, 4, 5, 6]

export default function ImportResults({
  sessions = [],
  semesters = [],
  programs = [],
  departments = [],
  courses = [],
  currentSessionId,
  currentSemesterId,
  stats,
  flash,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<{
    mode: 'single' | 'multi'
    detected_title?: string
    courses: DetectedCourse[]
    student_count: number
  } | null>(null)

  // Per-course credit units mapping
  const [courseUnitsMap, setCourseUnitsMap] = useState<Record<string, number>>({})

  const { data, setData, post, processing, errors, reset, progress } = useForm<{
    file: File | null
    upload_type: 'full' | 'ca' | 'exam'
    course_id: string | number
    course_name: string
    course_code: string
    credit_units: number | string
    course_units: Record<string, number>
    academic_session_id: string | number
    semester_id: string | number
    program_id: string | number
    department_id: string | number
    current_level: string
  }>({
    file: null,
    upload_type: 'full',
    course_id: '',
    course_name: '',
    course_code: '',
    credit_units: 2,
    course_units: {},
    academic_session_id: currentSessionId || (sessions[0]?.id ?? ''),
    semester_id: currentSemesterId || (semesters[0]?.id ?? ''),
    program_id: programs[0]?.id ?? '',
    department_id: departments[0]?.id ?? '',
    current_level: 'ND1',
  })

  // Trigger preview analysis on file selection
  const analyzeFile = async (file: File) => {
    setPreviewLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(route('exam_officer.results.preview'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data && response.data.success) {
        setPreviewData(response.data)

        // Initialize course_units map
        const initialUnits: Record<string, number> = {}
        response.data.courses.forEach((c: DetectedCourse) => {
          initialUnits[c.code] = c.credit_units || 2
          initialUnits[c.name] = c.credit_units || 2
        })
        setCourseUnitsMap(initialUnits)
        setData('course_units', initialUnits)

        if (response.data.mode === 'single' && response.data.courses.length > 0) {
          const first = response.data.courses[0]
          setData((prev) => ({
            ...prev,
            course_name: first.name,
            course_code: first.code,
            credit_units: first.credit_units || 2,
            course_id: first.existing_id || '',
            course_units: initialUnits,
          }))
        }
      }
    } catch (err) {
      console.warn('File preview note:', err)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setData('file', file)
      setSelectedFileName(file.name)
      setFileSize((file.size / 1024).toFixed(1) + ' KB')
      analyzeFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setData('file', file)
      setSelectedFileName(file.name)
      setFileSize((file.size / 1024).toFixed(1) + ' KB')
      analyzeFile(file)
    }
  }

  // Update credit units for a specific course
  const setCourseUnit = (codeOrKey: string, units: number) => {
    const updated = { ...courseUnitsMap, [codeOrKey]: units }
    setCourseUnitsMap(updated)
    setData((prev) => ({
      ...prev,
      credit_units: units,
      course_units: updated,
    }))
  }

  const handleCourseSelect = (courseId: string) => {
    setData('course_id', courseId)
    if (courseId) {
      const selected = courses.find((c) => c.id === Number(courseId))
      if (selected) {
        const units = selected.credit_units || 2
        setCourseUnit(selected.code, units)
        setData((prev) => ({
          ...prev,
          course_id: courseId,
          course_name: selected.name,
          course_code: selected.code,
          credit_units: units,
        }))
      }
    }
  }

  const handleQuickCourseUnitUpdate = (courseId: number, units: number) => {
    router.post(
      route('exam_officer.courses.update_units', courseId),
      { credit_units: units },
      { preserveScroll: true }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('exam_officer.results.import.store'), {
      onSuccess: () => {
        reset('file')
        setSelectedFileName(null)
        setFileSize(null)
        setPreviewData(null)
        setCourseUnitsMap({})
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
    })
  }

  return (
    <AppLayout title="Import Academic Results">
      <Head title="Import Academic Results" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold tracking-wide uppercase mb-2">
              <ShieldCheck size={14} /> Examination Records Office
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 tracking-tight">
              Import Course Results
            </h1>
            <p className="text-sm text-surface-500 mt-1 max-w-2xl">
              Upload course score sheets with custom Credit Units for each course. Continuous Assessment (CA) is out of 30, Examination is out of 70 (OBJ + Essay).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={route('exam_officer.results.index')}>
              <Button variant="outline" size="sm" iconRight={<ArrowRight size={14} />}>
                View Master Broadsheet
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Flash Alerts */}
      {flash?.success && (
        <div className="mb-6 p-4 rounded-xl bg-success-50 border border-success-200 text-success-800 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-success-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Import Complete:</span> {flash.success}
          </div>
        </div>
      )}

      {flash?.error && (
        <div className="mb-6 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-800 flex items-start gap-3">
          <AlertCircle size={18} className="text-danger-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Error:</span> {flash.error}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>Enrolled Students</span>
            <Users size={16} className="text-surface-400" />
          </div>
          <div className="text-2xl font-bold font-display text-surface-900 mt-2">
            {stats.total_students.toLocaleString()}
          </div>
          <div className="text-xs text-surface-400 mt-1">Active student profiles</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>Course Catalog</span>
            <BookOpen size={16} className="text-surface-400" />
          </div>
          <div className="text-2xl font-bold font-display text-surface-900 mt-2">
            {stats.total_courses.toLocaleString()}
          </div>
          <div className="text-xs text-surface-400 mt-1">Registered courses</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>Total Grades Recorded</span>
            <Database size={16} className="text-surface-400" />
          </div>
          <div className="text-2xl font-bold font-display text-surface-900 mt-2">
            {stats.total_grades.toLocaleString()}
          </div>
          <div className="text-xs text-surface-400 mt-1">Course result entries</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-surface-200 shadow-xs">
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>Recent Entries (7d)</span>
            <FileCheck2 size={16} className="text-success-600" />
          </div>
          <div className="text-2xl font-bold font-display text-surface-900 mt-2">
            {stats.recent_grades.toLocaleString()}
          </div>
          <div className="text-xs text-surface-400 mt-1">Processed this week</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-8 bg-white border border-surface-200 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* File Dropzone */}
              <div>
                <label className="block text-sm font-semibold text-surface-800 mb-2">
                  Excel Score Sheet (.xlsx, .xls, .csv) <span className="text-danger-500">*</span>
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-brand-500 bg-brand-50/50'
                      : selectedFileName
                      ? 'border-success-400 bg-success-50/30'
                      : 'border-surface-300 hover:border-surface-400 bg-surface-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFileName ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-success-100 text-success-700 flex items-center justify-center mb-2.5">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div className="text-sm font-semibold text-surface-900">{selectedFileName}</div>
                      <div className="text-xs text-surface-500 mt-1">
                        {fileSize} • Click to choose a different file
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-surface-100 text-surface-600 flex items-center justify-center mb-2.5">
                        <UploadCloud size={24} />
                      </div>
                      <div className="text-sm font-semibold text-surface-800">
                        Drop score sheet here or <span className="text-brand-600 underline">browse computer</span>
                      </div>
                      <div className="text-xs text-surface-500 mt-1">
                        Supports: HUMAN PHYSIOLOGY II, OSCE, INTERPERSONAL COM, FOUNDATION OF NURSING...
                      </div>
                    </div>
                  )}
                </div>
                {errors.file && <p className="text-xs text-danger-600 mt-2">{errors.file}</p>}
              </div>

              {/* Preview Analysis Loading / Detected Courses Card */}
              {previewLoading && (
                <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-200 flex items-center gap-3 text-brand-800 text-xs">
                  <Loader2 size={16} className="animate-spin text-brand-600" />
                  <span>Analyzing spreadsheet structure, courses, and score columns...</span>
                </div>
              )}

              {/* Dynamic Per-Course Credit Unit Selection */}
              {previewData && previewData.courses.length > 0 && (
                <div className="p-4 sm:p-5 rounded-xl bg-brand-50/30 border border-brand-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-brand-600" /> Select Credit Units for Each Course in this Sheet
                    </span>
                    <span className="text-xs text-brand-700 font-medium bg-brand-100/60 px-2 py-0.5 rounded">
                      {previewData.student_count} Candidates Detected
                    </span>
                  </div>
                  <p className="text-xs text-surface-600">
                    Set the exact credit load for each course below. This is automatically saved and used to calculate students' GPA and CGPA.
                  </p>

                  <div className="space-y-3 pt-1">
                    {previewData.courses.map((c) => {
                      const currentVal = courseUnitsMap[c.code] ?? courseUnitsMap[c.name] ?? c.credit_units ?? 2

                      return (
                        <div
                          key={c.code}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white border border-surface-200 gap-3 shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-brand-800 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                                {c.code}
                              </span>
                              <span className="font-semibold text-sm text-surface-900">{c.name}</span>
                            </div>
                            <div className="text-[11px] text-surface-400 mt-0.5">
                              {c.existing_id ? 'Matched in course catalog' : 'New course will be created'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-surface-600 font-medium">Credit Units:</span>
                            <div className="inline-flex rounded-lg border border-surface-200 p-0.5 bg-surface-50">
                              {UNIT_OPTIONS.map((opt) => (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => setCourseUnit(c.code, opt)}
                                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                                    currentVal === opt
                                      ? 'bg-brand-600 text-white shadow-xs'
                                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/60'
                                  }`}
                                >
                                  {opt}U
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* If no file preview yet: Manual Course & Credit Units selector */}
              {!previewData && (
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-surface-700 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-brand-600" /> Course & Credit Load Settings
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                        Select Course (or detect automatically from file)
                      </label>
                      <select
                        value={data.course_id}
                        onChange={(e) => handleCourseSelect(e.target.value)}
                        className="w-full text-xs sm:text-sm rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500 bg-white"
                      >
                        <option value="">-- Detect Automatically from Sheet --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name} ({c.credit_units} Units)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1.5 flex items-center gap-1">
                        <Award size={13} className="text-brand-600" /> Credit Units <span className="text-danger-500">*</span>
                      </label>
                      <div className="flex items-center gap-1">
                        {UNIT_OPTIONS.map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => setData('credit_units', opt)}
                            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                              Number(data.credit_units) === opt
                                ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                                : 'bg-white border-surface-300 text-surface-700 hover:border-surface-400'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Component Type */}
              <div>
                <label className="block text-sm font-semibold text-surface-800 mb-2">
                  Result Component Type <span className="text-danger-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      data.upload_type === 'full'
                        ? 'border-brand-500 bg-brand-50/40 text-brand-900 shadow-xs'
                        : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs sm:text-sm">Complete Sheet</span>
                      <input
                        type="radio"
                        name="upload_type"
                        value="full"
                        checked={data.upload_type === 'full'}
                        onChange={() => setData('upload_type', 'full')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                    </div>
                    <p className="text-[11px] text-surface-500 leading-relaxed">
                      CA (/30) + Exam (/70) [OBJ + Essay] = Total (/100). Recommended.
                    </p>
                  </label>

                  <label
                    className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      data.upload_type === 'ca'
                        ? 'border-brand-500 bg-brand-50/40 text-brand-900 shadow-xs'
                        : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs sm:text-sm">CA Only (/30)</span>
                      <input
                        type="radio"
                        name="upload_type"
                        value="ca"
                        checked={data.upload_type === 'ca'}
                        onChange={() => setData('upload_type', 'ca')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                    </div>
                    <p className="text-[11px] text-surface-500 leading-relaxed">
                      Continuous Assessment test marks (out of 30).
                    </p>
                  </label>

                  <label
                    className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      data.upload_type === 'exam'
                        ? 'border-brand-500 bg-brand-50/40 text-brand-900 shadow-xs'
                        : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs sm:text-sm">Exam Only (/70)</span>
                      <input
                        type="radio"
                        name="upload_type"
                        value="exam"
                        checked={data.upload_type === 'exam'}
                        onChange={() => setData('upload_type', 'exam')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                    </div>
                    <p className="text-[11px] text-surface-500 leading-relaxed">
                      Examination marks (OBJ + Essay, out of 70).
                    </p>
                  </label>
                </div>
              </div>

              {/* Academic Context Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                    Academic Session <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={data.academic_session_id}
                    onChange={(e) => setData('academic_session_id', e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                    Semester <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={data.semester_id}
                    onChange={(e) => setData('semester_id', e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.academic_session ? `${s.academic_session.name} - ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                    Program
                  </label>
                  <select
                    value={data.program_id}
                    onChange={(e) => setData('program_id', e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                    Study Level
                  </label>
                  <select
                    value={data.current_level}
                    onChange={(e) => setData('current_level', e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-lg border-surface-300 focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="ND1">ND 1</option>
                    <option value="ND2">ND 2</option>
                    <option value="HND1">HND 1</option>
                    <option value="HND2">HND 2</option>
                    <option value="Basic Nursing Level 1">Basic Nursing Level 1</option>
                    <option value="Basic Nursing Level 2">Basic Nursing Level 2</option>
                  </select>
                </div>
              </div>

              {/* Progress */}
              {progress && (
                <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-surface-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    reset('file')
                    setSelectedFileName(null)
                    setFileSize(null)
                    setPreviewData(null)
                    setCourseUnitsMap({})
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  disabled={processing}
                >
                  Clear Selection
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={processing}
                  disabled={processing || !data.file}
                  iconLeft={<UploadCloud size={16} />}
                >
                  Process & Import Results
                </Button>
              </div>

            </form>
          </Card>
        </div>

        {/* Informational Guidance & Quick Course Units Directory Sidebar */}
        <div className="space-y-6">
          {/* Scoring Standards Card */}
          <Card className="p-5 bg-white border border-surface-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700 mb-3 flex items-center gap-1.5">
              <Layers size={15} className="text-brand-600" /> College Scoring Standards
            </h4>
            <div className="space-y-2.5 text-xs text-surface-600">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-surface-100">
                <span className="font-medium text-surface-800">Continuous Assessment (CA)</span>
                <span className="font-mono font-bold text-brand-700">Max 30 Marks</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-surface-100">
                <span className="font-medium text-surface-800">Exam (OBJ + Essay)</span>
                <span className="font-mono font-bold text-brand-700">Max 70 Marks</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-surface-100">
                <span className="font-medium text-surface-800">Total Course Composite</span>
                <span className="font-mono font-bold text-surface-900">100 Marks</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900">
                <span className="font-medium">Nursing Minimum Pass Mark</span>
                <span className="font-mono font-bold">50% (Grade C)</span>
              </div>
            </div>
          </Card>

          {/* Quick Credit Unit Directory */}
          <Card className="p-5 bg-white border border-surface-200 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-700 mb-2 flex items-center gap-1.5">
              <Award size={15} className="text-brand-600" /> Quick Credit Unit Adjuster
            </h4>
            <p className="text-[11px] text-surface-500 mb-3">
              Click a unit pill to instantly update any course's credit load in the database.
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-2.5 rounded-lg border border-surface-100 bg-surface-50/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-xs text-brand-800">{course.code}</div>
                    <div className="text-[11px] text-surface-600 truncate max-w-[130px]">
                      {course.name}
                    </div>
                  </div>

                  <div className="inline-flex rounded-md border border-surface-200 p-0.5 bg-white shrink-0">
                    {UNIT_OPTIONS.map((u) => (
                      <button
                        type="button"
                        key={u}
                        onClick={() => handleQuickCourseUnitUpdate(course.id, u)}
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                          course.credit_units === u
                            ? 'bg-brand-600 text-white'
                            : 'text-surface-600 hover:bg-surface-100'
                        }`}
                        title={`Set to ${u} Credit Units`}
                      >
                        {u}U
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Automatic Provisioning Notice */}
          <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
            <div className="flex items-start gap-2.5">
              <Info size={18} className="text-amber-700 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
                  Automatic Candidate Accounts
                </h4>
                <p className="text-xs leading-relaxed text-amber-900/90">
                  Any new registration numbers found in the sheet are automatically enrolled:
                </p>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded">
                  <div>Email: regno@acons.edu.ng</div>
                  <div>Password: regno</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
