import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Badge } from '@/Components/UI'
import { Server, Database, Activity, CheckCircle2, XCircle } from 'lucide-react'

export default function SystemHealth({ checks }: any) {
  const allSystemsGo = checks.every((c: any) => c.status === true)

  return (
    <AppLayout title="System Diagnostics">
      <Head title="System Diagnostics" />
      
      <PageHeader 
        title="Live System Diagnostics" 
        subtitle="Real-time validation of core infrastructure and Laravel Horizon status."
      />

      <div className="max-w-4xl space-y-6">
        <Card className="bg-gradient-to-br from-surface-900 to-surface-800 text-white border-none shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${allSystemsGo ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'}`}>
                <Activity size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{allSystemsGo ? 'All Systems Operational' : 'System Degraded'}</h2>
                <p className="text-surface-300 mt-1">Live Ping: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            {allSystemsGo ? <CheckCircle2 size={48} className="text-success-400/20" /> : <XCircle size={48} className="text-danger-400/20" />}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((check: any, i: number) => (
            <Card key={i} className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-surface-100 text-surface-600 rounded-xl">
                    <Server size={20} />
                  </div>
                  <h3 className="font-semibold text-surface-900">{check.label}</h3>
                </div>
                {check.status ? (
                  <CheckCircle2 size={24} className="text-success-500" />
                ) : (
                  <XCircle size={24} className="text-danger-500" />
                )}
              </div>
              
              <div className="mt-auto">
                <Badge variant={check.status ? 'success' : 'danger'} className="w-auto">
                  {check.status ? 'Healthy' : 'Failing'}
                </Badge>
                <div className="text-xs font-mono text-surface-500 mt-3 truncate bg-surface-50 p-2 rounded-lg border border-surface-100" title={check.detail}>
                  {check.detail}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
