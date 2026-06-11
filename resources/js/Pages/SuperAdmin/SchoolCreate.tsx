import { Head, useForm, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Input, Card, Button } from '@/Components/UI'
import { Building, Globe, Mail, User, ShieldCheck } from 'lucide-react'

export default function SchoolCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '', subdomain: '', admin_email: '', admin_name: '', 
    billing_type: 'per_school', billing_amount: 0, max_students: '', billing_payer: 'school'
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post('/superadmin/schools')
  }

  return (
    <AppLayout title="Onboard New Institution">
      <Head title="Create Tenant" />
      
      <PageHeader 
        title="Onboard New Institution" 
        subtitle="Provision a fresh database tenant and invite the root institution admin." 
      />

      <div className="max-w-3xl">
        <Card>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <Input label="Institution Name" value={data.name} onChange={e => setData('name', e.target.value)}
                  error={errors.name} placeholder="Springfield University" leftIcon={<Building size={16} />} required />
              </div>
              
              <div className="col-span-full">
                <Input label="Subdomain Identifier" value={data.subdomain} onChange={e => setData('subdomain', e.target.value)}
                  error={errors.subdomain} placeholder="springfield" leftIcon={<Globe size={16} />} required />
                <p className="mt-1.5 text-xs text-surface-500">This cannot be changed later. They will access the portal via <strong>subdomain.localhost</strong>.</p>
              </div>

              <div>
                <Input label="Root Admin Name" value={data.admin_name} onChange={e => setData('admin_name', e.target.value)}
                  error={errors.admin_name} placeholder="Principal Skinner" leftIcon={<User size={16} />} required />
              </div>

              <div>
                <Input type="email" label="Root Admin Email" value={data.admin_email} onChange={e => setData('admin_email', e.target.value)}
                  error={errors.admin_email} placeholder="admin@springfield.com" leftIcon={<Mail size={16} />} required />
              </div>

              <div className="col-span-full border-t border-surface-200 pt-6 mt-2">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">Billing Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { id: 'per_school', label: 'Per Institution (Flat Fee)' },
                    { id: 'per_group', label: 'Per Group / Tier' },
                    { id: 'per_student', label: 'Per Student (Headcount)' }
                  ].map((plan) => (
                    <label key={plan.id} className={`
                      relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all
                      ${data.billing_type === plan.id ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-surface-200 hover:bg-surface-50'}
                    `}>
                      <input type="radio" className="sr-only" checked={data.billing_type === plan.id} onChange={() => setData('billing_type', plan.id)} />
                      <div className="flex w-full items-center justify-between">
                        <div className="text-sm font-semibold capitalize text-surface-900">{plan.label}</div>
                        {data.billing_type === plan.id && <ShieldCheck className="text-brand-600" size={20} />}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.billing_type && <p className="mt-1 text-sm text-danger-600">{errors.billing_type}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input type="number" label="Billing Amount (₦)" value={data.billing_amount} onChange={e => setData('billing_amount', e.target.value)}
                    error={errors.billing_amount} required />
                  
                  {data.billing_type === 'per_group' && (
                    <Input type="number" label="Max Students Limit" value={data.max_students} onChange={e => setData('max_students', e.target.value)}
                      error={errors.max_students} required />
                  )}

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-surface-900 mb-2">Who pays this portal fee?</label>
                    <select className="mt-1 block w-full rounded-xl border-surface-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                      value={data.billing_payer} onChange={e => setData('billing_payer', e.target.value)}>
                      <option value="school">The Institution pays globally (Billed to root admin)</option>
                      <option value="student">The Student pays individually (Added to each student's fee as Portal Maintenance)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-surface-100">
              <Link href="/superadmin/schools">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" loading={processing}>Provision Tenant</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}
