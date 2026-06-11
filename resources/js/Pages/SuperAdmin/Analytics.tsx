import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader, DataTable } from '@/Components/UI/Advanced'
import { StatCard, Card, Avatar } from '@/Components/UI'
import { BarChart3, TrendingUp, DollarSign, Wallet } from 'lucide-react'

export default function Analytics({ schools, total_revenue, monthly_mrr }: any) {
  return (
    <AppLayout title="Platform Analytics">
      <Head title="Platform Analytics" />
      
      <PageHeader 
        title="Financial & Global Analytics" 
        subtitle="Global platform revenue and Monthly Recurring Revenue tracking."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Gross Platform Revenue" value={`₦${total_revenue.toLocaleString()}`} icon={<Wallet />} color="brand" delay={0.1} />
        <StatCard title="Projected MRR" value={`₦${monthly_mrr.toLocaleString()}`} icon={<TrendingUp />} color="success" delay={0.2} />
        <StatCard title="Avg MRR Per Tenant" value={`₦${schools.length > 0 ? Math.round(monthly_mrr / schools.length).toLocaleString() : 0}`} icon={<BarChart3 />} color="warning" delay={0.3} />
      </div>

      <div className="max-w-5xl">
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-surface-200">
            <h2 className="text-lg font-semibold text-surface-900">Highest Volume Tenants</h2>
            <p className="text-sm text-surface-500 mt-1">Schools ordered by scale and population density.</p>
          </div>
          <DataTable 
            columns={[
              { key: 'name', label: 'School Name', render: (row: any) => (
                <div className="flex items-center gap-3">
                  <Avatar name={row.name} size="md" />
                  <div>
                    <div className="font-medium text-surface-900">{row.name}</div>
                    <div className="text-xs text-surface-500">{row.subdomain}.localhost</div>
                  </div>
                </div>
              )},
              { key: 'students_count', label: 'Registered Students', render: (row: any) => row.students_count?.toLocaleString() || '0' },
              { key: 'created_at', label: 'Onboarded', render: (row: any) => new Date(row.created_at).toLocaleDateString() }
            ]}
            data={schools}
            rowKey="id"
            emptyTitle="No analytical data found"
          />
        </Card>
      </div>
    </AppLayout>
  )
}
