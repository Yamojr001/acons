import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Eye, Clock, CheckCircle, Award, Calendar, X, RefreshCw 
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
import { cn, formatDate, getPhotoUrl } from '@/lib/utils'

interface Props {
  applications: {
    data: any[]
    links: Array<{ url: string | null; label: string; active: boolean }>
    total: number
    from?: number | null
    to?: number | null
    current_page?: number
    last_page?: number
    per_page?: number
  }
  filters: {
    search?: string
    year?: string
    per_page?: string
  }
  availableYears: string[]
}

export default function AdmittedStudents({ applications, filters, availableYears }: Props) {
  const [search, setSearch] = useState(filters.search || '')
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleSyncPaid = () => {
    if (confirm('This will scan all candidates who have paid acceptance fees and automatically provision their portal User & Student accounts (using their phone number as username and password). Proceed with sync?')) {
      router.post(
        route('admission_officer.admitted.sync_paid'),
        {},
        {
          preserveScroll: true,
          onStart: () => setSyncing(true),
          onFinish: () => setSyncing(false),
        }
      )
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const applySearch = (overridePerPage?: string) => {
    router.get(
      route('admission_officer.admitted'),
      { 
        search: search || undefined, 
        year: filters.year || undefined,
        per_page: overridePerPage ?? (filters.per_page || undefined)
      },
      { preserveState: true, replace: true }
    )
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.get(
      route('admission_officer.admitted'),
      { search: search || undefined, year: e.target.value || undefined, per_page: filters.per_page || undefined },
      { preserveState: true }
    )
  }

  const handlePerPageChange = (val: string) => {
    router.get(
      route('admission_officer.admitted'),
      { search: search || undefined, year: filters.year || undefined, per_page: val },
      { preserveState: true }
    )
  }

  return (
    <AppLayout title="Admitted Candidates Queue">
      <Head title="Admitted Roster" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Admitted Students</h1>
           <p className="text-sm text-surface-500 mt-1">Review the roster of all applicants currently offered provisional admission or fully cleared into the student register.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncPaid}
            disabled={syncing}
            className="flex items-center gap-2 border-surface-300 text-surface-700 hover:bg-surface-50 shadow-sm"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin text-brand-600' : 'text-surface-500'} />
            <span>{syncing ? 'Syncing...' : 'Sync Paid to Portal Users'}</span>
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search admitted applicants by name or email..." 
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              <Button variant="primary" size="sm" onClick={applySearch}>Search</Button>
           </div>
           <div className="w-full sm:w-auto">
              <select 
                className="w-full sm:w-auto pl-4 pr-10 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-surface-700"
                value={filters?.year || ''}
                onChange={handleYearChange}
              >
                <option value="">All Admission Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
           </div>
           <div className="w-full sm:w-auto">
              <select 
                className="w-full sm:w-auto pl-4 pr-10 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-surface-700"
                value={filters?.per_page || '15'}
                onChange={(e) => handlePerPageChange(e.target.value)}
              >
                <option value="15">15 per page</option>
                <option value="30">30 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="all">View All ({applications.total})</option>
              </select>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Applicant</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">JAMB Email</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Department</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Section</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {applications.data.map((app) => (
                <tr key={app.id} className="hover:bg-surface-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={app.applicant_name} src={getPhotoUrl(app.passport_photo || app.data?.passport_photo)} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-surface-900 leading-none">{app.applicant_name}</p>
                        <p className="text-[10px] text-surface-400 mt-1 uppercase tracking-wider font-semibold">ID: ADM-{app.id.toString().padStart(5, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {app.applicant_email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-surface-800">{app.admitted_department?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{app.admitted_section || 'N/A'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={app.status === 'cleared' ? 'success' : 'warning'} className="capitalize">
                      {app.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      iconLeft={<Eye size={14} />} 
                      onClick={() => { setSelectedApp(app); setViewModalOpen(true); }}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
              {applications.data.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No admitted or cleared students found matching this criteria.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Row Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-surface-100 bg-surface-50/30">
          <div className="flex items-center gap-3 text-sm text-surface-500">
            <span>
              {filters?.per_page === 'all' || applications.total <= applications.data.length ? (
                <>Showing all <strong className="text-surface-800 font-bold">{applications.total}</strong> admitted students</>
              ) : (
                <>Showing <strong className="text-surface-800 font-bold">{applications.from ?? 1}</strong> to <strong className="text-surface-800 font-bold">{applications.to ?? applications.data.length}</strong> of <strong className="text-surface-800 font-bold">{applications.total}</strong> admitted students</>
              )}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-surface-200 text-xs">
              <span className="text-surface-400 font-medium">Rows:</span>
              {(['15', '30', '50', 'all'] as const).map((size) => {
                const isActive = (filters?.per_page === size) || (!filters?.per_page && size === '15');
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handlePerPageChange(size)}
                    className={cn(
                      'px-2 py-0.5 rounded font-medium transition-colors text-xs',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200 shadow-2xs'
                        : 'text-surface-600 hover:bg-surface-100'
                    )}
                  >
                    {size === 'all' ? 'All' : size}
                  </button>
                );
              })}
            </div>
          </div>

          {applications.links && applications.links.length > 3 && (
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {applications.links.map((link, i) => (
                link.url ? (
                  <Link
                    key={i}
                    href={link.url}
                    preserveScroll
                    preserveState
                    className={cn(
                      'px-3 py-1 text-xs rounded-lg transition-colors font-medium',
                      link.active
                        ? 'bg-brand-600 text-white font-bold'
                        : 'hover:bg-surface-100 text-surface-600 border border-transparent hover:border-surface-200'
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ) : (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs text-surface-300 font-medium select-none"
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Details View Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedApp && (() => {
          const photoUrl = getPhotoUrl(selectedApp.passport_photo || selectedApp.data?.passport_photo);

          return (
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
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-surface-900 text-lg">Admitted Student Dossier</h3>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                        ADM-{selectedApp.id.toString().padStart(5, '0')}
                      </span>
                    </div>
                    <button onClick={() => setViewModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors" aria-label="Close modal">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Candidate Photo & Identity Header */}
                    <div className="p-4 rounded-xl bg-surface-50 border border-surface-100 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {photoUrl ? (
                        <div className="flex-shrink-0 text-center">
                          <img 
                            src={photoUrl} 
                            alt={selectedApp.applicant_name || 'Student Photograph'} 
                            className="w-24 h-28 sm:w-28 sm:h-32 rounded-lg object-cover border border-surface-200 bg-white shadow-xs"
                          />
                          <a 
                            href={photoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-1.5 inline-block text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            Full Photo View
                          </a>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-28 sm:w-28 sm:h-32 rounded-lg border border-dashed border-surface-200 bg-surface-100/60 text-center p-2">
                          <Avatar name={selectedApp.applicant_name} size="lg" />
                          <span className="text-[10px] text-surface-400 mt-2 font-medium">No Photo</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                          <h4 className="text-base sm:text-lg font-bold text-surface-900">
                            {selectedApp.applicant_name}
                          </h4>
                          <Badge variant={selectedApp.status === 'cleared' ? 'success' : 'warning'} className="capitalize">
                            {selectedApp.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-surface-500 mb-3">
                          {selectedApp.applicant_email}
                          {(selectedApp.data?.phone_number || selectedApp.phone_number) && (
                            <span> · {selectedApp.data?.phone_number || selectedApp.phone_number}</span>
                          )}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-surface-100">
                            <span className="block text-[10px] uppercase font-bold text-surface-400">Department / Program</span>
                            <span className="font-semibold text-surface-800 truncate block mt-0.5">
                              {selectedApp.admitted_program?.name || selectedApp.applied_program?.name || selectedApp.admitted_department?.name || 'ND/HND Nursing'}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-surface-100">
                            <span className="block text-[10px] uppercase font-bold text-surface-400">Stream / Section</span>
                            <span className="font-semibold text-surface-800 block mt-0.5">
                              {selectedApp.admitted_section || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100">
                        <p className="text-[10px] uppercase font-bold text-surface-400">Clearance Status</p>
                        <p className="text-sm font-bold mt-0.5 capitalize flex items-center gap-1">
                          <CheckCircle size={14} className={selectedApp.status === 'cleared' ? 'text-success-600' : 'text-warning-600'} />
                          {selectedApp.status}
                        </p>
                      </div>
                      <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-100">
                        <p className="text-[10px] uppercase font-bold text-surface-400">Clearance Schedule</p>
                        <p className="text-sm font-bold text-surface-800 mt-0.5">{selectedApp.clearance_schedule || 'Standard Department Hours'}</p>
                      </div>
                    </div>

                    {/* Form Submitted Fields */}
                    <div>
                      <h4 className="font-bold text-surface-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Award size={14} className="text-brand-500" />
                        Application Dossier Data
                      </h4>
                      <div className="bg-surface-50/50 border border-surface-100 rounded-xl divide-y divide-surface-100 overflow-hidden">
                        {selectedApp.data && Object.entries(selectedApp.data).map(([key, value]) => {
                          if (key === 'passport_photo' || key === 'photo') return null;
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
                    <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>Close Dossier</Button>
                  </div>
                </motion.div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>
    </AppLayout>
  )
}
