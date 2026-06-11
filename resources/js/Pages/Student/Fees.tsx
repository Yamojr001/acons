import { Head, useForm, router } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, EmptyState, Button } from '@/Components/UI'
import { CreditCard, History, AlertCircle, FileText, Calendar } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PageProps, Fee } from '@/types'

interface Props extends PageProps {
  fees: {
    data: Fee[]
    current_page: number
    last_page: number
    total: number
  }
  summary: { total_owed: number; total_paid: number; total_overdue: number }
  available_gateways: string[]
}

export default function Fees({ fees, summary, available_gateways }: Props) {
  const { post, processing, setData, data } = useForm({
    gateway: available_gateways.length > 0 ? available_gateways[0] : ''
  })

  const initiatePayment = (e: React.MouseEvent, feeId: number) => {
    e.preventDefault()
    router.get(route('student.fees.checkout', feeId))
  }

  return (
    <AppLayout title="My Fees">
      <Head title="My Fees" />

      <div className="mb-6">
        <h1 className="page-title">Fee Management</h1>
        <p className="text-sm text-surface-500 mt-1">
          View your invoices, secure online payments, and payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-surface-800 text-white border-none relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">{formatCurrency(summary.total_owed)}</h2>
          </div>
          <CreditCard size={100} className="absolute -right-4 -bottom-4 text-surface-700/50 -rotate-12" />
        </Card>
        
        <Card className="bg-white border-danger-200">
          <p className="text-surface-500 font-medium text-sm mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-danger-500" /> Amount Overdue
          </p>
          <h2 className="text-2xl font-bold text-danger-600">{formatCurrency(summary.total_overdue)}</h2>
        </Card>

        <Card>
          <p className="text-surface-500 font-medium text-sm mb-1">Total Paid</p>
          <h2 className="text-2xl font-bold text-success-600">{formatCurrency(summary.total_paid)}</h2>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 font-medium text-surface-900 bg-surface-50">
          Fee Invoices
        </div>
        {fees.data.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {fees.data.map(fee => {
              const overdue = fee.status === 'overdue' || (fee.status === 'pending' && new Date(fee.due_date) < new Date())
              return (
                <div key={fee.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-surface-50/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-surface-900">{fee.title}</h3>
                      <Badge variant={fee.status === 'paid' ? 'success' : overdue ? 'danger' : 'warning'}>
                        {overdue && fee.status !== 'paid' ? 'Overdue' : fee.status}
                      </Badge>
                    </div>

                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500">
                       <span className="flex items-center gap-1">
                         <FileText size={14} /> Ref: {fee.id}
                       </span>
                       <span className="flex items-center gap-1">
                         <Calendar size={14} /> Due: {formatDate(fee.due_date, { dateStyle: 'medium' })}
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-auto">
                    <div className="text-xl font-bold text-surface-900">{formatCurrency(fee.amount)}</div>
                    {fee.status !== 'paid' && (
                      <Button 
                        type="button"
                        variant="primary" 
                        disabled={processing || available_gateways.length === 0}
                        onClick={(e) => initiatePayment(e, fee.id)}
                      >
                        {processing ? 'Processing...' : 'Pay Now'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-16">
            <EmptyState
              title="No Fees Available"
              description="You do not have any pending or past fees to display."
              icon={<History size={48} className="text-surface-300" />}
            />
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
