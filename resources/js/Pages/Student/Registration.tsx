import { Head, Link, router } from '@inertiajs/react'
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Building,
  Check,
  AlertCircle,
  BookOpen
} from 'lucide-react'
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
    fee_type?: string
    academicSession?: { name: string }
  }
  created_at: string
}

interface HostelFee {
  id: number
  name: string
  amount: number
  fee_type: string
}

interface HostelInvoice {
  id: number
  amount_due: number
  amount_paid: number
  status: 'pending' | 'partial' | 'paid'
}

interface RegistrationProps {
  invoice: RegistrationInvoice | null
  hostelFee?: HostelFee | null
  hostelInvoice?: HostelInvoice | null
  gatewayChargeCap?: number
  currentSession?: string
  currentSemesterName?: string
  activeGateway: 'remita' | 'paystack' | 'monnify' | 'zainpay'
}

export default function Registration({
  invoice,
  hostelFee,
  hostelInvoice,
  gatewayChargeCap = 2000,
  currentSession = '2026/2027',
  currentSemesterName = 'First Semester',
  activeGateway = 'zainpay',
}: RegistrationProps) {
  // Plan options: 100 (Full ₦540k) vs 70 (1st installment ₦378k)
  const [installmentPercent, setInstallmentPercent] = useState<100 | 70>(100)
  const [includeHostel, setIncludeHostel] = useState<boolean>(false)
  const [processing, setProcessing] = useState(false)

  const isTuitionPaid = invoice?.status === 'paid'
  const isTuitionPartial = invoice?.status === 'partial' || (invoice && invoice.amount_paid > 0 && !isTuitionPaid)
  const isHostelPaid = hostelInvoice?.status === 'paid'

  const fullTuitionAmount = invoice ? Number(invoice.amount_due) : 540000
  const paidTuitionAmount = invoice ? Number(invoice.amount_paid) : 0
  const outstandingTuition = Math.max(0, fullTuitionAmount - paidTuitionAmount)

  // Tuition amount for the current transaction
  const tuitionToPay = isTuitionPaid
    ? 0
    : isTuitionPartial
    ? outstandingTuition
    : installmentPercent === 70
    ? Math.round(fullTuitionAmount * 0.7)
    : fullTuitionAmount

  const hostelPrice = hostelFee?.amount ? Number(hostelFee.amount) : 105000
  const hostelToPay = includeHostel && !isHostelPaid ? hostelPrice : 0
  const gatewayCharge = gatewayChargeCap // ₦2,000 flat cap

  // Total payable in this checkout
  const totalPayable = tuitionToPay + hostelToPay + gatewayCharge

  const handlePaymentInit = async () => {
    if (!invoice) return
    setProcessing(true)

    try {
      const response = await fetch(`/student/payments/initialize/${invoice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          installment_percent: installmentPercent,
          include_hostel: includeHostel && !isHostelPaid,
        }),
      })

      const data = await response.json()

      if (data.gateway === 'zainpay') {
        if (data.error || !data.redirect_url) {
          alert(data.error || 'ZainPay could not initialize payment. Please try again or contact support.')
          setProcessing(false)
          return
        }
        window.location.href = data.redirect_url
        return
      } else if (data.gateway === 'monnify') {
        // @ts-ignore
        if (window.MonnifySDK) {
          // @ts-ignore
          window.MonnifySDK.initialize({
            amount: data.amount,
            currency: data.currency || 'NGN',
            reference: data.reference,
            customerFullName: data.email,
            customerEmail: data.email,
            apiKey: data.apiKey,
            contractCode: data.contractCode,
            paymentDescription: 'School Fees & Registration',
            isTestMode: true,
            onComplete: function () {
              router.post(`/student/payments/verify/${data.reference}`, {}, {
                onSuccess: () => setProcessing(false),
                onError: () => setProcessing(false),
              })
            },
            onClose: function () {
              setProcessing(false)
            },
          })
          return
        }
      } else if (data.gateway === 'remita') {
        alert(`REMITA TSA GATEWAY\nRRR: ${data.rrr}\nAmount: ₦${data.amount}\nReference: ${data.reference}`)
      } else {
        alert(`PAYSTACK GATEWAY\nAmount: ₦${data.amount / 100}\nReference: ${data.reference}`)
      }

      router.post(`/student/payments/verify/${data.reference}`, {}, {
        onSuccess: () => setProcessing(false),
        onError: () => setProcessing(false),
      })
    } catch (e) {
      alert('Network error while connecting to payment gateway. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <AppLayout title="Semester Registration">
      <Head title="Semester Registration & School Fees" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">Semester Registration</h1>
          <p className="text-sm text-surface-500 mt-1">
            {currentSession} Academic Session · {currentSemesterName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-white text-surface-600 px-3 py-1">
            Gateway: <span className="font-semibold uppercase ml-1 text-surface-800">{activeGateway}</span>
          </Badge>
          {isTuitionPaid ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Tuition Fully Paid
            </Badge>
          ) : isTuitionPartial ? (
            <Badge variant="warning" className="px-3 py-1 text-xs">
              70% Paid · Course Reg Unlocked
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3 py-1 text-xs">
              Tuition Pending
            </Badge>
          )}
        </div>
      </div>

      {!invoice ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-16">
            <EmptyState
              title="No Registration Fee Schedule Found"
              description="The Bursary has not published a tuition or registration fee for the current academic session. Please check back shortly or contact the Bursary Office."
              icon={<ClipboardList size={44} className="text-surface-300" />}
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Status Alert Banners */}
          {isTuitionPaid ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-sm text-emerald-900">Registration Complete for {currentSession}</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your school fees (100% full payment) have been confirmed. You are fully eligible for course registration and exams.
                  </p>
                </div>
              </div>
              <Link href="/student/course-registration">
                <Button variant="primary" size="sm" iconRight={<ArrowRight size={14} />}>
                  Course Registration
                </Button>
              </Link>
            </div>
          ) : isTuitionPartial ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-sm text-amber-900">First Installment (70%) Confirmed</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You have paid <strong>{formatCurrency(paidTuitionAmount)}</strong>. Your First Semester Course Registration is unlocked!
                    The remaining 30% balance of <strong>{formatCurrency(outstandingTuition)}</strong> is due before the Second Semester.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/student/course-registration">
                  <Button variant="outline" size="sm" iconLeft={<BookOpen size={14} />}>
                    Go to Courses
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Plan Selection and Hostel Option */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Plan Options (If not already paid) */}
              {!isTuitionPaid && !isTuitionPartial && (
                <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-surface-900">Select School Fees Payment Plan</h2>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Choose to pay full tuition or take advantage of the 70% first installment plan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: 100% Full Payment */}
                    <div
                      onClick={() => setInstallmentPercent(100)}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 ${
                        installmentPercent === 100
                          ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                          : 'border-surface-200 hover:border-surface-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                          Full Payment (100%)
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            installmentPercent === 100
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-surface-300 bg-white'
                          }`}
                        >
                          {installmentPercent === 100 && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <div className="text-2xl font-bold font-display text-surface-900 mb-1">
                        {formatCurrency(540000)}
                      </div>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Covers complete school fees and tuition for the entire 2026/2027 academic session.
                      </p>

                      <div className="mt-3 pt-3 border-t border-surface-100 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        Full session clearance & instant exam access
                      </div>
                    </div>

                    {/* Option 2: 70% 1st Installment */}
                    <div
                      onClick={() => setInstallmentPercent(70)}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 ${
                        installmentPercent === 70
                          ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                          : 'border-surface-200 hover:border-surface-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                          1st Installment (70%)
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            installmentPercent === 70
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-surface-300 bg-white'
                          }`}
                        >
                          {installmentPercent === 70 && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <div className="text-2xl font-bold font-display text-surface-900 mb-1">
                        {formatCurrency(378000)}
                      </div>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Unlocks <strong>First Semester Course Registration</strong> immediately. Balance of ₦162,000 due before Second Semester.
                      </p>

                      <div className="mt-3 pt-3 border-t border-surface-100 flex items-center gap-1.5 text-xs text-brand-700 font-medium">
                        <CheckCircle size={14} className="text-brand-600" />
                        Eligible for ND/HND course enrollment
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Outstanding Balance Notice (If 70% already paid) */}
              {isTuitionPartial && (
                <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-surface-900 mb-1">Tuition Balance Settle Plan</h2>
                  <p className="text-xs text-surface-500 mb-4">
                    Your 70% first installment has been credited. You may pay the remaining balance now or before 2nd semester.
                  </p>

                  <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-surface-500 font-medium">Remaining 30% Balance</p>
                      <p className="text-xl font-bold text-surface-900">{formatCurrency(outstandingTuition)}</p>
                    </div>
                    <Badge variant="warning">30% Outstanding</Badge>
                  </div>
                </div>
              )}

              {/* Optional Hostel Accommodation Option */}
              <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-700 flex-shrink-0 mt-0.5">
                      <Building size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-surface-900">Hostel Accommodation</h2>
                        {isHostelPaid ? (
                          <Badge variant="success" size="sm">
                            Paid & Allocated
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-surface-500 mt-1 max-w-md">
                        College student hostel accommodation for the 2026/2027 academic session. Leave unselected if staying off-campus.
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-surface-900">{formatCurrency(hostelPrice)}</p>
                    <p className="text-[11px] text-surface-400">per session</p>
                  </div>
                </div>

                {!isHostelPaid && (
                  <div className="mt-4 pt-4 border-t border-surface-100">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeHostel}
                        onChange={(e) => setIncludeHostel(e.target.checked)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm font-medium text-surface-800">
                        Include Hostel Accommodation (+{formatCurrency(hostelPrice)})
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Academic Policy Information */}
              <div className="bg-surface-50 rounded-xl border border-surface-200 p-4">
                <div className="flex items-start gap-2.5 text-xs text-surface-600 leading-relaxed">
                  <AlertCircle size={16} className="text-surface-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-surface-800 font-medium">Important Registration Guidelines:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-surface-600">
                      <li>Payment of at least <strong>70% (₦378,000)</strong> enables immediate course registration for the First Semester.</li>
                      <li>Hostel fee is only required if you intend to reside in the college hostel premises.</li>
                      <li>Payment gateway processing charge is strictly capped at <strong>₦2,000.00</strong>.</li>
                      <li>Official e-receipts are automatically generated and downloadable from your Bursary portal.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Live Invoice & Payment Breakdown Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden sticky top-20">
                <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60">
                  <h3 className="text-sm font-semibold text-surface-900">Payment Breakdown</h3>
                  <p className="text-xs text-surface-500">Summary of payable items</p>
                </div>

                <div className="p-5 space-y-3.5 text-sm">
                  {/* Line 1: School Fees */}
                  <div className="flex justify-between items-start text-surface-700">
                    <div>
                      <p className="font-medium text-surface-900">School Fees / Tuition</p>
                      <p className="text-xs text-surface-500">
                        {isTuitionPaid
                          ? '100% Paid'
                          : isTuitionPartial
                          ? 'Remaining 30% Balance'
                          : installmentPercent === 100
                          ? '100% Full Payment'
                          : '70% 1st Installment'}
                      </p>
                    </div>
                    <span className="font-medium text-surface-900">
                      {isTuitionPaid ? '₦0.00' : formatCurrency(tuitionToPay)}
                    </span>
                  </div>

                  {/* Line 2: Hostel Accommodation */}
                  <div className="flex justify-between items-start text-surface-700">
                    <div>
                      <p className="font-medium text-surface-900">Hostel Accommodation</p>
                      <p className="text-xs text-surface-500">
                        {isHostelPaid
                          ? 'Already Paid'
                          : includeHostel
                          ? 'Selected'
                          : 'Not Selected'}
                      </p>
                    </div>
                    <span className="font-medium text-surface-900">
                      {isHostelPaid || !includeHostel ? '₦0.00' : formatCurrency(hostelToPay)}
                    </span>
                  </div>

                  {/* Line 3: Gateway Processing Fee */}
                  {(!isTuitionPaid || includeHostel) && (
                    <div className="flex justify-between items-start text-surface-700">
                      <div>
                        <p className="font-medium text-surface-900">Gateway Processing Fee</p>
                        <p className="text-xs text-surface-500">Flat processing cap</p>
                      </div>
                      <span className="font-medium text-surface-900">{formatCurrency(gatewayCharge)}</span>
                    </div>
                  )}

                  {/* Total Line */}
                  <div className="pt-3 border-t border-surface-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-surface-500">Total Payable</p>
                      <p className="text-[11px] text-surface-400">All fees included</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-display text-surface-900">
                        {isTuitionPaid && !includeHostel ? '₦0.00' : formatCurrency(totalPayable)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {isTuitionPaid && !includeHostel ? (
                      <div className="space-y-2">
                        <Link href="/student/course-registration" className="block w-full">
                          <Button variant="primary" className="w-full" iconRight={<ArrowRight size={16} />}>
                            Proceed to Course Registration
                          </Button>
                        </Link>
                        <Link href="/student/fees" className="block w-full text-center">
                          <Button variant="ghost" size="sm" className="w-full">
                            View Bursary Receipts
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full py-3"
                        disabled={processing || (!tuitionToPay && !hostelToPay)}
                        onClick={handlePaymentInit}
                        iconRight={<ArrowRight size={16} />}
                      >
                        {processing
                          ? 'Connecting to Gateway...'
                          : `Pay ${formatCurrency(totalPayable)} via ${activeGateway.toUpperCase()}`}
                      </Button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-surface-100 text-center">
                    <p className="text-[11px] text-surface-400 flex items-center justify-center gap-1">
                      <ShieldCheck size={13} className="text-surface-400" />
                      Encrypted 256-bit checkout via {activeGateway.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
