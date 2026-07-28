import { Head, router } from '@inertiajs/react'
import { CreditCard, CheckCircle, Clock, ArrowRight, ClipboardList } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useState } from 'react'

interface RegistrationInvoice {
  id: number
  amount_due: number
  amount_paid: number
  status: 'pending' | 'partial' | 'paid'
  fee: {
    name: string
    academicSession?: { name: string }
  }
  created_at: string
}

interface RegistrationProps {
  invoice: RegistrationInvoice | null
  currentSession?: string
  currentSemesterName?: string
  activeGateway: 'remita' | 'paystack' | 'monnify' | 'zainpay'
}

export default function Registration({ invoice, currentSession, currentSemesterName, activeGateway }: RegistrationProps) {
  const [processing, setProcessing] = useState(false)

  const handlePaymentInit = async () => {
    if (!invoice) return
    setProcessing(true)
    try {
      const response = await fetch(`/student/payments/initialize/${invoice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      })
      const data = await response.json()

      if (data.gateway === 'zainpay') {
        if (data.error || !data.redirect_url) {
          alert(data.error || 'Zainpay could not start this payment. Please try again.')
          setProcessing(false)
          return
        }
        window.location.href = data.redirect_url
        return
      } else if (data.gateway === 'monnify') {
        // @ts-ignore
        window.MonnifySDK.initialize({
          amount: data.amount,
          currency: data.currency || 'NGN',
          reference: data.reference,
          customerFullName: data.email,
          customerEmail: data.email,
          apiKey: data.apiKey,
          contractCode: data.contractCode,
          paymentDescription: 'Registration Fee Payment',
          isTestMode: true,
          onComplete: function () {
            router.post(`/student/payments/verify/${data.reference}`, {}, {
              onSuccess: () => setProcessing(false),
              onError: () => setProcessing(false)
            })
          },
          onClose: function () {
            setProcessing(false)
          }
        })
        return
      } else if (data.gateway === 'remita') {
        alert(`REMITA TSA GATEWAY\nRRR Generated: ${data.rrr}\nAmount: NGN ${data.amount}\nReference: ${data.reference}\n\n(Simulating Successful Payment...)`)
      } else {
        alert(`PAYSTACK GATEWAY\nAmount: ${data.amount / 100}\nReference: ${data.reference}\n\n(Simulating Successful Payment...)`)
      }

      router.post(`/student/payments/verify/${data.reference}`, {}, {
        onSuccess: () => setProcessing(false),
        onError: () => setProcessing(false)
      })
    } catch (e) {
      alert('Error initializing payment gateway.')
      setProcessing(false)
    }
  }

  const balance = invoice ? invoice.amount_due - invoice.amount_paid : 0
  const isPaid = invoice?.status === 'paid'

  return (
    <AppLayout title="Registration">
      <Head title="Registration" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Semester Registration</h1>
        <p className="text-surface-500">
          {currentSession && currentSemesterName
            ? `${currentSession} · ${currentSemesterName}`
            : 'Pay your registration fee to complete enrolment for the semester.'}
        </p>
      </div>

      {!invoice ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-16">
            <EmptyState
              title="No Registration Fee Due Yet"
              description="The Bursary has not published a registration fee for the current session/semester. Please check back later or contact the Bursary if you believe this is a mistake."
              icon={<ClipboardList size={48} className="text-surface-300" />}
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-brand-900 text-white shadow-xl border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <CreditCard size={20} />
                <h2 className="font-semibold text-sm">{isPaid ? 'Registration Complete' : 'Amount Due'}</h2>
              </div>
              <p className="text-4xl font-display font-bold mb-2">
                {formatCurrency(balance)}
              </p>
              {invoice.amount_paid > 0 && !isPaid && (
                <p className="text-sm opacity-70">Already paid: {formatCurrency(invoice.amount_paid)}</p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
              <span className="opacity-70">Active Gateway:</span>
              <Badge className="bg-white/20 text-white border-0 uppercase">{activeGateway}</Badge>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                <h2 className="font-bold text-surface-900">{invoice.fee.name}</h2>
                <Badge variant={isPaid ? 'success' : invoice.status === 'partial' ? 'warning' : 'danger'}>
                  {invoice.status}
                </Badge>
              </div>
              <div className="p-6">
                <p className="text-sm text-surface-500 flex items-center gap-1.5 mb-4">
                  <Clock size={14} /> Issued on {formatDate(invoice.created_at)}
                </p>

                {isPaid ? (
                  <div className="flex items-center gap-3 text-success-600 font-semibold">
                    <CheckCircle size={20} />
                    You are fully registered for this semester.
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto"
                    iconRight={<ArrowRight size={16} />}
                    disabled={processing}
                    onClick={handlePaymentInit}
                  >
                    {processing ? 'Processing...' : `Pay ${formatCurrency(balance)}`}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
