import { useState } from 'react'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Search, Filter, MoreVertical, 
  CheckCircle, XCircle, Eye, Clock,
  UserPlus, Download, X
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
import { formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  applications: {
    data: any[]
    links: any[]
    total: number
  }
  stats: {
    total: number
    admitted: number
    rejected: number
    pending: number
  }
  deptYearStats: Record<string, number>
  filters: {
    year?: string
  }
  availableYears: string[]
  departments: Array<{ id: number; name: string; code: string }>
  defaultClearanceSchedule?: string
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const SUBJECTS_LIST = [
  'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics',
  'Civic Education', 'Computer Studies', 'Agricultural Science', 'Geography',
  'Economics', 'Islamic Studies', 'Christian Religious Studies', 'Government'
]

const GRADES_LIST = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']

export default function AdmissionIndex({ 
  applications, 
  stats, 
  deptYearStats, 
  auth, 
  filters, 
  availableYears, 
  departments = [], 
  defaultClearanceSchedule = 'Mondays and Tuesdays between 10am and 2pm at the HOD\'s Office (starting May 25th).' 
}: Props) {
  const userRoles = (auth.user as any)?.roles?.map((r: any) => r.name) || [auth.user?.role || ''];
  const isRegistrar = userRoles.includes('registrar');
  const isProvost = userRoles.includes('provost');
  const isAdmissionOfficer = userRoles.includes('admission_officer');

  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [admitModalOpen, setAdmitModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  const admitForm = useForm({
    department_id: departments?.find(d => d.name.toLowerCase().includes('nursing'))?.id || '',
    section: 'ND',
    clearance_schedule: defaultClearanceSchedule,
  })

  const rejectForm = useForm({
    reason: '',
  })

  const [directModalOpen, setDirectModalOpen] = useState(false)
  const [directStep, setDirectStep] = useState(1)

  const directForm = useForm({
    // Step 1: Personal Info
    full_name: '',
    dob: '',
    place_of_birth: '',
    lga: '',
    state_of_origin: '',
    nationality: 'Nigeria',
    email: '',
    contact_address: '',
    phone_number: '',
    sex: 'Female',
    next_of_kin_name: '',
    next_of_kin_address: '',
    physical_disabilities: 'None',
    highest_qualification: 'Senior Secondary School Certificate',
    jamb_score: '',
    jamb_number: '',

    // Step 2: Schools Attended
    primary_school_name: '',
    primary_school_from: '',
    primary_school_to: '',
    secondary_school_name: '',
    secondary_school_from: '',
    secondary_school_to: '',
    tertiary_school_name: '',
    tertiary_school_from: '',
    tertiary_school_to: '',

    // Step 3: Parents & Sponsors
    parent_name: '',
    parent_address: '',
    parent_phone: '',
    sponsor_name_address: '',

    // Step 4: O'Levels Sitting 1
    first_sitting_type: 'NECO',
    first_sitting_year: '2025',
    first_sitting_no: '',
    first_sitting_grades: [
      { subject: 'English Language', grade: 'C6' },
      { subject: 'Mathematics', grade: 'B3' },
      { subject: 'Biology', grade: 'C6' },
      { subject: 'Chemistry', grade: 'D7' },
      { subject: 'Physics', grade: 'C5' },
    ] as Array<{ subject: string; grade: string }>,

    // O'Levels Sitting 2 (Optional)
    second_sitting_type: '',
    second_sitting_year: '',
    second_sitting_no: '',
    second_sitting_grades: [] as Array<{ subject: string; grade: string }>,
  })

  const handleDirectGradeChange1 = (index: number, field: 'subject' | 'grade', value: string) => {
    const updated = [...directForm.data.first_sitting_grades]
    updated[index][field] = value
    directForm.setData('first_sitting_grades', updated)
  }

  const addDirectSubjectRow1 = () => {
    directForm.setData('first_sitting_grades', [...directForm.data.first_sitting_grades, { subject: 'Civic Education', grade: 'C6' }])
  }

  const removeDirectSubjectRow1 = (index: number) => {
    const updated = directForm.data.first_sitting_grades.filter((_, i) => i !== index)
    directForm.setData('first_sitting_grades', updated)
  }

  const handleDirectGradeChange2 = (index: number, field: 'subject' | 'grade', value: string) => {
    const updated = [...directForm.data.second_sitting_grades]
    updated[index][field] = value
    directForm.setData('second_sitting_grades', updated)
  }

  const addDirectSubjectRow2 = () => {
    directForm.setData('second_sitting_grades', [...directForm.data.second_sitting_grades, { subject: 'English Language', grade: 'C6' }])
  }

  const removeDirectSubjectRow2 = (index: number) => {
    const updated = directForm.data.second_sitting_grades.filter((_, i) => i !== index)
    directForm.setData('second_sitting_grades', updated)
  }

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetRoute = isAdmissionOfficer
      ? route('admission_officer.direct')
      : route('registrar.admissions.direct')
      
    directForm.post(targetRoute, {
      onSuccess: () => {
        setDirectModalOpen(false)
        directForm.reset()
        setDirectStep(1)
      }
    })
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    const destRoute = isAdmissionOfficer ? 'admission_officer.manage' : 'registrar.admissions';
    router.get(
      route(destRoute),
      { year: year || undefined },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetRoute = isAdmissionOfficer 
      ? route('admission_officer.admit', selectedApp.id)
      : route('registrar.admissions.admit', selectedApp.id)
    
    admitForm.post(targetRoute, {
      onSuccess: () => {
        setAdmitModalOpen(false)
        setSelectedApp(null)
        admitForm.reset()
      }
    })
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetRoute = isAdmissionOfficer
      ? route('admission_officer.reject', selectedApp.id)
      : route('registrar.admissions.reject', selectedApp.id)
    
    rejectForm.post(targetRoute, {
      onSuccess: () => {
        setRejectModalOpen(false)
        setSelectedApp(null)
        rejectForm.reset()
      }
    })
  }

  return (
    <AppLayout title="Admission Management">
      <Head title="Admissions Office" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Admission Applications</h1>
           <p className="text-sm text-surface-500 mt-1">Review and process student applications for the current academic session.</p>
        </div>
        <div className="flex gap-2">
          {!isProvost && (
            <div className="flex items-center gap-2">
              <a 
                href={route(isAdmissionOfficer ? 'admission_officer.export' : 'registrar.admissions.export', { year: filters.year })}
                download
                className="inline-flex items-center gap-2 justify-center px-4 py-2 bg-white border border-surface-200 text-surface-600 rounded-xl text-xs font-bold hover:bg-surface-50 shadow-sm"
              >
                <Download size={14} /> Export Batch
              </a>
              <Button 
                variant="primary" 
                size="sm" 
                iconLeft={<UserPlus size={16} />}
                onClick={() => setDirectModalOpen(true)}
              >
                Direct Admission
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3 mb-2 text-surface-500">
            <FileText size={18} />
            <span className="font-semibold text-sm">Total Applications</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{stats.total}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2 text-success-500">
            <CheckCircle size={18} />
            <span className="font-semibold text-sm">Admitted</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{stats.admitted}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2 text-danger-500">
            <XCircle size={18} />
            <span className="font-semibold text-sm">Rejected</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{stats.rejected}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2 text-warning-500">
            <Clock size={18} />
            <span className="font-semibold text-sm">Pending</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{stats.pending}</div>
        </Card>
      </div>

      {Object.keys(deptYearStats).length > 0 && (
        <Card className="mb-8 p-4">
          <h3 className="text-lg font-bold text-surface-900 mb-4">Admissions by Department & Year</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Object.entries(deptYearStats).map(([key, count]) => (
              <div key={key} className="bg-surface-50 border border-surface-100 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-surface-700 truncate mr-2" title={key}>{key}</span>
                <Badge variant="success">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
              <input 
                type="text" 
                placeholder="Search applicants by name or application ID..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
           </div>
           <div className="w-full sm:w-auto">
              <select 
                className="w-full sm:w-auto pl-4 pr-10 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                value={filters?.year || ''}
                onChange={handleYearChange}
              >
                <option value="">All Years</option>
                {availableYears?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Applicant</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Form Type</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Applied Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
                {!isProvost && (
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {applications.data.map((app) => (
                <tr key={app.id} className="hover:bg-surface-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={app.applicant_name || 'Applicant'} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-surface-900 leading-none">{app.applicant_name || 'N/A'}</p>
                        <p className="text-[10px] text-surface-400 mt-1 uppercase tracking-wider font-semibold">ID: ADM-{app.id.toString().padStart(5, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {app.form?.title || 'General Admission'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                       <Clock size={12} /> {formatDate(app.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                       app.status === 'approved' || app.status === 'accepted' ? 'success' : 
                       app.status === 'rejected' ? 'danger' : 'warning'
                    } className="capitalize">
                      {app.status}
                    </Badge>
                  </td>
                  {!isProvost && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           iconLeft={<Eye size={14} />} 
                           onClick={() => { setSelectedApp(app); setViewModalOpen(true); }}
                         >
                           Review Details
                         </Button>
                         {app.status === 'pending' && !isRegistrar && (
                           <>
                             <Button 
                               variant="primary" 
                               size="sm" 
                               onClick={() => { setSelectedApp(app); admitForm.setData('clearance_schedule', defaultClearanceSchedule); setAdmitModalOpen(true); }}
                             >
                               Admit
                             </Button>
                             <Button 
                               variant="outline" 
                               className="text-danger-600 hover:text-danger-700 hover:bg-danger-50" 
                               size="sm" 
                               onClick={() => { setSelectedApp(app); setRejectModalOpen(true); }}
                             >
                               Reject
                             </Button>
                           </>
                         )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {applications.data.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No admission applications received yet.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Applicant Details Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedApp && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setViewModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold text-surface-900 text-lg">Application Details - {selectedApp.applicant_name}</h3>
                  <button onClick={() => setViewModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100">
                      <p className="text-[10px] uppercase font-bold text-surface-400">Applicant Name</p>
                      <p className="text-sm font-bold text-surface-800 mt-0.5">{selectedApp.applicant_name}</p>
                    </div>
                    <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100">
                      <p className="text-[10px] uppercase font-bold text-surface-400">Email Address</p>
                      <p className="text-sm font-bold text-surface-800 mt-0.5">{selectedApp.applicant_email}</p>
                    </div>
                    <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100">
                      <p className="text-[10px] uppercase font-bold text-surface-400">Application Status</p>
                      <p className="text-sm font-bold mt-0.5 capitalize">
                        <Badge variant={selectedApp.status === 'admitted' || selectedApp.status === 'cleared' ? 'success' : selectedApp.status === 'rejected' ? 'danger' : 'warning'}>
                          {selectedApp.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100">
                      <p className="text-[10px] uppercase font-bold text-surface-400">Date Applied</p>
                      <p className="text-sm font-bold text-surface-800 mt-0.5">{formatDate(selectedApp.created_at)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-surface-900 mb-3 text-xs uppercase tracking-wider">Form Submitted Details</h4>
                    <div className="bg-surface-50/50 border border-surface-100 rounded-xl divide-y divide-surface-100 overflow-hidden">
                      {selectedApp.data && Object.entries(selectedApp.data).map(([key, value]) => {
                        const isGrades = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'subject' in value[0];
                        return (
                          <div key={key} className={`p-3.5 flex ${isGrades ? 'flex-col gap-2' : 'justify-between items-center gap-4'} text-sm`}>
                            <span className="font-semibold text-surface-500 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className={`font-bold text-surface-800 w-full ${isGrades ? 'text-left' : 'text-right max-w-md break-all'}`}>
                              {isGrades ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
                                  {(value as any[]).map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white border border-surface-200 rounded-xl px-3.5 py-2 shadow-sm text-xs">
                                      <span className="text-surface-600 font-semibold">{item.subject}</span>
                                      <span className="text-brand-600 font-black bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-lg">{item.grade}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : typeof value === 'object' ? (
                                JSON.stringify(value)
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-surface-100 flex justify-end gap-3 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>Close</Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Admit Candidate Modal */}
      <AnimatePresence>
        {admitModalOpen && selectedApp && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setAdmitModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold text-surface-900">Offer Provisional Admission</h3>
                  <button onClick={() => setAdmitModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAdmitSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Select Admitting Department</label>
                    <select 
                      required
                      value={admitForm.data.department_id}
                      onChange={(e) => admitForm.setData('department_id', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {admitForm.errors.department_id && <p className="text-xs text-danger-500 mt-1">{admitForm.errors.department_id}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Select Section</label>
                    <select 
                      required
                      value={admitForm.data.section}
                      onChange={(e) => admitForm.setData('section', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="ND">National Diploma (ND)</option>
                      <option value="HND">Higher National Diploma (HND)</option>
                    </select>
                    {admitForm.errors.section && <p className="text-xs text-danger-500 mt-1">{admitForm.errors.section}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Scheduled Clearance Schedule</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="e.g. Mondays and Tuesdays between 10am and 2pm at the HOD's Office (starting May 25th)."
                      value={admitForm.data.clearance_schedule}
                      onChange={(e) => admitForm.setData('clearance_schedule', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                    />
                    {admitForm.errors.clearance_schedule && <p className="text-xs text-danger-500 mt-1">{admitForm.errors.clearance_schedule}</p>}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setAdmitModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" loading={admitForm.processing}>
                      Approve & Offer Admission
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Reject Candidate Modal */}
      <AnimatePresence>
        {rejectModalOpen && selectedApp && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setRejectModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold text-surface-900">Reject Admission Application</h3>
                  <button onClick={() => setRejectModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRejectSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Reason for Rejection</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Provide a clear, detailed reason for the applicant..."
                      value={rejectForm.data.reason}
                      onChange={(e) => rejectForm.setData('reason', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                    />
                    {rejectForm.errors.reason && <p className="text-xs text-danger-500 mt-1">{rejectForm.errors.reason}</p>}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="bg-danger-600 hover:bg-danger-700 text-white border-0" size="sm" loading={rejectForm.processing}>
                      Confirm Rejection
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Direct Admission Side Drawer */}
      <AnimatePresence>
        {directModalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setDirectModalOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full overflow-hidden text-left"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0 bg-surface-50">
                <div>
                  <h3 className="font-display font-black text-lg text-surface-900">Direct Admission Application</h3>
                  <p className="text-xs text-surface-500 mt-0.5">Register a new candidate directly to the admissions roster.</p>
                </div>
                <button onClick={() => setDirectModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-surface-200 text-surface-400 hover:text-surface-600 shadow-sm transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Multi-step progress bar */}
              <div className="bg-surface-50/50 px-6 py-4 border-b border-surface-100 flex-shrink-0">
                <div className="flex items-center justify-between relative max-w-md mx-auto">
                  <div className="absolute left-0 right-0 h-0.5 bg-surface-200 -z-10 rounded-full" />
                  <div 
                    className="absolute left-0 h-0.5 bg-brand-600 -z-10 rounded-full transition-all duration-300"
                    style={{ width: `${((directStep - 1) / 3) * 100}%` }}
                  />

                  {[
                    { s: 1, label: 'Personal' },
                    { s: 2, label: 'Academic' },
                    { s: 3, label: 'Sponsors' },
                    { s: 4, label: "O'Levels" }
                  ].map((item) => (
                    <button 
                      key={item.s} 
                      type="button"
                      onClick={() => setDirectStep(item.s)}
                      className="flex flex-col items-center gap-1 bg-white px-2 focus:outline-none"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border transition-all ${
                        directStep >= item.s 
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm' 
                          : 'bg-white border-surface-200 text-surface-400'
                      }`}>
                        {item.s}
                      </div>
                      <span className={`text-[9px] font-bold tracking-tight ${
                        directStep >= item.s ? 'text-brand-600' : 'text-surface-400'
                      }`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Content - Scrollable Form */}
              <form onSubmit={handleDirectSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {directStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">1. Personal Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Full Name *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.full_name} 
                          onChange={(e) => directForm.setData('full_name', e.target.value)}
                          placeholder="e.g. Fatima Abubakar"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.full_name && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.full_name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Date of Birth *</label>
                        <input 
                          type="date" 
                          required
                          value={directForm.data.dob} 
                          onChange={(e) => directForm.setData('dob', e.target.value)}
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.dob && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.dob}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Gender *</label>
                        <select 
                          required
                          value={directForm.data.sex} 
                          onChange={(e) => directForm.setData('sex', e.target.value)}
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                        </select>
                        {directForm.errors.sex && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.sex}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Place of Birth *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.place_of_birth} 
                          onChange={(e) => directForm.setData('place_of_birth', e.target.value)}
                          placeholder="e.g. Babura"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.place_of_birth && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.place_of_birth}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">State of Origin *</label>
                        <select 
                          required
                          value={directForm.data.state_of_origin} 
                          onChange={(e) => directForm.setData('state_of_origin', e.target.value)}
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        >
                          <option value="">-- Select State --</option>
                          {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {directForm.errors.state_of_origin && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.state_of_origin}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">LGA of Origin *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.lga} 
                          onChange={(e) => directForm.setData('lga', e.target.value)}
                          placeholder="e.g. Babura"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.lga && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.lga}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Nationality *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.nationality} 
                          onChange={(e) => directForm.setData('nationality', e.target.value)}
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.nationality && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.nationality}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={directForm.data.email} 
                          onChange={(e) => directForm.setData('email', e.target.value)}
                          placeholder="e.g. candidate@gmail.com"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Phone Number *</label>
                        <input 
                          type="tel" 
                          required
                          value={directForm.data.phone_number} 
                          onChange={(e) => directForm.setData('phone_number', e.target.value)}
                          placeholder="e.g. 08012345678"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.phone_number && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.phone_number}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Highest Qualification *</label>
                        <select 
                          required
                          value={directForm.data.highest_qualification} 
                          onChange={(e) => directForm.setData('highest_qualification', e.target.value)}
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        >
                          <option value="Senior Secondary School Certificate">Senior Secondary School Certificate (SSCE / NECO)</option>
                          <option value="National Diploma (ND)">National Diploma (ND)</option>
                          <option value="Higher National Diploma (HND)">Higher National Diploma (HND)</option>
                          <option value="Bachelor Degree (B.Sc)">Bachelor Degree (B.Sc)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">JAMB Reg Number *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.jamb_number} 
                          onChange={(e) => directForm.setData('jamb_number', e.target.value)}
                          placeholder="e.g. 25102831AB"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500 font-mono" 
                        />
                        {directForm.errors.jamb_number && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.jamb_number}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">JAMB Score *</label>
                        <input 
                          type="number" 
                          required
                          min={150}
                          value={directForm.data.jamb_score} 
                          onChange={(e) => directForm.setData('jamb_score', e.target.value)}
                          placeholder="Min 150"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 focus:ring-brand-500" 
                        />
                        {directForm.errors.jamb_score && <p className="text-xs text-red-500 mt-1 font-semibold">{directForm.errors.jamb_score}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Contact Address *</label>
                        <textarea 
                          rows={2}
                          required
                          value={directForm.data.contact_address} 
                          onChange={(e) => directForm.setData('contact_address', e.target.value)}
                          placeholder="Residential Address"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Physical Disabilities</label>
                        <textarea 
                          rows={2}
                          value={directForm.data.physical_disabilities} 
                          onChange={(e) => directForm.setData('physical_disabilities', e.target.value)}
                          placeholder="State 'None' or any other"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-surface-100 pt-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Next of Kin Name *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.next_of_kin_name} 
                          onChange={(e) => directForm.setData('next_of_kin_name', e.target.value)}
                          placeholder="Emergency contact full name"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Next of Kin Address *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.next_of_kin_address} 
                          onChange={(e) => directForm.setData('next_of_kin_address', e.target.value)}
                          placeholder="Emergency contact address"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {directStep === 2 && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">2. Academic History (Schools Attended)</h4>
                    
                    <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 space-y-4 text-left">
                      <span className="text-xs font-bold text-brand-600 block uppercase tracking-wider">I. Primary Institution Details</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Primary School Name *</label>
                          <input 
                            type="text" 
                            required
                            value={directForm.data.primary_school_name} 
                            onChange={(e) => directForm.setData('primary_school_name', e.target.value)}
                            placeholder="e.g. Babura Primary School"
                            className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase mb-1">From *</label>
                            <input type="text" placeholder="2013" required value={directForm.data.primary_school_from} onChange={(e) => directForm.setData('primary_school_from', e.target.value)} className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase mb-1">To *</label>
                            <input type="text" placeholder="2019" required value={directForm.data.primary_school_to} onChange={(e) => directForm.setData('primary_school_to', e.target.value)} className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 space-y-4 text-left">
                      <span className="text-xs font-bold text-brand-600 block uppercase tracking-wider">II. Secondary Institution Details</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Secondary School Name *</label>
                          <input 
                            type="text" 
                            required
                            value={directForm.data.secondary_school_name} 
                            onChange={(e) => directForm.setData('secondary_school_name', e.target.value)}
                            placeholder="Secondary School Name"
                            className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase mb-1">From *</label>
                            <input type="text" placeholder="2019" required value={directForm.data.secondary_school_from} onChange={(e) => directForm.setData('secondary_school_from', e.target.value)} className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase mb-1">To *</label>
                            <input type="text" placeholder="2025" required value={directForm.data.secondary_school_to} onChange={(e) => directForm.setData('secondary_school_to', e.target.value)} className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 space-y-4 text-left">
                      <span className="text-xs font-bold text-brand-600 block uppercase tracking-wider">III. Tertiary Institution Details (Optional)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Tertiary School Name</label>
                          <input 
                            type="text" 
                            value={directForm.data.tertiary_school_name} 
                            onChange={(e) => directForm.setData('tertiary_school_name', e.target.value)}
                            placeholder="Tertiary School Name (if any)"
                            className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase mb-1">From</label>
                            <input type="text" placeholder="e.g. 2023" value={directForm.data.tertiary_school_from} onChange={(e) => directForm.setData('tertiary_school_from', e.target.value)} className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-surface-500 uppercase mb-1">To</label>
                            <input type="text" placeholder="e.g. 2025" value={directForm.data.tertiary_school_to} onChange={(e) => directForm.setData('tertiary_school_to', e.target.value)} className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {directStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">3. Parent, Guardian & Sponsor Contacts</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Parent/Guardian Name *</label>
                        <input 
                          type="text" 
                          required
                          value={directForm.data.parent_name} 
                          onChange={(e) => directForm.setData('parent_name', e.target.value)}
                          placeholder="Father/Mother/Guardian Full Name"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Parent Phone Number *</label>
                        <input 
                          type="tel" 
                          required
                          value={directForm.data.parent_phone} 
                          onChange={(e) => directForm.setData('parent_phone', e.target.value)}
                          placeholder="Parent Phone Number"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Parent/Guardian Contact Address *</label>
                        <textarea 
                          rows={3}
                          required
                          value={directForm.data.parent_address} 
                          onChange={(e) => directForm.setData('parent_address', e.target.value)}
                          placeholder="Parent Permanent Address"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 resize-none" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Sponsor Name & Address *</label>
                        <textarea 
                          rows={3}
                          required
                          value={directForm.data.sponsor_name_address} 
                          onChange={(e) => directForm.setData('sponsor_name_address', e.target.value)}
                          placeholder="Sponsor Name and Full Contact Address"
                          className="w-full rounded-xl border-surface-200 text-sm focus:border-brand-500 resize-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {directStep === 4 && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">4. O'Levels Academic Sittings</h4>
                    
                    {/* Sitting 1 */}
                    <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">First Sitting (Mandatory)</span>
                        <div className="flex items-center gap-2">
                          <select 
                            value={directForm.data.first_sitting_type} 
                            onChange={(e) => directForm.setData('first_sitting_type', e.target.value)}
                            className="rounded-lg border-surface-200 text-xs py-1"
                          >
                            <option value="NECO">NECO</option>
                            <option value="WAEC">WAEC</option>
                            <option value="NABTEB">NABTEB</option>
                            <option value="NBAIS">NBAIS</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder="Year" 
                            required
                            value={directForm.data.first_sitting_year} 
                            onChange={(e) => directForm.setData('first_sitting_year', e.target.value)}
                            className="w-16 rounded-lg border-surface-200 text-xs py-1 text-center" 
                          />
                          <input 
                            type="text" 
                            placeholder="Exam No" 
                            required
                            value={directForm.data.first_sitting_no} 
                            onChange={(e) => directForm.setData('first_sitting_no', e.target.value)}
                            className="w-28 rounded-lg border-surface-200 text-xs py-1 text-center font-mono" 
                          />
                        </div>
                      </div>

                      <div className="border border-surface-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-surface-100 border-b border-surface-200 text-surface-700 font-bold">
                            <tr>
                              <th className="px-3 py-1.5 text-left">Subject</th>
                              <th className="px-3 py-1.5 text-left">Grade</th>
                              <th className="px-3 py-1.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {directForm.data.first_sitting_grades.map((row, index) => (
                              <tr key={index} className="border-b border-surface-100 last:border-0">
                                <td className="px-3 py-1">
                                  <select 
                                    value={row.subject} 
                                    onChange={(e) => handleDirectGradeChange1(index, 'subject', e.target.value)}
                                    className="rounded-lg border-surface-200 text-xs py-0.5 w-full max-w-xs"
                                  >
                                    {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                <td className="px-3 py-1">
                                  <select 
                                    value={row.grade} 
                                    onChange={(e) => handleDirectGradeChange1(index, 'grade', e.target.value)}
                                    className="rounded-lg border-surface-200 text-xs py-0.5"
                                  >
                                    {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                                </td>
                                <td className="px-3 py-1 text-right">
                                  <button type="button" onClick={() => removeDirectSubjectRow1(index)} className="text-xs text-danger-600 font-bold">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-2 bg-surface-50/50 border-t border-surface-200 text-left">
                          <button type="button" onClick={addDirectSubjectRow1} className="text-xs font-bold text-brand-600 hover:text-brand-700">+ Add Subject Row</button>
                        </div>
                      </div>
                    </div>

                    {/* Sitting 2 */}
                    <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Second Sitting (Optional)</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              if (directForm.data.second_sitting_grades.length > 0) {
                                directForm.setData(d => ({ ...d, second_sitting_grades: [], second_sitting_type: '', second_sitting_year: '', second_sitting_no: '' }))
                              } else {
                                directForm.setData(d => ({ ...d, second_sitting_grades: [{ subject: 'English Language', grade: 'C6' }], second_sitting_type: 'NECO', second_sitting_year: '2025', second_sitting_no: '' }))
                              }
                            }}
                            className="text-[9px] bg-white border border-surface-200 px-2 py-0.5 rounded font-bold text-surface-600"
                          >
                            {directForm.data.second_sitting_grades.length > 0 ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        {directForm.data.second_sitting_grades.length > 0 && (
                          <div className="flex items-center gap-2">
                            <select 
                              value={directForm.data.second_sitting_type} 
                              onChange={(e) => directForm.setData('second_sitting_type', e.target.value)}
                              className="rounded-lg border-surface-200 text-xs py-1"
                            >
                              <option value="NECO">NECO</option>
                              <option value="WAEC">WAEC</option>
                              <option value="NABTEB">NABTEB</option>
                              <option value="NBAIS">NBAIS</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="Year" 
                              value={directForm.data.second_sitting_year} 
                              onChange={(e) => directForm.setData('second_sitting_year', e.target.value)}
                              className="w-16 rounded-lg border-surface-200 text-xs py-1 text-center" 
                            />
                            <input 
                              type="text" 
                              placeholder="Exam No" 
                              value={directForm.data.second_sitting_no} 
                              onChange={(e) => directForm.setData('second_sitting_no', e.target.value)}
                              className="w-28 rounded-lg border-surface-200 text-xs py-1 text-center font-mono" 
                            />
                          </div>
                        )}
                      </div>

                      {directForm.data.second_sitting_grades.length > 0 && (
                        <div className="border border-surface-200 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-xs">
                            <thead className="bg-surface-100 border-b border-surface-200 text-surface-700 font-bold">
                              <tr>
                                <th className="px-3 py-1.5 text-left">Subject</th>
                                <th className="px-3 py-1.5 text-left">Grade</th>
                                <th className="px-3 py-1.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {directForm.data.second_sitting_grades.map((row, index) => (
                                <tr key={index} className="border-b border-surface-100 last:border-0">
                                  <td className="px-3 py-1">
                                    <select 
                                      value={row.subject} 
                                      onChange={(e) => handleDirectGradeChange2(index, 'subject', e.target.value)}
                                      className="rounded-lg border-surface-200 text-xs py-0.5 w-full max-w-xs"
                                    >
                                      {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-3 py-1">
                                    <select 
                                      value={row.grade} 
                                      onChange={(e) => handleDirectGradeChange2(index, 'grade', e.target.value)}
                                      className="rounded-lg border-surface-200 text-xs py-0.5"
                                    >
                                      {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-3 py-1 text-right">
                                    <button type="button" onClick={() => removeDirectSubjectRow2(index)} className="text-xs text-danger-600 font-bold">Remove</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-2 bg-surface-50/50 border-t border-surface-200 text-left">
                            <button type="button" onClick={addDirectSubjectRow2} className="text-xs font-bold text-brand-600 hover:text-brand-700">+ Add Subject Row</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>

              {/* Drawer Footer controls */}
              <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between bg-surface-50 flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  disabled={directStep === 1}
                  onClick={() => setDirectStep(prev => Math.max(prev - 1, 1))}
                >
                  Back
                </Button>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDirectModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  
                  {directStep < 4 ? (
                    <Button 
                      type="button" 
                      variant="primary" 
                      size="sm" 
                      onClick={() => setDirectStep(prev => Math.min(prev + 1, 4))}
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="sm" 
                      loading={directForm.processing}
                      onClick={handleDirectSubmit}
                    >
                      Complete Admission Registration
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
