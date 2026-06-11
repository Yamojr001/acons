import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Badge } from '@/Components/UI'
import { Check, ShieldCheck, Users } from 'lucide-react'

export default function Plans({ plans, planStats }: any) {
  return (
    <AppLayout title="Billing Strategies">
      <Head title="Billing Strategies" />
      
      <PageHeader 
        title="Active Billing Strategies" 
        subtitle="Review the custom dynamic billing architectures currently tracking tenant usage."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
        {plans.map((plan: any) => {
          const activeSchools = planStats[plan.id] || 0
          
          return (
            <Card key={plan.id} className="relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-surface-900 capitalize">{plan.name}</h3>
                <p className="text-sm text-surface-500 mt-2">{plan.description}</p>
              </div>

              <div className="mb-4 p-4 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-brand-800 uppercase tracking-wider">Active Tenants</p>
                  <p className="text-2xl font-bold text-brand-900 mt-1">{activeSchools}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-600">
                  <ShieldCheck size={24} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </AppLayout>
  )
}
