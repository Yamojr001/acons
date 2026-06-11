import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, StatCard, Badge, Avatar } from '@/Components/UI'
import { DataTable, PageHeader } from '@/Components/UI/Advanced'
import { Building2, Users, CreditCard, Activity, ArrowRight, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard({ stats, schools, expiring_soon }: any) {
  return (
    <AppLayout title="Platform Overview">
      <Head title="Super Admin Dashboard" />
      
      <PageHeader 
        title="Platform Overview" 
        subtitle="Manage and monitor all tenant institutions across EduSaaS."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Institutions" value={stats.total_schools} icon={<Building2 />} color="brand" delay={0.1} />
        <StatCard title="Active Institutions" value={stats.active_schools} icon={<Activity />} color="success" delay={0.2} />
        <StatCard title="Total Students" value={stats.total_students.toLocaleString()} icon={<Users />} color="warning" delay={0.3} />
        <StatCard title="Platform Revenue" value={`₦${stats.total_revenue.toLocaleString()}`} icon={<CreditCard />} color="brand" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-surface-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">Recently Registered Institutions</h2>
              <Link href="/superadmin/schools" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <DataTable 
              columns={[
                { key: 'name', label: 'Institution Name', render: (row: any) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} size="sm" />
                    <div>
                      <div className="font-medium text-surface-900">{row.name}</div>
                      <div className="text-xs text-surface-500">{row.subdomain}.localhost</div>
                    </div>
                  </div>
                )},
                { key: 'students_count', label: 'Students', render: (row: any) => row.students_count?.toLocaleString() || '0' },
                { key: 'revenue_this_month', label: 'Monthly Rev', render: (row: any) => `₦${row.revenue_this_month?.toLocaleString() || 0}` },
                { key: 'is_active', label: 'Status', render: (row: any) => (
                  <Badge variant={row.is_active ? 'success' : 'danger'}>{row.is_active ? 'Active' : 'Suspended'}</Badge>
                )}
              ]}
              data={schools.slice(0, 5)}
              rowKey="id"
              emptyTitle="No institutions found"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-danger-50 text-danger-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-semibold text-surface-900">Expiring Subscriptions</h2>
            </div>
            
            {expiring_soon?.length > 0 ? (
              <div className="space-y-3">
                {expiring_soon.map((school: any) => (
                  <div key={school.id} className="flex items-center justify-between p-3 rounded-xl border border-danger-100 bg-danger-50/50">
                    <div>
                      <p className="font-medium text-sm text-surface-900">{school.name}</p>
                      <p className="text-xs text-danger-600 font-medium mt-0.5">
                        Expires in {Math.ceil((new Date(school.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                    <Badge variant="danger" dot>Action Needed</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-success-50 text-success-500 flex items-center justify-center mx-auto mb-3">
                  <Activity size={24} />
                </div>
                <p className="text-sm font-medium text-surface-900">All Subscriptions Healthy</p>
                <p className="text-xs text-surface-500 mt-1 max-w-[200px] mx-auto">No institutions are facing expiration in the next 30 days.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
