import { Head, useForm, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
import { CreditCard, ArrowLeft, ShieldCheck, Calendar, Info, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PageProps, Fee, Student, User } from '@/types'

interface Props extends PageProps {
  fee: Fee & { student: Student & { user: User } }
  available_gateways: string[]
}

export default function StudentCheckout({ fee, available_gateways, errors }: Props) {
  const { post, processing, setData, data } = useForm({
    gateway: available_gateways.length > 0 ? available_gateways[0] : ''
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.gateway) {
      alert('Please select a payment method.')
      return
    }
    post(route('student.fees.pay', fee.id))
  }

  return (
    <AppLayout title="Payment Checkout">
      <Head title="Checkout" />

      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href={route('student.fees')} className="p-2 rounded-full hover:bg-surface-100 transition-colors">
            <ArrowLeft size={20} className="text-surface-600" />
          </Link>
          <h1 className="page-title">Review & Pay</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Payment Summary */}
            <Card className="overflow-hidden" padding="none">
              <div className="p-6 border-b border-surface-100 bg-surface-50/50">
                <h3 className="font-bold text-surface-900 flex items-center gap-2">
                  <Info size={18} className="text-brand-500" />
                  Payment Details
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Invoice Title</span>
                  <span className="font-bold text-surface-900">{fee.title}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Invoice ID</span>
                  <span className="font-mono text-surface-600">#{fee.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Due Date</span>
                  <span className="text-surface-900">{formatDate(fee.due_date, { dateStyle: 'medium' })}</span>
                </div>
                <div className="pt-4 border-t border-surface-100 flex justify-between items-center">
                  <span className="text-lg font-medium text-surface-900">Total Amount</span>
                  <span className="text-2xl font-black text-brand-600">{formatCurrency(fee.amount)}</span>
                </div>
              </div>
            </Card>

            {/* Verification Details */}
            <Card padding="none" className="overflow-hidden">
              <div className="p-6 border-b border-surface-100 bg-surface-50/50">
                <h3 className="font-bold text-surface-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-success-500" />
                    Verify Your Information
                </h3>
              </div>
              <div className="p-6 flex items-center gap-4">
                <Avatar name={fee.student.user.name} src={fee.student.user.avatar} size="lg" />
                <div>
                  <p className="text-sm font-bold text-surface-900">{fee.student.user.name}</p>
                  <p className="text-xs text-surface-500">{fee.student.admission_number} · Student</p>
                  <p className="text-xs text-surface-400 mt-1">{fee.student.user.email}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Gateway Selection */}
            <Card>
              <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-brand-500" />
                Payment Method
              </h3>
              
              <form onSubmit={submit} className="space-y-4">
                {errors.payment && (
                  <div className="p-3 rounded-xl bg-danger-50 border border-danger-100 text-xs text-danger-600">
                    {errors.payment}
                  </div>
                )}
                <div className="space-y-2">
                  {available_gateways.map(g => (
                    <label key={g} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      data.gateway === g ? 'border-brand-500 bg-brand-50/50' : 'border-surface-100 hover:border-surface-200 bg-white'
                    }`}>
                      <input 
                        type="radio" 
                        name="gateway" 
                        value={g} 
                        checked={data.gateway === g}
                        onChange={e => setData('gateway', e.target.value)}
                        className="text-brand-500 focus:ring-brand-500"
                      />
                      <span className="capitalize font-medium text-surface-700">{g}</span>
                      {g === 'sandbox' && <Badge variant="warning" className="ml-auto">Dev Only</Badge>}
                    </label>
                  ))}
                </div>

                <Button 
                  variant="primary" 
                  className="w-full h-12 text-base shadow-lg shadow-brand-500/20" 
                  disabled={processing || available_gateways.length === 0}
                  loading={processing}
                >
                  Proceed to Payment
                </Button>

                <p className="text-[10px] text-center text-surface-400 flex items-center justify-center gap-1.5 px-2">
                  <ShieldCheck size={12} className="text-success-500" />
                  Your payment is secured with industry-standard encryption.
                </p>
              </form>
            </Card>

            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 border-dashed">
              <p className="text-xs text-surface-500 text-center leading-relaxed">
                By proceeding, you agree to our terms of service regarding online payments and institution fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
