import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card } from '@/Components/UI'
import { Users, BookOpen, DollarSign, BarChart3 } from 'lucide-react'
import type { PageProps } from '@/types'

interface OverviewProps extends PageProps {
  stats: {
    total_students: number
    total_teachers: number
    total_classes: number
    fees_collected: number
  }
}

const fmt = (n: number) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`

export default function ReportsOverview({ stats }: OverviewProps) {
  const cards = [
    { label: 'Total Students', value: stats.total_students, icon: <Users size={22} />, color: 'bg-brand-50 text-brand-600' },
    { label: 'Total Teachers', value: stats.total_teachers, icon: <BookOpen size={22} />, color: 'bg-success-50 text-success-600' },
    { label: 'Total Classes', value: stats.total_classes, icon: <BarChart3 size={22} />, color: 'bg-warning-50 text-warning-600' },
    { label: 'Fees Collected', value: fmt(stats.fees_collected), icon: <DollarSign size={22} />, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <AppLayout title="Reports">
      <Head title="Reports — Overview" />
      <PageHeader
        title="Reports Overview"
        subtitle="Platform-wide analytics at a glance"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(c => (
          <Card key={c.label} className={`flex items-center gap-4 ${c.color} border-0`}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/70">
              {c.icon}
            </div>
            <div>
              <p className="text-xs font-medium opacity-70">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <h3 className="font-semibold text-surface-800 mb-4">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: 'Financial Report', href: '/admin/reports/financial' },
              { label: 'Academic Report', href: '/admin/reports/academic' },
              { label: 'Attendance Report', href: '/admin/reports/attendance' },
            ].map(l => (
              <a key={l.href} href={l.href}
                className="block px-4 py-2.5 rounded-xl hover:bg-brand-50 text-surface-700 hover:text-brand-600 text-sm font-medium transition-colors">
                {l.label} →
              </a>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-surface-800 mb-4">System Summary</h3>
          <p className="text-sm text-surface-500">Use the quick links to dive into specific category reports covering financials, academic performance and student attendance trends.</p>
        </Card>
      </div>
    </AppLayout>
  )
}
