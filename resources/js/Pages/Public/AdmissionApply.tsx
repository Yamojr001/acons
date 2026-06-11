import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { Button } from '@/Components/UI'
import toast from 'react-hot-toast'

export default function AdmissionApply({ tenant, form }: any) {
  const [applicantName, setApplicantName] = useState('')
  const [applicantEmail, setApplicantEmail] = useState('')
  const [data, setData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFieldChange = (label: string, value: any) => {
      setData(prev => ({ ...prev, [label]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)

      router.post(route('public.admission.submit', { tenant: tenant.subdomain, form: form.id }), {
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          data: data
      }, {
          onSuccess: () => setSubmitted(true),
          onFinish: () => setIsSubmitting(false)
      })
  }

  if (submitted) {
      return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-surface-100">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h1 className="text-2xl font-bold font-display text-surface-900 mb-2">Application Received</h1>
                <p className="text-surface-600">Thank you for applying to <span className="font-semibold">{tenant.name}</span>. We will review your application and contact you soon at {applicantEmail}.</p>
                <div className="mt-8">
                    <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">Return Home</Button>
                </div>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-surface-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Head title={`Apply to ${tenant.name}`} />
      
      <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
              <h2 className="text-surface-500 font-semibold tracking-wide uppercase text-sm mb-2">{tenant.name} Admissions</h2>
              <h1 className="text-4xl font-extrabold font-display text-surface-900">{form.title}</h1>
              {form.description && <p className="mt-4 text-lg text-surface-600 max-w-2xl mx-auto">{form.description}</p>}
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-3xl overflow-hidden border border-surface-100">
              <div className="p-8 sm:p-10 space-y-8">
                  {/* Standard Information Block */}
                  <div>
                      <h3 className="text-lg font-bold text-surface-900 border-b border-surface-200 pb-3 mb-5">Primary Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Full Name *</label>
                              <input 
                                required type="text" value={applicantName} onChange={e => setApplicantName(e.target.value)} 
                                className="w-full rounded-xl border-surface-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 transition-colors"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Email Address *</label>
                              <input 
                                required type="email" value={applicantEmail} onChange={e => setApplicantEmail(e.target.value)} 
                                className="w-full rounded-xl border-surface-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 transition-colors"
                              />
                          </div>
                      </div>
                  </div>

                  {/* Dynamic Requirements Block */}
                  {form.fields && form.fields.length > 0 && (
                      <div>
                          <h3 className="text-lg font-bold text-surface-900 border-b border-surface-200 pb-3 mb-5">Application Details</h3>
                          <div className="space-y-6">
                              {form.fields.map((field: any) => (
                                  <div key={field.id}>
                                      <label className="block text-sm font-semibold text-surface-700 mb-1.5">
                                          {field.label} {field.required && <span className="text-danger-500">*</span>}
                                      </label>
                                      
                                      {field.type === 'textarea' ? (
                                          <textarea 
                                            required={field.required}
                                            rows={3}
                                            onChange={e => handleFieldChange(field.label, e.target.value)}
                                            className="w-full rounded-xl border-surface-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                          />
                                      ) : field.type === 'select' ? (
                                          <select
                                            required={field.required}
                                            onChange={e => handleFieldChange(field.label, e.target.value)}
                                            className="w-full rounded-xl border-surface-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                          >
                                              <option value="">Select an option</option>
                                              {field.options?.split(',').map((opt: string) => (
                                                  <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                              ))}
                                          </select>
                                      ) : (
                                          <input 
                                            type={field.type}
                                            required={field.required}
                                            onChange={e => handleFieldChange(field.label, e.target.value)}
                                            className="w-full rounded-xl border-surface-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                          />
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="bg-surface-50 p-8 border-t border-surface-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-surface-500">By submitting, you agree to the terms and data policies of {tenant.name}.</p>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-10 py-3 shadow-lg hover:shadow-xl transition-all font-bold text-lg rounded-xl">
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
              </div>
          </form>
      </div>
    </div>
  )
}
