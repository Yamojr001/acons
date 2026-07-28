import { Head, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, Clock, AlertTriangle, Download, ArrowRight } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button } from '@/Components/UI'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useState } from 'react'

interface StudentInvoice {
  id: number
  amount_due: number
  amount_paid: number
  status: 'pending' | 'partial' | 'paid'
  fee: {
    name: string
    fee_type: string
    academicSession?: { name: string }
    department?: { name: string }
  }
  created_at: string
}

interface FeesProps {
  invoices: StudentInvoice[]
  activeGateway: 'remita' | 'paystack' | 'monnify' | 'zainpay'
}

export default function FeesIndex({ invoices, activeGateway }: FeesProps) {
  const [processingId, setProcessingId] = useState<number | null>(null)

  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid')
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.amount_due - inv.amount_paid), 0)

  const handlePaymentInit = async (invoiceId: number) => {
    setProcessingId(invoiceId)
    try {
      // 1. Initialize payment backend
      const response = await fetch(`/student/payments/initialize/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      })
      const data = await response.json()

      // 2. Route to appropriate Gateway Simulation
      if (data.gateway === 'zainpay') {
        if (data.error || !data.redirect_url) {
          alert(data.error || 'Zainpay could not start this payment. Please try again.')
          setProcessingId(null)
          return
        }
        // Zainpay uses a hosted checkout page — send the browser there directly.
        window.location.href = data.redirect_url
        return
      } else if (data.gateway === 'remita') {
        alert(`REMITA TSA GATEWAY\nRRR Generated: ${data.rrr}\nAmount: NGN ${data.amount}\nReference: ${data.reference}\n\n(Simulating Successful Payment...)`)
      } else if (data.gateway === 'monnify') {
        // @ts-ignore
        window.MonnifySDK.initialize({
          amount: data.amount,
          currency: data.currency || "NGN",
          reference: data.reference,
          customerFullName: data.email,
          customerEmail: data.email,
          apiKey: data.apiKey,
          contractCode: data.contractCode,
          paymentDescription: "School Fees Payment",
          isTestMode: true,
          onComplete: function(response: any) {
            router.post(`/student/payments/verify/${data.reference}`, {}, {
              onSuccess: () => setProcessingId(null),
              onError: () => setProcessingId(null)
            })
          },
          onClose: function(data: any) {
            setProcessingId(null)
          }
        });
        return; // Don't proceed to verify for monnify until complete
      } else {
        alert(`PAYSTACK GATEWAY\nAmount: ${data.amount / 100}\nReference: ${data.reference}\n\n(Simulating Successful Payment...)`)
      }

      // 3. Verify Payment (For Mocks like Remita/Paystack)
      router.post(`/student/payments/verify/${data.reference}`, {}, {
        onSuccess: () => setProcessingId(null),
        onError: () => setProcessingId(null)
      })

    } catch (e) {
      alert('Error initializing payment gateway.')
      setProcessingId(null)
    }
  }

  return (
    <AppLayout title="My Fees & Payments">
      <Head title="Fees & Payments" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Bursary Dashboard</h1>
        <p className="text-surface-500">Manage your tuition, acceptance fees, and dues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary */}
        <div className="space-y-6">
          <Card className="bg-brand-900 text-white shadow-xl border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <CreditCard size={20} />
                <h2 className="font-semibold text-sm">Total Outstanding</h2>
              </div>
              <p className="text-4xl font-display font-bold mb-2">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-sm opacity-70">Across {pendingInvoices.length} active invoices</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
              <span className="opacity-70">Active Gateway:</span>
              <Badge className="bg-white/20 text-white border-0 uppercase">{activeGateway}</Badge>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning-500" />
              Important Notice
            </h3>
            <p className="text-sm text-surface-600 mb-3">
              All <strong>Tuition</strong> and <strong>Acceptance</strong> fees must be paid in full before you can access the Course Registration portal.
            </p>
            <p className="text-sm text-surface-600">
              Payments processed via {activeGateway === 'remita' ? 'Remita (TSA)' : activeGateway === 'monnify' ? 'Monnify' : activeGateway === 'zainpay' ? 'Zainpay' : 'Paystack'} reflect immediately.
            </p>
          </Card>
        </div>

        {/* Right Column: Invoices */}
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-bold text-surface-900">Your Invoices</h2>
            </div>
            
            <div className="divide-y divide-surface-100">
              {invoices.length > 0 ? invoices.map((invoice) => {
                const balance = invoice.amount_due - invoice.amount_paid
                const isPaid = invoice.status === 'paid'

                return (
                  <motion.div key={invoice.id} className="p-6 transition-colors hover:bg-surface-50">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-surface-900 text-lg">{invoice.fee.name}</h3>
                          <Badge variant={
                            invoice.status === 'paid' ? 'success' : 
                            invoice.status === 'partial' ? 'warning' : 'danger'
                          }>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-surface-500 flex items-center gap-1.5 mb-2">
                          <Clock size={14} /> Issued on {formatDate(invoice.created_at)}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="neutral">{invoice.fee.academicSession?.name || 'All Sessions'}</Badge>
                          <Badge variant="neutral" className="uppercase">{invoice.fee.fee_type}</Badge>
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-3 min-w-[140px]">
                        <div className="text-left sm:text-right w-full">
                          <p className="text-sm text-surface-500">Amount Due</p>
                          <p className="text-xl font-bold text-surface-900">{formatCurrency(invoice.amount_due)}</p>
                          {invoice.amount_paid > 0 && !isPaid && (
                            <p className="text-xs text-success-600 mt-1">Paid: {formatCurrency(invoice.amount_paid)}</p>
                          )}
                        </div>

                        {isPaid ? (
                          <Button variant="outline" size="sm" iconLeft={<Download size={14} />}>
                            Receipt
                          </Button>
                        ) : (
                          <Button 
                            variant="primary" 
                            className="w-full sm:w-auto"
                            iconRight={<ArrowRight size={16} />}
                            disabled={processingId === invoice.id}
                            onClick={() => handlePaymentInit(invoice.id)}
                          >
                            {processingId === invoice.id ? 'Processing...' : `Pay ${formatCurrency(balance)}`}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="py-12 text-center text-surface-400">
                  <CheckCircle size={32} className="mx-auto mb-3 text-success-400" />
                  <p className="font-medium text-surface-900">All Clear!</p>
                  <p className="text-sm">You have no outstanding invoices.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
