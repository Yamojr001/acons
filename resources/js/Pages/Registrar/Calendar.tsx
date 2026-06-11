import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, Clock, Plus, ChevronRight, 
  Settings, History, AlertCircle, CheckCircle2, X, PlusCircle, Trash2, CalendarDays, BookOpen, UserCheck
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  sessions: any[]
}

export default function AcademicCalendar({ sessions }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'core' | 'sem1' | 'sem2'>('core')
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  
  // Dynamic form management
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    start_date: '',
    end_date: '',
    is_current: true,
    semesters: [
      {
        name: 'First Semester',
        type: 'first',
        start_date: '',
        end_date: '',
        is_current: true,
        schedules: {
          admission_start: '',
          admission_end: '',
          registration_start: '',
          registration_end: '',
          registration_closure: '',
          course_reg_start: '',
          course_reg_end: '',
          exam_start: '',
          exam_end: '',
        },
        custom_schedules: [] as any[]
      },
      {
        name: 'Second Semester',
        type: 'second',
        start_date: '',
        end_date: '',
        is_current: false,
        schedules: {
          admission_start: '',
          admission_end: '',
          registration_start: '',
          registration_end: '',
          registration_closure: '',
          course_reg_start: '',
          course_reg_end: '',
          exam_start: '',
          exam_end: '',
        },
        custom_schedules: [] as any[]
      }
    ]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSessionId) {
      post(route('registrar.calendar.update', editingSessionId), {
        onSuccess: () => {
          setIsOpen(false)
          reset()
          setEditingSessionId(null)
          setActiveTab('core')
        }
      })
    } else {
      post(route('registrar.calendar.store'), {
        onSuccess: () => {
          setIsOpen(false)
          reset()
          setActiveTab('core')
        }
      })
    }
  }

  const startEdit = (session: any) => {
    setEditingSessionId(session.id)
    
    const sem1 = session.semesters?.find((s: any) => s.type === 'first') || { name: 'First Semester', type: 'first', start_date: '', end_date: '', is_current: true, schedules: {}, custom_schedules: [] }
    const sem2 = session.semesters?.find((s: any) => s.type === 'second') || { name: 'Second Semester', type: 'second', start_date: '', end_date: '', is_current: false, schedules: {}, custom_schedules: [] }

    setData({
      name: session.name || '',
      start_date: session.start_date || '',
      end_date: session.end_date || '',
      is_current: !!session.is_current,
      semesters: [
        {
          name: sem1.name,
          type: 'first',
          start_date: sem1.start_date || '',
          end_date: sem1.end_date || '',
          is_current: !!sem1.is_current,
          schedules: {
            admission_start: sem1.schedules?.vital?.admission_start || '',
            admission_end: sem1.schedules?.vital?.admission_end || '',
            registration_start: sem1.schedules?.vital?.registration_start || '',
            registration_end: sem1.schedules?.vital?.registration_end || '',
            registration_closure: sem1.schedules?.vital?.registration_closure || '',
            course_reg_start: sem1.schedules?.vital?.course_reg_start || '',
            course_reg_end: sem1.schedules?.vital?.course_reg_end || '',
            exam_start: sem1.schedules?.vital?.exam_start || '',
            exam_end: sem1.schedules?.vital?.exam_end || '',
          },
          custom_schedules: sem1.schedules?.custom || []
        },
        {
          name: sem2.name,
          type: 'second',
          start_date: sem2.start_date || '',
          end_date: sem2.end_date || '',
          is_current: !!sem2.is_current,
          schedules: {
            admission_start: sem2.schedules?.vital?.admission_start || '',
            admission_end: sem2.schedules?.vital?.admission_end || '',
            registration_start: sem2.schedules?.vital?.registration_start || '',
            registration_end: sem2.schedules?.vital?.registration_end || '',
            registration_closure: sem2.schedules?.vital?.registration_closure || '',
            course_reg_start: sem2.schedules?.vital?.course_reg_start || '',
            course_reg_end: sem2.schedules?.vital?.course_reg_end || '',
            exam_start: sem2.schedules?.vital?.exam_start || '',
            exam_end: sem2.schedules?.vital?.exam_end || '',
          },
          custom_schedules: sem2.schedules?.custom || []
        }
      ]
    })
    setIsOpen(true)
  }

  // Handle Vital Schedule fields update helper
  const handleVitalChange = (semIndex: number, field: string, value: string) => {
    const updatedSemesters = [...data.semesters]
    updatedSemesters[semIndex].schedules = {
      ...updatedSemesters[semIndex].schedules,
      [field]: value
    }
    setData('semesters', updatedSemesters)
  }

  // Custom Holiday / Specific event schedule helpers
  const addCustomSchedule = (semIndex: number) => {
    const updatedSemesters = [...data.semesters]
    updatedSemesters[semIndex].custom_schedules.push({
      id: Date.now(),
      title: '',
      type: 'single', // 'single' | 'range'
      date: '',
      start_date: '',
      end_date: ''
    })
    setData('semesters', updatedSemesters)
  }

  const removeCustomSchedule = (semIndex: number, eventId: number) => {
    const updatedSemesters = [...data.semesters]
    updatedSemesters[semIndex].custom_schedules = updatedSemesters[semIndex].custom_schedules.filter(
      (ev: any) => ev.id !== eventId
    )
    setData('semesters', updatedSemesters)
  }

  const handleCustomChange = (semIndex: number, eventId: number, field: string, value: any) => {
    const updatedSemesters = [...data.semesters]
    updatedSemesters[semIndex].custom_schedules = updatedSemesters[semIndex].custom_schedules.map((ev: any) => {
      if (ev.id === eventId) {
        return { ...ev, [field]: value }
      }
      return ev
    })
    setData('semesters', updatedSemesters)
  }

  return (
    <AppLayout title="Academic Calendar">
      <Head title="Institutional Calendar" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Academic Sessions</h1>
           <p className="text-sm text-surface-500 mt-1">Configure academic timelines, semester dates, and session transitions.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="primary" size="sm" iconLeft={<Plus size={16} />} onClick={() => {
             setEditingSessionId(null);
             reset();
             setIsOpen(true);
           }}>New Session</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            {sessions.map((session) => (
              <Card key={session.id} className={session.is_current ? 'border-brand-200 ring-4 ring-brand-50' : ''}>
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                        session.is_current ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-surface-100 text-surface-500'
                      )}>
                         {session.name.split('/')[0].slice(-2)}
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-surface-900">{session.name} Academic Session</h3>
                         <div className="flex items-center gap-2 mt-1">
                            {session.is_current ? (
                              <Badge variant="success">Active Session</Badge>
                            ) : (
                              <Badge variant="neutral">Archived</Badge>
                            )}
                         </div>
                      </div>
                   </div>
                   {session.is_current && (
                     <Button 
                       variant="outline" 
                       size="sm" 
                       iconLeft={<Settings size={14} />} 
                       onClick={() => startEdit(session)}
                     >
                       Manage
                     </Button>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {session.semesters?.map((semester: any) => {
                      const hasVital = semester.schedules?.vital && Object.values(semester.schedules.vital).some(Boolean);
                      const customEvents = semester.schedules?.custom || [];

                      return (
                        <div key={semester.id} className="p-5 rounded-2xl border border-surface-100 bg-surface-50/50 hover:bg-white hover:border-brand-100 hover:shadow-md transition-all duration-300">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-bold text-surface-800">{semester.name}</span>
                              {semester.is_current && <Badge variant="brand" className="text-[10px]">Current</Badge>}
                           </div>
                           
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 text-xs font-semibold text-surface-500 bg-white border border-surface-100 px-3 py-1.5 rounded-xl">
                                 <Clock size={12} className="text-brand-500" /> 
                                 <span>Semester Time: {semester.start_date || 'N/A'} — {semester.end_date || 'N/A'}</span>
                              </div>

                              {/* Vital Schedules List */}
                              {hasVital && (
                                <div className="space-y-2 pt-2 border-t border-surface-100">
                                   <h4 className="text-[10px] font-bold tracking-wider uppercase text-surface-400">Vital Timelines</h4>
                                   <div className="grid grid-cols-1 gap-1.5 text-xs">
                                      {semester.schedules.vital.admission_start && (
                                        <div className="flex justify-between text-surface-600">
                                           <span>Admission:</span>
                                           <span className="font-medium text-surface-800">{semester.schedules.vital.admission_start} to {semester.schedules.vital.admission_end}</span>
                                        </div>
                                      )}
                                      {semester.schedules.vital.registration_start && (
                                        <div className="flex justify-between text-surface-600">
                                           <span>Registration:</span>
                                           <span className="font-medium text-surface-800">{semester.schedules.vital.registration_start} to {semester.schedules.vital.registration_end}</span>
                                        </div>
                                      )}
                                      {semester.schedules.vital.registration_closure && (
                                        <div className="flex justify-between text-surface-600">
                                           <span>Reg closure:</span>
                                           <span className="font-bold text-error-600">{semester.schedules.vital.registration_closure}</span>
                                        </div>
                                      )}
                                      {semester.schedules.vital.course_reg_start && (
                                        <div className="flex justify-between text-surface-600">
                                           <span>Course Reg:</span>
                                           <span className="font-medium text-surface-800">{semester.schedules.vital.course_reg_start} to {semester.schedules.vital.course_reg_end}</span>
                                        </div>
                                      )}
                                      {semester.schedules.vital.exam_start && (
                                        <div className="flex justify-between text-surface-600">
                                           <span>Exams:</span>
                                           <span className="font-bold text-brand-600">{semester.schedules.vital.exam_start} to {semester.schedules.vital.exam_end}</span>
                                        </div>
                                      )}
                                   </div>
                                </div>
                              )}

                              {/* Custom Events / Holidays List */}
                              {customEvents.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-surface-100">
                                   <h4 className="text-[10px] font-bold tracking-wider uppercase text-surface-400">Custom Holidays & Events</h4>
                                   <div className="space-y-1.5">
                                      {customEvents.map((evt: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between text-xs bg-white border border-surface-100 p-2 rounded-xl">
                                           <span className="font-semibold text-surface-700">{evt.title || 'Untitled Event'}</span>
                                           <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                                              {evt.type === 'single' ? evt.date : `${evt.start_date} to ${evt.end_date}`}
                                           </span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                      )
                   })}
                </div>
              </Card>
            ))}

            {sessions.length === 0 && (
              <Card className="py-20 text-center">
                 <CalendarIcon size={48} className="mx-auto text-surface-200 mb-4" />
                 <p className="text-surface-500">No academic sessions configured yet.</p>
              </Card>
            )}
         </div>

         <div className="space-y-6">
            <Card className="bg-surface-900 text-white border-0">
               <h4 className="font-bold mb-4 flex items-center gap-2 text-brand-400">
                  <AlertCircle size={18} /> Session Transition
               </h4>
               <p className="text-xs text-surface-300 leading-relaxed mb-6">
                  Ready to transition to a new academic year? This will archive the current session and prompt student promotion.
               </p>
               <Button variant="primary" className="w-full shadow-lg" size="sm" onClick={() => setIsOpen(true)}>Initialize New Session</Button>
            </Card>

            <Card>
               <h4 className="font-bold text-surface-900 mb-4 text-sm">System Health</h4>
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-surface-500">Auto-Archiving</span>
                     <span className="text-success-600 font-bold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-surface-500">Backup Status</span>
                     <span className="text-success-600 font-bold">Healthy</span>
                  </div>
               </div>
            </Card>
         </div>
      </div>

      {/* Dynamic Session & Schedule Config Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-surface-150 rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                     Administrative Wizard
                  </span>
                  <h2 className="text-xl font-bold text-surface-900 mt-1">Configure Academic Session</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Declare active semester dates, vital registration deadlines, and custom holidays.</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Multi-Tab Selector */}
              <div className="px-6 py-2 border-b border-surface-100 bg-surface-50/20 flex gap-2">
                 <button 
                   onClick={() => setActiveTab('core')}
                   className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'core' ? 'bg-brand-500 text-white shadow-sm' : 'text-surface-600 hover:bg-surface-100'}`}
                 >
                    1. Session Core
                 </button>
                 <button 
                   onClick={() => setActiveTab('sem1')}
                   className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'sem1' ? 'bg-brand-500 text-white shadow-sm' : 'text-surface-600 hover:bg-surface-100'}`}
                 >
                    2. First Semester Schedules
                 </button>
                 <button 
                   onClick={() => setActiveTab('sem2')}
                   className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'sem2' ? 'bg-brand-500 text-white shadow-sm' : 'text-surface-600 hover:bg-surface-100'}`}
                 >
                    3. Second Semester Schedules
                 </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
                   
                   {/* TAB 1: Core Session Info */}
                   {activeTab === 'core' && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div className="sm:col-span-1">
                              <label className="block text-xs font-bold text-surface-600 uppercase mb-2">Session Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 2026/2027"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full text-sm border-surface-200 rounded-xl focus:border-brand-500 focus:ring-brand-500"
                                required
                              />
                              {errors.name && <span className="text-[10px] text-error-600 font-semibold">{errors.name}</span>}
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-surface-600 uppercase mb-2">Session Start Date</label>
                              <input 
                                type="date" 
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="w-full text-sm border-surface-200 rounded-xl focus:border-brand-500 focus:ring-brand-500"
                                required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-surface-600 uppercase mb-2">Session End Date</label>
                              <input 
                                type="date" 
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className="w-full text-sm border-surface-200 rounded-xl focus:border-brand-500 focus:ring-brand-500"
                                required
                              />
                           </div>
                        </div>

                        <div className="p-4 bg-brand-50/50 border border-brand-100/30 rounded-2xl flex items-center justify-between">
                           <div>
                              <h4 className="text-xs font-bold text-brand-800">Set as Current Session</h4>
                              <p className="text-[10px] text-brand-600">Activate this session instantly as the active administrative timeline.</p>
                           </div>
                           <input 
                             type="checkbox"
                             checked={data.is_current}
                             onChange={(e) => setData('is_current', e.target.checked)}
                             className="w-5 h-5 border-surface-200 rounded-md text-brand-600 focus:ring-brand-500"
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-surface-50 border border-surface-100 rounded-2xl">
                              <h4 className="text-xs font-bold text-surface-800 mb-2">First Semester Base</h4>
                              <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="text-[9px] font-bold text-surface-400 uppercase">Starts</label>
                                    <input 
                                      type="date" 
                                      value={data.semesters[0].start_date}
                                      onChange={(e) => {
                                        const updated = [...data.semesters]
                                        updated[0].start_date = e.target.value
                                        setData('semesters', updated)
                                      }}
                                      className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-bold text-surface-400 uppercase">Ends</label>
                                    <input 
                                      type="date" 
                                      value={data.semesters[0].end_date}
                                      onChange={(e) => {
                                        const updated = [...data.semesters]
                                        updated[0].end_date = e.target.value
                                        setData('semesters', updated)
                                      }}
                                      className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="p-4 bg-surface-50 border border-surface-100 rounded-2xl">
                              <h4 className="text-xs font-bold text-surface-800 mb-2">Second Semester Base</h4>
                              <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="text-[9px] font-bold text-surface-400 uppercase">Starts</label>
                                    <input 
                                      type="date" 
                                      value={data.semesters[1].start_date}
                                      onChange={(e) => {
                                        const updated = [...data.semesters]
                                        updated[1].start_date = e.target.value
                                        setData('semesters', updated)
                                      }}
                                      className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-bold text-surface-400 uppercase">Ends</label>
                                    <input 
                                      type="date" 
                                      value={data.semesters[1].end_date}
                                      onChange={(e) => {
                                        const updated = [...data.semesters]
                                        updated[1].end_date = e.target.value
                                        setData('semesters', updated)
                                      }}
                                      className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* TAB 2 & TAB 3: Semesters Vital & Custom Timelines */}
                   {['sem1', 'sem2'].map((semKey, index) => {
                     if (activeTab !== semKey) return null
                     const sem = data.semesters[index]

                     return (
                       <div key={semKey} className="space-y-6">
                          <div>
                             <h3 className="text-sm font-bold text-surface-800 flex items-center gap-2">
                                <BookOpen size={16} className="text-brand-500" />
                                Configure {sem.name} Vital Dates
                             </h3>
                             <p className="text-xs text-surface-400 mt-0.5">Define core institutional operational milestones for this academic term.</p>
                          </div>

                          {/* Vital Dates Form Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-surface-50/50 border border-surface-100 rounded-2xl">
                             
                             {/* Admission Duration */}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-surface-600 block">Admission Duration (Start / End)</label>
                                <div className="grid grid-cols-2 gap-2">
                                   <input 
                                     type="date" 
                                     value={sem.schedules.admission_start}
                                     onChange={(e) => handleVitalChange(index, 'admission_start', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                   <input 
                                     type="date" 
                                     value={sem.schedules.admission_end}
                                     onChange={(e) => handleVitalChange(index, 'admission_end', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                </div>
                             </div>

                             {/* Registration Period */}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-surface-600 block">Registration Period (Start / End)</label>
                                <div className="grid grid-cols-2 gap-2">
                                   <input 
                                     type="date" 
                                     value={sem.schedules.registration_start}
                                     onChange={(e) => handleVitalChange(index, 'registration_start', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                   <input 
                                     type="date" 
                                     value={sem.schedules.registration_end}
                                     onChange={(e) => handleVitalChange(index, 'registration_end', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                </div>
                             </div>

                             {/* Registration Closure Date */}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-surface-600 block">Registration Closure Date</label>
                                <input 
                                  type="date" 
                                  value={sem.schedules.registration_closure}
                                  onChange={(e) => handleVitalChange(index, 'registration_closure', e.target.value)}
                                  className="w-full text-xs p-2 border-surface-200 rounded-lg text-error-600 font-semibold"
                                />
                             </div>

                             {/* Course Registration Start & Close */}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-surface-600 block">Course Registration (Start / Close)</label>
                                <div className="grid grid-cols-2 gap-2">
                                   <input 
                                     type="date" 
                                     value={sem.schedules.course_reg_start}
                                     onChange={(e) => handleVitalChange(index, 'course_reg_start', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                   <input 
                                     type="date" 
                                     value={sem.schedules.course_reg_end}
                                     onChange={(e) => handleVitalChange(index, 'course_reg_end', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                </div>
                             </div>

                             {/* Examination Period */}
                             <div className="space-y-2 sm:col-span-2">
                                <label className="text-xs font-bold text-surface-600 block">Examination Period (Start / End)</label>
                                <div className="grid grid-cols-2 gap-4">
                                   <input 
                                     type="date" 
                                     value={sem.schedules.exam_start}
                                     onChange={(e) => handleVitalChange(index, 'exam_start', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                   <input 
                                     type="date" 
                                     value={sem.schedules.exam_end}
                                     onChange={(e) => handleVitalChange(index, 'exam_end', e.target.value)}
                                     className="w-full text-xs p-2 border-surface-200 rounded-lg"
                                   />
                                </div>
                             </div>

                          </div>

                          {/* Custom Events Timeline section */}
                          <div className="space-y-4 pt-4 border-t border-surface-100">
                             <div className="flex items-center justify-between">
                                <div>
                                   <h4 className="text-xs font-bold text-surface-800">Holidays & Custom Schedule Events</h4>
                                   <p className="text-[10px] text-surface-400">Declare public holidays, midterm breaks, or specific nursing events.</p>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  iconLeft={<PlusCircle size={14} />} 
                                  onClick={() => addCustomSchedule(index)}
                                >
                                   Add Custom Event
                                </Button>
                             </div>

                             {/* Render Custom Holiday items list */}
                             <div className="space-y-3">
                                {sem.custom_schedules.map((evt: any) => (
                                  <div key={evt.id} className="p-4 bg-surface-50 border border-surface-150 rounded-2xl space-y-4 relative">
                                     <button 
                                       type="button"
                                       onClick={() => removeCustomSchedule(index, evt.id)}
                                       className="absolute top-4 right-4 text-surface-400 hover:text-error-600 p-1.5 hover:bg-surface-100 rounded-lg transition-all"
                                     >
                                        <Trash2 size={14} />
                                     </button>

                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pr-8">
                                        <div className="sm:col-span-2">
                                           <label className="text-[9px] font-bold uppercase text-surface-400 mb-1 block">Event Title</label>
                                           <input 
                                             type="text"
                                             placeholder="e.g. Independence Day Public Holiday"
                                             value={evt.title}
                                             onChange={(e) => handleCustomChange(index, evt.id, 'title', e.target.value)}
                                             className="w-full text-xs p-2 border-surface-200 rounded-lg focus:border-brand-500 focus:ring-brand-500 bg-white"
                                           />
                                        </div>
                                        <div>
                                           <label className="text-[9px] font-bold uppercase text-surface-400 mb-1 block">Event Type</label>
                                           <select
                                             value={evt.type}
                                             onChange={(e) => handleCustomChange(index, evt.id, 'type', e.target.value)}
                                             className="w-full text-xs p-2 border-surface-200 rounded-lg focus:border-brand-500 focus:ring-brand-500 bg-white"
                                           >
                                              <option value="single">Single Day (1 Day)</option>
                                              <option value="range">Date Range (Open/Close)</option>
                                           </select>
                                        </div>
                                     </div>

                                     {/* Conditional Date inputs based on single or range selection */}
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {evt.type === 'single' ? (
                                          <div>
                                             <label className="text-[9px] font-bold uppercase text-surface-400 mb-1 block">Date of Event</label>
                                             <input 
                                               type="date"
                                               value={evt.date}
                                               onChange={(e) => handleCustomChange(index, evt.id, 'date', e.target.value)}
                                               className="w-full text-xs p-2 border-surface-200 rounded-lg bg-white"
                                             />
                                          </div>
                                        ) : (
                                          <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                                             <div>
                                                <label className="text-[9px] font-bold uppercase text-surface-400 mb-1 block">Starts (Open)</label>
                                                <input 
                                                  type="date"
                                                  value={evt.start_date}
                                                  onChange={(e) => handleCustomChange(index, evt.id, 'start_date', e.target.value)}
                                                  className="w-full text-xs p-2 border-surface-200 rounded-lg bg-white"
                                             />
                                             </div>
                                             <div>
                                                <label className="text-[9px] font-bold uppercase text-surface-400 mb-1 block">Ends (Close)</label>
                                                <input 
                                                  type="date"
                                                  value={evt.end_date}
                                                  onChange={(e) => handleCustomChange(index, evt.id, 'end_date', e.target.value)}
                                                  className="w-full text-xs p-2 border-surface-200 rounded-lg bg-white"
                                                />
                                             </div>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                                ))}

                                {sem.custom_schedules.length === 0 && (
                                  <div className="p-8 border border-dashed border-surface-250 rounded-2xl text-center text-xs text-surface-400">
                                     No holidays or specific custom event schedules declared for this semester.
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                     )
                   })}

                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-surface-100 bg-surface-50/50 flex justify-between gap-2">
                   <div>
                      {activeTab !== 'core' && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveTab(activeTab === 'sem2' ? 'sem1' : 'core')}
                        >
                           Previous Step
                        </Button>
                      )}
                   </div>
                   <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                         Cancel
                      </Button>
                      
                      {activeTab !== 'sem2' ? (
                        <Button 
                          type="button" 
                          variant="primary" 
                          size="sm"
                          onClick={() => setActiveTab(activeTab === 'core' ? 'sem1' : 'sem2')}
                        >
                           Next Step
                        </Button>
                      ) : (
                        <Button 
                          type="submit" 
                          variant="primary" 
                          size="sm"
                          disabled={processing}
                        >
                           {processing ? 'Saving...' : 'Save Academic Session'}
                        </Button>
                      )}
                   </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
