import { Head, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Plus, Search, Edit3, Trash2, 
  X, Check, AlertCircle, Bookmark, Layers, Users, ShieldAlert,
  GraduationCap, ClipboardList, MinusCircle
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { useState } from 'react'
import type { PageProps } from '@/types'

interface Course {
  id: number
  name: string
  code: string
  credit_units: number
  level: string
  semester_type: 'first' | 'second' | 'both'
  type: 'core' | 'elective'
  lecturer_id: number | null
  lecturer?: {
    id: number
    user: {
      name: string
    }
  }
}

interface LecturerOption {
  id: number
  name: string
}

interface Props extends PageProps {
  courses: Course[]
  lecturers: LecturerOption[]
  department_name: string
}

export default function HODCoursesIndex({ courses, lecturers, department_name }: Props) {
  const [activeTab, setActiveTab] = useState<'register' | 'workload'>('register')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  // States for Assign Modal
  const [selectedLecturer, setSelectedLecturer] = useState<LecturerOption | null>(null)
  const [courseToAssign, setCourseToAssign] = useState<string>('')

  const { data, setData, post, delete: destroy, reset, processing, errors } = useForm({
    name: '',
    code: '',
    credit_units: 3,
    level: '100',
    semester_type: 'first' as 'first' | 'second' | 'both',
    type: 'core' as 'core' | 'elective',
    lecturer_id: '' as string | number
  })

  const handleOpenAddModal = () => {
    reset()
    setEditingCourse(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course)
    setData({
      name: course.name,
      code: course.code,
      credit_units: course.credit_units,
      level: course.level,
      semester_type: course.semester_type,
      type: course.type,
      lecturer_id: course.lecturer_id || ''
    })
    setIsModalOpen(true)
  }

  const handleOpenAssignModal = (lecturer: LecturerOption) => {
    setSelectedLecturer(lecturer)
    setCourseToAssign('')
    setIsAssignModalOpen(true)
  }

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseToAssign || !selectedLecturer) return

    router.post(`/hod/courses/${courseToAssign}/assign`, {
      lecturer_id: selectedLecturer.id
    }, {
      onSuccess: () => {
        setIsAssignModalOpen(false)
      }
    })
  }

  const handleUnassignCourse = (courseId: number, courseCode: string, lecturerName: string) => {
    if (confirm(`Are you sure you want to unassign ${courseCode} from ${lecturerName}?`)) {
      router.post(`/hod/courses/${courseId}/assign`, {
        lecturer_id: null
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCourse) {
      post(`/hod/courses/${editingCourse.id}/update`, {
        onSuccess: () => {
          setIsModalOpen(false)
          reset()
        }
      })
    } else {
      post('/hod/courses', {
        onSuccess: () => {
          setIsModalOpen(false)
          reset()
        }
      })
    }
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this course from the department register?')) {
      destroy(`/hod/courses/${id}`)
    }
  }

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevel === 'all' || c.level === selectedLevel
    return matchesSearch && matchesLevel
  })

  // Statistics
  const totalCourses = courses.length
  const coreCoursesCount = courses.filter(c => c.type === 'core').length
  const electiveCoursesCount = courses.filter(c => c.type === 'elective').length
  const totalCredits = courses.reduce((sum, c) => sum + c.credit_units, 0)

  // Map courses to lecturers for Tab 2
  const lecturerWorkloads = lecturers.map(lect => {
    const assigned = courses.filter(c => c.lecturer_id === lect.id)
    const totalCreditsAssigned = assigned.reduce((sum, c) => sum + c.credit_units, 0)
    return {
      ...lect,
      assignedCourses: assigned,
      totalCredits: totalCreditsAssigned
    }
  })

  const unassignedCourses = courses.filter(c => !c.lecturer_id)

  return (
    <AppLayout title="Course Allocation Panel">
      <Head title="Course Register & Workloads" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900 font-bold">Course Allocation Panel</h1>
          <p className="text-sm text-surface-500 mt-1">
            Department of {department_name} — Allocate faculty teaching workloads and curriculum registers.
          </p>
        </div>
        {activeTab === 'register' && (
          <Button variant="primary" onClick={handleOpenAddModal} iconLeft={<Plus size={18} />}>
            Add Departmental Course
          </Button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-surface-200 mb-8 gap-6">
        <button
          onClick={() => setActiveTab('register')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2
            ${activeTab === 'register'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-surface-400 hover:text-surface-600'}`}
        >
          <BookOpen size={16} /> Course Register
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2
            ${activeTab === 'workload'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-surface-400 hover:text-surface-600'}`}
        >
          <Users size={16} /> Workload Allocation
        </button>
      </div>

      {activeTab === 'register' ? (
        <>
          {/* Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Total Courses</p>
              <p className="text-3xl font-display font-bold mt-1">{totalCourses}</p>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Core / Compulsory</p>
              <p className="text-3xl font-display font-bold mt-1">{coreCoursesCount}</p>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Elective / Optional</p>
              <p className="text-3xl font-display font-bold mt-1">{electiveCoursesCount}</p>
            </Card>
            <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-none shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Total Credit Load</p>
              <p className="text-3xl font-display font-bold mt-1">{totalCredits} CU</p>
            </Card>
          </div>

          {/* Filter and search bar */}
          <Card className="mb-8 p-4 bg-surface-50/50">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by code or title..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {['all', 'Basic Nursing Level 1', 'Basic Nursing Level 2', 'Basic Nursing Level 3', 'ND1', 'ND2', 'HND1', 'HND2'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shadow-sm border shrink-0
                      ${selectedLevel === lvl 
                        ? 'bg-brand-500 text-white border-brand-500' 
                        : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'}`}
                  >
                    {lvl === 'all' ? 'All Levels' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Course Offerings list */}
          <AnimatePresence mode="wait">
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-xl border border-surface-200 transition-all duration-200 flex flex-col h-full bg-white relative overflow-hidden group">
                      {/* Badge Row */}
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant={course.type === 'core' ? 'brand' : 'neutral'} className="font-bold uppercase tracking-wider">
                          {course.type === 'core' ? 'Core Course' : 'Elective'}
                        </Badge>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEditModal(course)}
                            className="p-1.5 rounded-lg bg-surface-100 hover:bg-brand-50 text-surface-600 hover:text-brand-600 transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(course.id)}
                            className="p-1.5 rounded-lg bg-surface-100 hover:bg-danger-50 text-surface-600 hover:text-danger-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Code and name */}
                      <p className="text-xs font-mono font-bold text-brand-600 tracking-wider uppercase">{course.code}</p>
                      <h3 className="text-lg font-bold text-surface-900 mt-1 font-display leading-snug flex-1">{course.name}</h3>

                      {/* Metadata info */}
                      <div className="border-t border-surface-100 mt-6 pt-4 flex justify-between items-center text-xs text-surface-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Layers size={14} className="text-surface-400" />
                          <span>Level {course.level}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bookmark size={14} className="text-surface-400" />
                          <span>{course.credit_units} Credits</span>
                        </div>
                      </div>

                      {/* Lecturer workload status */}
                      <div className="mt-4 pt-3 border-t border-dashed border-surface-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                            <Users size={13} />
                          </div>
                          <div className="text-left">
                            <p className="text-[9px] uppercase font-bold text-surface-400 leading-none">Lecturer Workload</p>
                            <p className="text-xs font-bold text-surface-700 mt-0.5 truncate max-w-[150px]">
                              {course.lecturer?.user?.name ?? 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        {!course.lecturer_id && (
                          <Badge variant="warning" className="text-[10px] font-bold">Unassigned</Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="py-24">
                <EmptyState 
                  title="No Courses Found"
                  description="No curriculum courses matched your active queries. Try adding a new course registry."
                  icon={<BookOpen size={48} className="text-surface-200" />}
                />
              </Card>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Workload Allocation Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <div className="flex items-center justify-between pb-4 border-b border-surface-100 mb-6">
                 <div>
                   <h3 className="font-bold text-surface-900">Faculty Lecturer Allocations</h3>
                   <p className="text-xs text-surface-400 mt-0.5">List of academic lecturers and their allocated semester courses.</p>
                 </div>
              </div>

              <div className="divide-y divide-surface-100">
                {lecturerWorkloads.map(lecturer => (
                  <div key={lecturer.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <p className="font-bold text-sm text-surface-950">{lecturer.name}</p>
                         <Badge variant={lecturer.totalCredits > 12 ? 'warning' : 'neutral'} className="text-[10px] font-mono">
                           {lecturer.totalCredits} Credits Load
                         </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {lecturer.assignedCourses.map(course => (
                          <span 
                            key={course.id} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold rounded-lg group/item"
                          >
                            <span>{course.code}</span>
                            <button
                              type="button"
                              onClick={() => handleUnassignCourse(course.id, course.code, lecturer.name)}
                              className="text-brand-400 hover:text-brand-700 transition-colors"
                              title="Unassign course"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        {lecturer.assignedCourses.length === 0 && (
                          <span className="text-xs text-surface-400 italic">No courses allocated.</span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      iconLeft={<Plus size={14} />}
                      onClick={() => handleOpenAssignModal(lecturer)}
                    >
                      Assign Course
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-surface-50/50 border border-surface-200">
              <h3 className="font-bold text-surface-900 pb-3 border-b border-surface-150 mb-4 flex items-center gap-2">
                 <ClipboardList size={18} className="text-brand-600" />
                 Unassigned Departmental Courses
              </h3>
              <div className="space-y-3">
                {unassignedCourses.map(course => (
                  <div key={course.id} className="p-3 bg-white border border-surface-150 rounded-xl flex items-center justify-between">
                     <div>
                       <span className="text-xs font-mono font-bold text-brand-600 uppercase">{course.code}</span>
                       <p className="text-sm font-semibold text-surface-800 leading-tight mt-0.5">{course.name}</p>
                       <p className="text-[10px] text-surface-400 mt-1 font-medium">{course.credit_units} CU • {course.level} Level</p>
                     </div>
                     <Badge variant="warning" className="shrink-0 text-[9px] font-bold">Pending</Badge>
                  </div>
                ))}
                {unassignedCourses.length === 0 && (
                  <p className="text-xs text-surface-400 italic text-center py-6">
                    All departmental courses have been successfully allocated to lecturers!
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Elegant Add/Edit Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-surface-100 relative z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-100 bg-surface-50/50">
                <h2 className="text-lg font-bold text-surface-900">
                  {editingCourse ? 'Modify Course Registry' : 'Register Department Course'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Course Code</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. NUR101"
                      value={data.code}
                      onChange={(e) => setData('code', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.code && <p className="text-xs text-danger-500 mt-1">{errors.code}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Credit Units</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      max={10}
                      value={data.credit_units}
                      onChange={(e) => setData('credit_units', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.credit_units && <p className="text-xs text-danger-500 mt-1">{errors.credit_units}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Course Title / Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Foundations of Nursing Science"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                  {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Target Level</label>
                    <select
                      value={data.level}
                      onChange={(e) => setData('level', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer"
                    >
                      {['Basic Nursing Level 1', 'Basic Nursing Level 2', 'Basic Nursing Level 3', 'ND1', 'ND2', 'HND1', 'HND2'].map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Semester Type</label>
                    <select
                      value={data.semester_type}
                      onChange={(e) => setData('semester_type', e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="first">First</option>
                      <option value="second">Second</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Course Status</label>
                    <select
                      value={data.type}
                      onChange={(e) => setData('type', e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="core">Core (Mandatory)</option>
                      <option value="elective">Elective (Optional)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Assign Lecturer Workload</label>
                  <select
                    value={data.lecturer_id}
                    onChange={(e) => setData('lecturer_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="">Select lecturer to assign workload...</option>
                    {lecturers.map(lect => (
                      <option key={lect.id} value={lect.id}>{lect.name}</option>
                    ))}
                  </select>
                  {errors.lecturer_id && <p className="text-xs text-danger-500 mt-1">{errors.lecturer_id}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                  <Button variant="neutral" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="brand" type="submit" disabled={processing}>
                    {processing ? 'Saving...' : editingCourse ? 'Save Changes' : 'Register Course'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Assign Course to Lecturer Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedLecturer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAssignModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-surface-100 relative z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-100 bg-surface-50/50">
                <h2 className="text-lg font-bold text-surface-900">
                  Assign Course workload
                </h2>
                <button 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
                <div className="p-3 bg-brand-50 border border-brand-100 text-brand-800 rounded-2xl text-xs space-y-1">
                  <span className="font-bold uppercase tracking-wider block">Target Lecturer</span>
                  <span className="text-sm font-semibold">{selectedLecturer.name}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Select Course</label>
                  <select
                    required
                    value={courseToAssign}
                    onChange={(e) => setCourseToAssign(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="">Choose course to allocate...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.name} ({course.credit_units} CU) {course.lecturer_id ? `[Assigned to ${course.lecturer?.user?.name}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                  <Button variant="neutral" type="button" onClick={() => setIsAssignModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="brand" type="submit">
                    Allocate Course
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
