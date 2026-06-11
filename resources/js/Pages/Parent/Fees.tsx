import { Head, useForm, router } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, EmptyState, Button, Avatar } from '@/Components/UI'
import { CreditCard, History, AlertCircle, FileText, Calendar, Users } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PageProps, Fee, Student, User } from '@/types'

interface Props extends PageProps {
  fees: {
    data: (Fee & { student: Student & { user: User } })[]
    current_page: number
    last_page: number
    total: number
  }
  summary: { total_owed: number; total_paid: number; total_overdue: number }
  available_gateways: string[]
}

export default function ParentFees({ fees, summary, available_gateways }: Props) {
  const { post, processing, setData, data } = useForm({
    gateway: available_gateways.length > 0 ? available_gateways[0] : ''
  })

  const initiatePayment = (e: React.MouseEvent, feeId: number) => {
    e.preventDefault()
    router.get(route('parent.fees.checkout', feeId))
  }

  return (
    <AppLayout title="Children's Fees">
      <Head title="Children's Fees" />

      <div className="mb-6">
        <h1 className="page-title">Fees & Payments</h1>
        <p className="text-sm text-surface-500 mt-1">
          Manage and pay institution fees for your children.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-surface-800 text-white border-none relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">{formatCurrency(summary.total_owed)}</h2>
            <p className="text-surface-300 font-medium text-sm mt-1">Total Outstanding</p>
          </div>
          <CreditCard size={100} className="absolute -right-4 -bottom-4 text-surface-700/50 -rotate-12" />
        </Card>
        
        <Card className="border-danger-200">
          <p className="text-surface-500 font-medium text-sm mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-danger-500" /> Amount Overdue
          </p>
          <h2 className="text-2xl font-bold text-danger-600">{formatCurrency(summary.total_overdue)}</h2>
        </Card>

        <Card>
          <p className="text-surface-500 font-medium text-sm mb-1 text-success-600">Total Paid</p>
          <h2 className="text-2xl font-bold text-success-600">{formatCurrency(summary.total_paid)}</h2>
        </Card>
      </div>

      {/* Payment Gateway selection removed from here */}

      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 font-bold text-surface-800 bg-surface-50 flex items-center gap-2">
          <Users size={18} className="text-surface-400" />
          Pending & Past Invoices
        </div>
        {fees.data.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {fees.data.map(fee => {
              const overdue = fee.status === 'overdue' || (fee.status === 'pending' && new Date(fee.due_date) < new Date())
              return (
                <div key={fee.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-surface-50/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={fee.student.user.name} src={fee.student.user.avatar} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">{fee.student.user.name}</p>
                        <h3 className="font-bold text-surface-900 leading-none">{fee.title}</h3>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <Badge variant={fee.status === 'paid' ? 'success' : overdue ? 'danger' : 'warning'} dot>
                        {overdue && fee.status !== 'paid' ? 'Overdue' : fee.status}
                      </Badge>
                      <div className="flex items-center gap-4 text-xs text-surface-500">
                         <span className="flex items-center gap-1">
                           <FileText size={14} /> Ref: {fee.id}
                         </span>
                         <span className="flex items-center gap-1">
                           <Calendar size={14} /> Due: {formatDate(fee.due_date, { dateStyle: 'medium' })}
                         </span>
                      </div>
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
              title="No Fees Found"
              description="There are no pending or history fees for your children at this time."
              icon={<History size={48} className="text-surface-300" />}
            />
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
