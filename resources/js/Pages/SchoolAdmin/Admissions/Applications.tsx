import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, Avatar, EmptyState } from '@/Components/UI'
import { Search, Filter, Calendar, Mail, FileText, CheckCircle, XCircle, Clock, MoreHorizontal, User, X, Layout } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PaginatedData } from '@/types'

interface AdmissionApplication {
  id: number
  applicant_name: string
  applicant_email: string
  data: Record<string, any>
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
  created_at: string
  form: { title: string }
}

interface Props {
  applications: PaginatedData<AdmissionApplication>
}

export default function Applications({ applications }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null)

  const updateStatus = (id: number, status: string) => {
    router.post(route('admin.applications.status', id), { status }, {
        preserveScroll: true
    })
  }

  const statusColors = {
    pending: 'warning',
    under_review: 'brand',
    accepted: 'success',
    rejected: 'danger'
  }

  return (
    <AppLayout title="Admission Applications">
      <Head title="Admissions" />

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-black">Admissions Overview</h1>
          <p className="text-sm text-surface-500 mt-1">Review and manage student admission requests.</p>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input 
                    type="text" 
                    placeholder="Search applicants..." 
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-200 focus:outline-none focus:border-brand-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-surface-400" />
                <select 
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm border-surface-200 rounded-xl bg-white"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-surface-100 bg-surface-50/30">
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Applicant</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Applied For</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                    {applications.data.map(app => (
                        <tr key={app.id} className="hover:bg-surface-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500">
                                        <User size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-surface-900 text-sm">{app.applicant_name}</span>
                                        <span className="text-xs text-surface-500 flex items-center gap-1">
                                            <Mail size={12} /> {app.applicant_email}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-surface-700">
                                {app.form?.title || 'Unknown Form'}
                            </td>
                            <td className="px-6 py-4 text-xs text-surface-500">
                                {formatDate(app.created_at, { dateStyle: 'medium' })}
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={statusColors[app.status] as any}>{app.status.replace('_',' ')}</Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <select 
                                        className="text-[10px] py-1 pl-2 pr-6 rounded-lg border-surface-200 bg-white font-bold uppercase transition-all focus:ring-brand-500 focus:border-brand-500"
                                        value={app.status}
                                        onChange={e => updateStatus(app.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="under_review">Review</option>
                                        <option value="accepted">Accept</option>
                                        <option value="rejected">Reject</option>
                                    </select>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 px-3 text-xs font-bold" 
                                        onClick={() => setSelectedApp(app)}
                                        icon={<FileText size={14} />}
                                    >
                                        Details
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {applications.data.length === 0 && (
            <div className="py-20">
                <EmptyState
                    title="No Applications Yet"
                    description="When students apply through your landing page, they will appear here."
                    icon={<Clock size={48} className="text-surface-200" />}
                />
            </div>
        )}
      </Card>

      {/* Application Detail Modal */}
      {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                  <div className="p-6 border-b border-surface-100 flex items-center justify-between bg-surface-50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-surface-900 leading-none">{selectedApp.applicant_name}</h2>
                            <p className="text-sm text-surface-500 mt-1">{selectedApp.form?.title}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-surface-200 rounded-full transition-colors text-surface-400 hover:text-surface-600">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-6">
                          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                              <p className="text-[10px] uppercase tracking-widest font-black text-surface-400 mb-1">Email Address</p>
                              <p className="text-sm font-bold text-surface-900 break-all">{selectedApp.applicant_email}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                              <p className="text-[10px] uppercase tracking-widest font-black text-surface-400 mb-1">Applied Date</p>
                              <p className="text-sm font-bold text-surface-900">{formatDate(selectedApp.created_at, { dateStyle: 'long' })}</p>
                          </div>
                      </div>

                      {/* Custom Fields */}
                      <div>
                          <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Layout size={14} /> Application Details
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                              {Object.entries(selectedApp.data || {}).map(([label, value]) => (
                                  <div key={label} className="p-5 rounded-2xl border border-surface-200 bg-white shadow-sm hover:border-brand-200 transition-colors">
                                      <p className="text-sm font-black text-surface-500 mb-1.5">{label}</p>
                                      <p className="text-base font-bold text-surface-900">
                                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || '—')}
                                      </p>
                                  </div>
                              ))}
                              {(!selectedApp.data || Object.keys(selectedApp.data).length === 0) && (
                                  <p className="text-center py-6 text-surface-400 italic">No additional data provided.</p>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-surface-100 bg-surface-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-surface-400 uppercase tracking-widest">Status:</p>
                          <Badge variant={statusColors[selectedApp.status] as any}>{selectedApp.status.replace('_',' ')}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
                          <select 
                                className="text-xs py-2 pl-4 pr-10 rounded-xl border-surface-300 bg-white font-bold transition-all focus:ring-brand-500 focus:border-brand-500 shadow-sm"
                                value={selectedApp.status}
                                onChange={e => {
                                    updateStatus(selectedApp.id, e.target.value);
                                    setSelectedApp(prev => prev ? { ...prev, status: e.target.value as any } : null);
                                }}
                            >
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                      </div>
                  </div>
              </motion.div>
          </div>
      )}
    </AppLayout>
  )
}
