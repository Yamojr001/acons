import { useState } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Mail, UserPlus, Edit2, CheckCircle, XCircle, X, ShieldAlert, Phone, MapPin, GraduationCap
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Avatar, Button } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  lecturers: {
    data: any[]
    links: any[]
    total: number
  }
  department_name: string
}

export default function HODLecturerIndex({ lecturers, department_name }: Props) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<any | null>(null)

  const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
    name: '',
    email: '',
    employee_id: '',
    qualification: '',
    gender: 'male',
    phone_number: '',
    address: '',
    status: 'active',
  })

  const filteredLecturers = lecturers.data.filter(lect => 
    lect.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    lect.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    lect.employee_id?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateModal = () => {
    clearErrors()
    reset()
    setEditingLecturer(null)
    setModalOpen(true)
  }

  const openEditModal = (lecturer: any) => {
    clearErrors()
    setEditingLecturer(lecturer)
    setData({
      name: lecturer.user?.name || '',
      email: lecturer.user?.email || '',
      employee_id: lecturer.employee_id || '',
      qualification: lecturer.qualification || '',
      gender: lecturer.gender || 'male',
      phone_number: lecturer.phone_number || '',
      address: lecturer.address || '',
      status: lecturer.status || 'active',
    })
    setModalOpen(true)
  }

  const handleToggleStatus = (lecturer: any) => {
    if (confirm(`Are you sure you want to change the status of ${lecturer.user?.name}?`)) {
      router.post(`/hod/lecturers/${lecturer.id}/status`, {}, {
        preserveScroll: true
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLecturer) {
      post(`/hod/lecturers/${editingLecturer.id}/update`, {
        onSuccess: () => {
          setModalOpen(false)
          reset()
        }
      })
    } else {
      post('/hod/lecturers', {
        onSuccess: () => {
          setModalOpen(false)
          reset()
        }
      })
    }
  }

  return (
    <AppLayout title="Department Staff Directory">
      <Head title="Department staff" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900 font-bold">Departmental Staff</h1>
           <p className="text-sm text-surface-500 mt-1">Manage academic lecturers, credentials, and teaching status in the {department_name} department.</p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          iconLeft={<UserPlus size={16} />}
          onClick={openCreateModal}
        >
          Add New Lecturer
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search staff by name, email or employee ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Lecturer Info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Employee ID</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Qualification</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Gender</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredLecturers.map((lecturer) => {
                return (
                  <tr key={lecturer.id} className="hover:bg-surface-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={lecturer.user?.name} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-surface-900 leading-none">{lecturer.user?.name}</p>
                          <p className="text-xs text-surface-400 mt-1.5 flex items-center gap-1.5">
                             <span className="flex items-center gap-1"><Mail size={10} /> {lecturer.user?.email}</span>
                             {lecturer.phone_number && (
                               <span className="flex items-center gap-1"><Phone size={10} /> {lecturer.phone_number}</span>
                             )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-surface-700 font-mono">
                      {lecturer.employee_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600">
                      {lecturer.qualification || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600 capitalize">
                      {lecturer.gender || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={lecturer.status === 'active' ? 'success' : 'warning'} className="capitalize">
                        {lecturer.status || 'active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           iconLeft={<Edit2 size={13} />}
                           onClick={() => openEditModal(lecturer)}
                         >
                           Edit Profile
                         </Button>
                         <Button 
                           variant={lecturer.status === 'active' ? 'danger' : 'success'}
                           size="sm"
                           iconLeft={lecturer.status === 'active' ? <XCircle size={13} /> : <CheckCircle size={13} />}
                           onClick={() => handleToggleStatus(lecturer)}
                         >
                           {lecturer.status === 'active' ? 'Suspend' : 'Activate'}
                         </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredLecturers.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No matching academic staff found in your department.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Lecturer Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">
                      {editingLecturer ? `Edit Profile: ${editingLecturer.user?.name}` : 'Register New Faculty Lecturer'}
                    </h3>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {!editingLecturer && (
                    <div className="p-3 bg-brand-50/50 border border-brand-100 rounded-xl flex gap-3 text-brand-800 text-xs">
                      <ShieldAlert className="shrink-0 text-brand-600 mt-0.5" size={16} />
                      <div>
                        <p className="font-bold">Important Notice</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed">
                          Adding a lecturer creates a secure user login credentials block automatically. Their default temporary login password is set to <strong>password123</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Dr. Fatima Bello"
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.name && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="fatima@ameenatu.edu.ng"
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.email && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Employee ID</label>
                      <input 
                        type="text"
                        required
                        value={data.employee_id}
                        onChange={(e) => setData('employee_id', e.target.value)}
                        placeholder="LEC-NUR-104"
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-mono"
                      />
                      {errors.employee_id && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.employee_id}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Qualification</label>
                      <input 
                        type="text"
                        value={data.qualification}
                        onChange={(e) => setData('qualification', e.target.value)}
                        placeholder="Ph.D. in Nursing Science"
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.qualification && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.qualification}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Gender Selection</label>
                      <select 
                        value={data.gender}
                        onChange={(e) => setData('gender', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.gender}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input 
                        type="text"
                        value={data.phone_number}
                        onChange={(e) => setData('phone_number', e.target.value)}
                        placeholder="08034567890"
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.phone_number && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.phone_number}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Address Details</label>
                    <textarea 
                      value={data.address}
                      onChange={(e) => setData('address', e.target.value)}
                      placeholder="Academic Staff Quarters, Block C"
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                    />
                    {errors.address && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.address}</p>}
                  </div>

                  {editingLecturer && (
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">Service Status</label>
                      <select 
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      >
                        <option value="active">Active Service</option>
                        <option value="inactive">Inactive / Suspended</option>
                      </select>
                      {errors.status && <p className="text-xs text-danger-600 mt-1 font-semibold">{errors.status}</p>}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" loading={processing}>
                      {editingLecturer ? 'Save Details' : 'Register Lecturer'}
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
