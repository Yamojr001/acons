import { useState, useEffect, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserCheck, Search, FileDown, Eye,
  Mail, Phone, Building2, Shield, X, ChevronDown,
  UserPlus, Edit2, ShieldAlert, Save, KeyRound, Award
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'

const InputField = ({ label, value, onChange, error, type = "text", placeholder = "", required = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">
      {label} {required && <span className="text-danger-500">*</span>}
    </label>
    <input 
      type={type}
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
  lecturers: {
    data: any[]
    links: any[]
    total: number
  }
  departments: any[]
  filters: {
    search?: string
  }
}

export default function LecturerIndex({ lecturers, departments, filters, auth }: Props) {
  const isProvost = (auth?.user?.role as string) === 'provost'

  const [search, setSearch] = useState(filters?.search || '')
  const [exportOpen, setExportOpen] = useState(false)
  const [isFirstRender, setIsFirstRender] = useState(true)

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false)
      return
    }

    const delayDebounceFn = setTimeout(() => {
      router.get(
        '/registrar/lecturers', 
        { search }, 
        { preserveState: true, replace: true }
      )
    }, 250)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const [selectedLecturer, setSelectedLecturer] = useState<any | null>(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [crudModalOpen, setCrudModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Appoint Role Form (for Provost)
  const roleForm = useForm({
    role: '',
  })

  // Lecturer CRUD Form
  const crudForm = useForm({
    name: '',
    email: '',
    employee_id: '',
    department_id: '',
    qualification: '',
    gender: 'male',
    phone_number: '',
    address: '',
    status: 'active',
  })

  const openAddModal = () => {
    crudForm.clearErrors()
    crudForm.reset()
    // Pre-populate with first department if available
    if (departments.length > 0) {
      crudForm.setData(prev => ({
        ...prev,
        department_id: departments[0].id.toString()
      }))
    }
    setModalMode('create')
    setCrudModalOpen(true)
  }

  const openEditModal = (lecturer: any) => {
    crudForm.clearErrors()
    crudForm.setData({
      name: lecturer.user.name,
      email: lecturer.user.email,
      employee_id: lecturer.employee_id || '',
      department_id: lecturer.department_id?.toString() || '',
      qualification: lecturer.qualification || '',
      gender: lecturer.gender || 'male',
      phone_number: lecturer.phone_number || '',
      address: lecturer.address || '',
      status: lecturer.status || 'active',
    })
    setSelectedLecturer(lecturer)
    setModalMode('edit')
    setCrudModalOpen(true)
  }

  const handleCrudSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (modalMode === 'create') {
      crudForm.post('/registrar/lecturers', {
        onSuccess: () => {
          setCrudModalOpen(false)
          crudForm.reset()
        }
      })
    } else {
      crudForm.put(`/registrar/lecturers/${selectedLecturer.id}`, {
        onSuccess: () => {
          setCrudModalOpen(false)
          setSelectedLecturer(null)
        }
      })
    }
  }

  const openRoleModal = (lecturer: any) => {
    setSelectedLecturer(lecturer)
    const currentRole = lecturer.user?.roles?.[0]?.name || 'lecturer'
    roleForm.setData('role', currentRole)
    setRoleModalOpen(true)
  }

  const handleRoleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLecturer) return

    roleForm.post(`/registrar/lecturers/${selectedLecturer.user.id}/role`, {
      onSuccess: () => {
        setRoleModalOpen(false)
        setSelectedLecturer(null)
      }
    })
  }

  const toggleStatus = (lecturer: any) => {
    if (confirm(`Are you sure you want to change the status of ${lecturer.user.name}?`)) {
      router.post(`/registrar/lecturers/${lecturer.id}/toggle`, {}, {
        preserveScroll: true
      })
    }
  }

  return (
    <AppLayout title="Staff Directory">
      <Head title="Staff Management" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Academic Staff</h1>
           <p className="text-sm text-surface-500 mt-1">Manage institutional faculty members, rankings, and departmental assignments.</p>
        </div>
        <div className="flex gap-2 relative">
             <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  iconLeft={<FileDown size={16} />}
                  iconRight={<ChevronDown size={14} />}
                  onClick={() => setExportOpen(!exportOpen)}
                >
                  Export Staff List
                </Button>
                
                <AnimatePresence>
                  {exportOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-surface-150 rounded-xl shadow-lg z-20 py-1 overflow-hidden"
                      >
                        <a 
                          href="/registrar/lecturers/export/pdf" 
                          target="_blank" 
                          className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                          onClick={() => setExportOpen(false)}
                        >
                          Download PDF Report
                        </a>
                        <a 
                          href="/registrar/lecturers/export/csv" 
                          className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                          onClick={() => setExportOpen(false)}
                        >
                          Download CSV (Excel)
                        </a>
                        <a 
                          href="/registrar/lecturers/export/xlsx" 
                          className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                          onClick={() => setExportOpen(false)}
                        >
                          Download Excel Sheet
                        </a>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>
             
             {!isProvost && (
               <Button 
                 variant="primary" 
                 size="sm" 
                 iconLeft={<UserPlus size={16} />}
                 onClick={openAddModal}
               >
                 Add Staff Member
               </Button>
             )}
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
              <input 
                type="text" 
                placeholder="Search staff by name, email, phone or ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Lecturer Info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Employee ID</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Department</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Current Role</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {lecturers.data.map((lecturer) => {
                const currentRole = lecturer.user?.roles?.[0]?.name || 'lecturer'
                return (
                  <tr key={lecturer.id} className="hover:bg-surface-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={lecturer.user.name} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-surface-900 leading-none">{lecturer.user.name}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-surface-400">
                             <span className="flex items-center gap-1"><Mail size={10} /> {lecturer.user.email}</span>
                             {lecturer.phone_number && (
                               <span className="flex items-center gap-1"><Phone size={10} /> {lecturer.phone_number}</span>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-surface-700 font-mono">
                      {lecturer.employee_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-surface-600">
                         <Building2 size={14} className="text-surface-400" />
                         {lecturer.department?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        currentRole === 'provost' ? 'brand' :
                        currentRole === 'registrar' ? 'brand' :
                        currentRole === 'bursar' ? 'neutral' :
                        currentRole === 'hod' ? 'warning' : 'success'
                      } className="capitalize font-medium">
                        {currentRole.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={lecturer.status === 'active' ? 'success' : 'danger'} className="capitalize font-medium">
                        {lecturer.status || 'active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         {isProvost && (
                           <Button 
                             variant="outline" 
                             size="xs" 
                             iconLeft={<Shield size={14} />}
                             onClick={() => openRoleModal(lecturer)}
                           >
                             Appoint
                           </Button>
                         )}
                         
                         {!isProvost && (
                           <>
                             <Button 
                               variant="outline" 
                               size="xs" 
                               iconLeft={<Edit2 size={13} />}
                               onClick={() => openEditModal(lecturer)}
                             >
                               Edit
                             </Button>
                             <Button 
                               variant={lecturer.status === 'active' ? 'danger' : 'success'}
                               size="xs"
                               onClick={() => toggleStatus(lecturer)}
                             >
                               {lecturer.status === 'active' ? 'Suspend' : 'Activate'}
                             </Button>
                           </>
                         )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {lecturers.data.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No academic staff records found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role Management Modal (Provost) */}
      <AnimatePresence>
        {roleModalOpen && selectedLecturer && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setRoleModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">Appoint / Change Role</h3>
                  </div>
                  <button onClick={() => setRoleModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRoleChangeSubmit} className="p-6 space-y-4">
                  <div className="p-3 bg-surface-50 rounded-xl flex items-center gap-3">
                    <Avatar name={selectedLecturer.user.name} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-surface-900">{selectedLecturer.user.name}</p>
                      <p className="text-xs text-surface-500">{selectedLecturer.user.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Select Institutional Role</label>
                    <select 
                      value={roleForm.data.role}
                      onChange={(e) => roleForm.setData('role', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="lecturer">Lecturer (Academic Staff)</option>
                      <option value="hod">Head of Department (HOD)</option>
                      <option value="registrar">Registrar</option>
                      <option value="bursar">Bursar</option>
                      <option value="admission_officer">Admission Officer</option>
                      <option value="provost">Provost</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" loading={roleForm.processing}>
                      Confirm Appointment
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Staff CRUD Modal (Add/Edit) */}
      <AnimatePresence>
        {crudModalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setCrudModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">
                      {modalMode === 'create' ? 'Register New Staff Member' : 'Edit Staff Record'}
                    </h3>
                  </div>
                  <button onClick={() => setCrudModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCrudSubmit} className="p-6 space-y-4">
                  {modalMode === 'create' && (
                    <div className="p-3 bg-brand-50 text-brand-700 text-xs rounded-xl flex items-center gap-2.5 font-medium mb-2 border border-brand-100">
                      <ShieldAlert size={16} />
                      <span>Note: A user account will be created automatically. The temporary password is set to <strong>password123</strong>.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="Staff Full Name" 
                      value={crudForm.data.name}
                      onChange={(v: string) => crudForm.setData('name', v)}
                      error={crudForm.errors.name}
                      placeholder="e.g. Dr. John Doe"
                      required
                    />

                    <InputField 
                      label="Official Email Address" 
                      value={crudForm.data.email}
                      onChange={(v: string) => crudForm.setData('email', v)}
                      error={crudForm.errors.email}
                      placeholder="john.doe@ameenatu.edu.ng"
                      type="email"
                      required
                    />

                    <InputField 
                      label="Employee ID Number" 
                      value={crudForm.data.employee_id}
                      onChange={(v: string) => crudForm.setData('employee_id', v)}
                      error={crudForm.errors.employee_id}
                      placeholder="e.g. STAFF/2026/001"
                      required
                    />

                    <SelectField 
                      label="Primary Department" 
                      value={crudForm.data.department_id}
                      onChange={(v: string) => crudForm.setData('department_id', v)}
                      error={crudForm.errors.department_id}
                      options={departments.map(d => ({ label: d.name, value: d.id.toString() }))}
                      required
                    />

                    <InputField 
                      label="Highest Academic Qualification" 
                      value={crudForm.data.qualification}
                      onChange={(v: string) => crudForm.setData('qualification', v)}
                      error={crudForm.errors.qualification}
                      placeholder="e.g. Ph.D. in Nursing Science"
                    />

                    <SelectField 
                      label="Gender" 
                      value={crudForm.data.gender}
                      onChange={(v: string) => crudForm.setData('gender', v)}
                      error={crudForm.errors.gender}
                      options={[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other', value: 'other' }
                      ]}
                      required
                    />

                    <InputField 
                      label="Phone Number" 
                      value={crudForm.data.phone_number}
                      onChange={(v: string) => crudForm.setData('phone_number', v)}
                      error={crudForm.errors.phone_number}
                      placeholder="e.g. +234 803 123 4567"
                    />

                    {modalMode === 'edit' && (
                      <SelectField 
                        label="Account Roster Status" 
                        value={crudForm.data.status}
                        onChange={(v: string) => crudForm.setData('status', v)}
                        error={crudForm.errors.status}
                        options={[
                          { label: 'Active (Enabled)', value: 'active' },
                          { label: 'Inactive (Suspended)', value: 'inactive' }
                        ]}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">Residential Address</label>
                    <textarea 
                      value={crudForm.data.address}
                      onChange={e => crudForm.setData('address', e.target.value)}
                      rows={2}
                      placeholder="Provide full contact/residential street address details..."
                      className={cn(
                        "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none",
                        crudForm.errors.address && "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500"
                      )}
                    />
                    {crudForm.errors.address && <p className="text-xs text-danger-600 font-medium">{crudForm.errors.address}</p>}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCrudModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="brand" size="sm" loading={crudForm.processing} iconLeft={<Save size={16} />}>
                      {modalMode === 'create' ? 'Register Staff' : 'Save Changes'}
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
