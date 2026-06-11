import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, Avatar } from '@/Components/UI'
import { CreditCard, History, Search, Download, ExternalLink, Calendar, User, School } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Transaction {
  id: number
  tenant_id: number | null
  user_id: number
  payable_type: string
  payable_id: number
  type: string
  amount: string
  currency: string
  status: string
  payment_method: string
  reference: string
  created_at: string
  user: { name: string; email: string; avatar: string | null }
  tenant?: { name: string; domain: string }
}

interface Props extends PageProps {
  transactions: {
    data: Transaction[]
    current_page: number
    last_page: number
    total: number
    links: any[]
  }
}

export default function Transactions({ transactions }: Props) {
  return (
    <AppLayout title="Platform Transactions">
      <Head title="All Transactions" />

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Global Transactions</h1>
          <p className="text-sm text-surface-500 mt-1">
            Monitor and audit all financial activities across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={16} />}>Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
              <Card padding="none" className="overflow-hidden">
                <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                        <input 
                            type="text" 
                            placeholder="Search by reference, user or school..." 
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-100 bg-surface-50/30">
                                <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Transaction</th>
                                <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">User / School</th>
                                <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {transactions.data.map(tx => (
                                <tr key={tx.id} className="hover:bg-surface-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-surface-900 text-sm">{tx.reference}</span>
                                            <span className="text-[10px] text-surface-400 font-mono uppercase">{tx.payment_method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={tx.user.name} src={tx.user.avatar} size="xs" />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-surface-900">{tx.user.name}</span>
                                                <span className="text-xs text-surface-500 flex items-center gap-1">
                                                    <School size={10} /> {tx.tenant?.name || 'Platform'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                       <Badge variant="neutral" className="uppercase text-[10px]">{tx.type.replace('_', ' ')}</Badge>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-surface-900 text-sm">
                                        {formatCurrency(parseFloat(tx.amount), tx.currency)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant={tx.status === 'successful' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}>
                                            {tx.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-surface-500">
                                        {formatDate(tx.created_at, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {transactions.data.length === 0 && (
                    <div className="py-20 text-center">
                        <History size={48} className="mx-auto text-surface-200 mb-4" />
                        <p className="text-surface-500">No transactions recorded yet.</p>
                    </div>
                )}
              </Card>
          </div>

          <div className="space-y-6">
              <Card>
                  <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
                      <CreditCard size={18} className="text-brand-500" />
                      Recent Activity
                  </h3>
                  <div className="space-y-4">
                      {transactions.data.slice(0, 5).map(tx => (
                          <div key={tx.id} className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${tx.status === 'successful' ? 'bg-success-50 text-success-600' : 'bg-surface-50 text-surface-400'}`}>
                                  <CreditCard size={14} />
                              </div>
                              <div className="min-w-0">
                                  <p className="text-xs font-bold text-surface-900 truncate">{tx.user.name}</p>
                                  <p className="text-[10px] text-surface-500">{formatCurrency(parseFloat(tx.amount), tx.currency)} · {tx.status}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </Card>

              <Card className="bg-brand-600 text-white border-none">
                  <p className="text-brand-100 text-xs font-medium mb-1">Total Platform Revenue</p>
                  <h3 className="text-2xl font-black">{formatCurrency(transactions.data.reduce((s, t) => t.status === 'successful' ? s + parseFloat(t.amount) : s, 0))}</h3>
                  <div className="mt-4 pt-4 border-t border-brand-500/50 flex items-center justify-between text-xs">
                      <span className="text-brand-100 underline cursor-pointer">View analytics</span>
                      <ExternalLink size={12} className="text-brand-200" />
                  </div>
              </Card>
          </div>
      </div>
    </AppLayout>
  )
}
