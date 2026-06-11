import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Settings, Calendar, Award, ShieldAlert, Check } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button } from '@/Components/UI'

interface Props {
  form: {
    id: number
    title: string
    description: string
    admission_year: string | null
    academic_session_id: number | null
    nursing_limit: number
    midwifery_limit: number
    opening_date: string | null
    closing_date: string | null
    is_active: boolean
    default_clearance_schedule: string | null
    registration_start_date: string | null
  }
  sessions: Array<{
    id: number
    name: string
  }>
}

export default function OpenAdmission({ form, sessions }: Props) {
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    admission_year: form.admission_year || '',
    academic_session_id: form.academic_session_id || '',
    nursing_limit: form.nursing_limit,
    midwifery_limit: form.midwifery_limit,
    opening_date: form.opening_date ? form.opening_date.substring(0, 10) : '',
    closing_date: form.closing_date ? form.closing_date.substring(0, 10) : '',
    is_active: form.is_active,
    default_clearance_schedule: form.default_clearance_schedule || '',
    registration_start_date: form.registration_start_date ? form.registration_start_date.substring(0, 10) : ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('admission_officer.open.update', form.id))
  }

  return (
    <AppLayout title="Admission Window Settings">
      <Head title="Admission Window Settings" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Open Admission Settings</h1>
           <p className="text-sm text-surface-500 mt-1">Configure opening/closing dates, departmental student capacity limits, and active academic sessions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Card */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border border-surface-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Admission Batch Year (Single Year)</label>
                  <input 
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. 2026"
                    value={data.admission_year}
                    onChange={(e) => setData('admission_year', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                  {errors.admission_year && <p className="text-xs text-danger-500 mt-1">{errors.admission_year}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Academic Session</label>
                  <select 
                    required
                    value={data.academic_session_id}
                    onChange={(e) => setData('academic_session_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  >
                    <option value="">-- Select Session --</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                  {errors.academic_session_id && <p className="text-xs text-danger-500 mt-1">{errors.academic_session_id}</p>}
                </div>
              </div>

              {/* Department Limits */}
              <div className="border-t border-surface-100 pt-6">
                <h3 className="font-bold text-surface-900 text-sm mb-4 flex items-center gap-2">
                  <Award size={16} className="text-brand-500" />
                  Department Capacity Intake Limits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Nursing Student Limit</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      value={data.nursing_limit}
                      onChange={(e) => setData('nursing_limit', Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.nursing_limit && <p className="text-xs text-danger-500 mt-1">{errors.nursing_limit}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Midwifery Student Limit</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      value={data.midwifery_limit}
                      onChange={(e) => setData('midwifery_limit', Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.midwifery_limit && <p className="text-xs text-danger-500 mt-1">{errors.midwifery_limit}</p>}
                  </div>
                </div>
              </div>

              {/* Active Window Dates */}
              <div className="border-t border-surface-100 pt-6">
                <h3 className="font-bold text-surface-900 text-sm mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-brand-500" />
                  Admission Windows Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Opening Date</label>
                    <input 
                      type="date"
                      required
                      value={data.opening_date}
                      onChange={(e) => setData('opening_date', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.opening_date && <p className="text-xs text-danger-500 mt-1">{errors.opening_date}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Closing Date</label>
                    <input 
                      type="date"
                      required
                      value={data.closing_date}
                      onChange={(e) => setData('closing_date', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.closing_date && <p className="text-xs text-danger-500 mt-1">{errors.closing_date}</p>}
                  </div>
                </div>
              </div>

              {/* Registration Start Date */}
              <div className="border-t border-surface-100 pt-6">
                <h3 className="font-bold text-surface-900 text-sm mb-4">
                  Applicant Registration Details
                </h3>
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Registration Start Date</label>
                  <input 
                    type="date"
                    value={data.registration_start_date || ''}
                    onChange={(e) => setData('registration_start_date', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                  <p className="text-xs text-surface-400 mt-1">This sets the registration date in the printable Admission Letter for admitted candidates.</p>
                  {errors.registration_start_date && <p className="text-xs text-danger-500 mt-1">{errors.registration_start_date}</p>}
                </div>
              </div>

              {/* Default Scheduled Clearance Info */}
              <div className="border-t border-surface-100 pt-6">
                <h3 className="font-bold text-surface-900 text-sm mb-4">
                  Default Scheduled Clearance Info
                </h3>
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Clearance Schedule Text</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Mondays and Tuesdays between 10am and 2pm at the HOD's Office (starting May 25th)."
                    value={data.default_clearance_schedule}
                    onChange={(e) => setData('default_clearance_schedule', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-surface-400 mt-1">This text will be prefilled automatically whenever you offer admission to any student, preventing repetitive typing.</p>
                  {errors.default_clearance_schedule && <p className="text-xs text-danger-500 mt-1">{errors.default_clearance_schedule}</p>}
                </div>
              </div>

              {/* Active / Inactive Status Switch */}
              <div className="border-t border-surface-100 pt-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-surface-900 text-sm">Form Application Status</h3>
                  <p className="text-xs text-surface-500 mt-1">If disabled, applicants will not be able to submit applications.</p>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    id="is_active"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="w-5 h-5 rounded border-surface-300 text-brand-600 focus:ring-brand-500/20"
                  />
                  <label htmlFor="is_active" className="ml-2.5 text-sm font-semibold text-surface-700">Open for Submissions</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-surface-100">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="rounded-xl px-6"
                  loading={processing}
                >
                  {recentlySuccessful ? (
                    <span className="flex items-center gap-2"><Check size={16} /> Saved Settings!</span>
                  ) : "Save Admission Settings"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar Info Card */}
        <div>
          <Card className="bg-surface-900 border-0 text-white p-6 shadow-2xl space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Settings size={20} className="text-brand-400" />
              Settings Summary
            </h3>
            <div className="space-y-4 text-sm">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">Current Year</p>
                <p className="font-bold text-surface-100 mt-0.5">{form.admission_year || "Not Set"}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">Departmental Limits</p>
                <p className="font-bold text-surface-100 mt-0.5">Nursing: {form.nursing_limit} Intake</p>
                <p className="font-bold text-surface-100 mt-0.5">Midwifery: {form.midwifery_limit} Intake</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">Window Dates</p>
                <p className="font-bold text-surface-100 mt-0.5">Open: {form.opening_date || "N/A"}</p>
                <p className="font-bold text-surface-100 mt-0.5">Close: {form.closing_date || "N/A"}</p>
              </div>
            </div>

            <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 flex gap-3 text-xs text-brand-300">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <p>Capacity limits block clearance operations once maximum department allocations are reached for the current intake cycle.</p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
