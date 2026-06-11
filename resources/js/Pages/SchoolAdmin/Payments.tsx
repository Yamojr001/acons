import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Badge } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Payment { id: number; amount: number; status: string; reference?: string; payment_method?: string; created_at: string; student?: { user: { name: string } }; fee?: { title: string } }
interface PaymentsProps extends PageProps {
  payments: { data: Payment[]; links: any[] }
  totals: { successful: number; pending: number; failed: number }
  filters: any
}

const fmt = (n: number) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
const statusVariant: Record<string, any> = { successful: 'success', pending: 'warning', failed: 'danger' }

export default function Payments({ payments, totals, filters }: PaymentsProps) {
  return (
    <AppLayout title="Payments">
      <Head title="Payments" />
      <PageHeader title="Payment Transactions" subtitle="Full ledger of all student fee payments" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Collected', value: fmt(totals.successful), color: 'text-success-600 bg-success-50' },
          { label: 'Pending', value: fmt(totals.pending), color: 'text-warning-600 bg-warning-50' },
          { label: 'Failed', value: `${totals.failed} txn`, color: 'text-danger-600 bg-danger-50' },
        ].map(s => (
          <Card key={s.label} className={`${s.color} border-0`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-50 border-b border-surface-200 text-xs text-surface-500 uppercase">
              <tr>
                {['Reference', 'Student', 'Fee', 'Amount', 'Method', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {payments.data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-surface-400">No payment records found.</td></tr>
              ) : (
                payments.data.map(p => (
                  <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-surface-500">{p.reference ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium">{p.student?.user?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-surface-500">{p.fee?.title ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-sm">{fmt(p.amount)}</td>
                    <td className="px-6 py-4 text-xs capitalize text-surface-500">{p.payment_method ?? '—'}</td>
                    <td className="px-6 py-4 text-xs text-surface-500">{p.created_at?.split('T')[0]}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[p.status] ?? 'default'} dot className="capitalize">{p.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  )
}
