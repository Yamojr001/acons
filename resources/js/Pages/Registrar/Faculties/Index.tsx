import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Plus, ChevronRight, 
  Users, BookOpen, Settings, MoreVertical, X, 
  GraduationCap, Save, ShieldAlert
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'

const InputField = ({ label, value, onChange, error, placeholder = "", required = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">
      {label} {required && <span className="text-danger-500">*</span>}
    </label>
    <input 
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all",
        error && "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500"
      )}
    />
    {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}
  </div>
)

const SelectField = ({ label, value, onChange, error, options, required = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">
      {label} {required && <span className="text-danger-500">*</span>}
    </label>
    <select 
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer",
        error && "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500"
      )}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}
  </div>
)

interface Props extends PageProps {
  faculties: any[]
}

export default function FacultyIndex({ faculties, auth }: Props) {
  const isProvost = (auth?.user?.role as string) === 'provost'
  const [selectedDept, setSelectedDept] = useState<any | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Flatten all departments
  const departments = faculties.flatMap(f => f.departments || [])

  // Department Creation Form
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: '',
    code: '',
    faculty_id: faculties[0]?.id?.toString() || '',
  })

  const openCreateModal = () => {
    clearErrors()
    reset()
    if (faculties.length > 0) {
      setData('faculty_id', faculties[0].id.toString())
    }
    setCreateModalOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/registrar/departments', {
      onSuccess: () => {
        setCreateModalOpen(false)
        reset()
      }
    })
  }

  return (
    <AppLayout title="Departments">
      <Head title="Departments" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Departments</h1>
           <p className="text-sm text-surface-500 mt-1">View and manage the school's academic departments.</p>
        </div>
        {!isProvost && (
          <Button 
            variant="primary" 
            size="sm" 
            iconLeft={<Plus size={16} />}
            onClick={openCreateModal}
          >
            Add Department
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {departments.map((dept: any) => (
            <Card key={dept.id} className="group hover:border-brand-200 transition-all duration-300">
               <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Building2 size={24} />
                  </div>
                  {!isProvost && (
                    <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors">
                       <MoreVertical size={16} />
                    </button>
                  )}
               </div>

               <div className="mb-6">
                  <h3 className="text-lg font-bold text-surface-900 leading-tight mb-1">{dept.name}</h3>
                  <p className="text-xs text-surface-400 font-medium tracking-wider uppercase">{dept.code}</p>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-surface-50 text-center">
                     <p className="text-xs text-surface-400 mb-1">Students</p>
                     <p className="text-lg font-bold text-surface-900">{dept.students_count ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-50 text-center">
                     <p className="text-xs text-surface-400 mb-1">Staff</p>
                     <p className="text-lg font-bold text-surface-900">{dept.lecturers_count ?? 0}</p>
                  </div>
               </div>
               
               <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group" 
                    iconRight={<ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                    onClick={() => setSelectedDept(dept)}
                  >
                     {isProvost ? 'View Details' : 'Manage Department'}
                  </Button>
               </div>
            </Card>
         ))}

         {departments.length === 0 && (
           <div className="col-span-full py-20 text-center">
              <Building2 size={48} className="mx-auto text-surface-200 mb-4" />
              <p className="text-surface-500">No departments defined yet.</p>
           </div>
         )}
      </div>

      {/* View Department Details Modal */}
      <AnimatePresence>
        {selectedDept && (
          <>
            <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDept(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white border border-surface-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                      Department Profile
                    </span>
                    <h2 className="text-xl font-bold text-surface-900 mt-1">{selectedDept.name}</h2>
                    <p className="text-xs text-surface-400 font-medium tracking-wider uppercase mt-0.5">{selectedDept.code}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedDept(null)}
                    className="p-2 rounded-xl text-surface-400 hover:bg-surface-150 hover:text-surface-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100/50 text-center">
                      <p className="text-[10px] uppercase font-bold text-surface-400 mb-1">Active Students</p>
                      <p className="text-2xl font-black text-surface-900">{selectedDept.students_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100/50 text-center">
                      <p className="text-[10px] uppercase font-bold text-surface-400 mb-1">Academic Staff</p>
                      <p className="text-2xl font-black text-surface-900">{selectedDept.lecturers_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100/30 text-center">
                      <p className="text-[10px] uppercase font-bold text-brand-600 mb-1">Graduated</p>
                      <p className="text-2xl font-black text-brand-700">{selectedDept.graduated_count ?? 0}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3 flex items-center gap-1.5">
                      <Users size={14} className="text-brand-500" />
                      Active Students by Level
                    </h3>
                    <div className="space-y-3">
                      {Object.keys(selectedDept.level_breakdown || {}).length > 0 ? (
                        Object.entries(selectedDept.level_breakdown).map(([lvl, count]: [string, any]) => {
                          const total = selectedDept.students_count || 1
                          const percentage = Math.round((Number(count) / total) * 100)
                          return (
                            <div key={lvl} className="p-3 bg-surface-50/50 rounded-xl border border-surface-100/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-8 rounded-lg bg-white border border-surface-100 flex items-center justify-center text-[10px] font-bold text-surface-700">
                                  {lvl.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}
                                </div>
                                <span className="text-xs font-semibold text-surface-600">{lvl}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-surface-100 h-2 rounded-full overflow-hidden hidden sm:block">
                                  <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                                </div>
                                <span className="text-xs font-bold text-surface-800 bg-white border border-surface-100 px-2 py-0.5 rounded-md min-w-[28px] text-center">
                                  {count}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-surface-400">No active students.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-surface-100 bg-surface-50/50 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDept(null)}>
                    Close Details
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Add Department Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setCreateModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">Add Academic Department</h3>
                  </div>
                  <button onClick={() => setCreateModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                  {faculties.length === 0 && (
                    <div className="p-3 bg-danger-50 text-danger-700 text-xs rounded-xl flex items-center gap-2.5 font-medium border border-danger-100">
                      <ShieldAlert size={16} />
                      <span>Warning: No faculties exist to associate this department with!</span>
                    </div>
                  )}

                  <InputField 
                    label="Department Name"
                    value={data.name}
                    onChange={(v: string) => setData('name', v)}
                    error={errors.name}
                    placeholder="e.g. Department of General Nursing"
                    required
                  />

                  <InputField 
                    label="Department Code"
                    value={data.code}
                    onChange={(v: string) => setData('code', v)}
                    error={errors.code}
                    placeholder="e.g. NS-GEN"
                    required
                  />

                  <SelectField 
                    label="Assign to Faculty"
                    value={data.faculty_id}
                    onChange={(v: string) => setData('faculty_id', v)}
                    error={errors.faculty_id}
                    options={faculties.map(f => ({ label: f.name, value: f.id.toString() }))}
                    required
                  />

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="brand" size="sm" loading={processing} iconLeft={<Save size={16} />}>
                      Create Department
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
