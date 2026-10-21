import { Head, Link, router } from '@inertiajs/react'
import axios from 'axios'
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
  BookOpen,
  Lock,
  Sparkles,
  Info
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

interface FacilitationFee {
  id: number
  name: string
  amount: number
  fee_type: string
}

interface FacilitationInvoice {
  id: number
  amount_due: number
  amount_paid: number
  status: 'pending' | 'partial' | 'paid'
  updated_at?: string
}

interface RegistrationProps {
  invoice: RegistrationInvoice | null
  hostelFee?: HostelFee | null
  hostelInvoice?: HostelInvoice | null
  facilitationFee?: FacilitationFee | null
  facilitationInvoice?: FacilitationInvoice | null
  isFacilitationPaid?: boolean
  gatewayChargeCap?: number
  currentSession?: string
  currentSemesterName?: string
  activeGateway: 'remita' | 'paystack' | 'monnify' | 'zainpay'
}

export default function Registration({
  invoice,
  hostelFee,
  hostelInvoice,
  facilitationFee,
  facilitationInvoice,
  isFacilitationPaid = false,
  gatewayChargeCap = 0,
  currentSession = '2026/2027',
  currentSemesterName = 'First Semester',
  activeGateway = 'zainpay',
}: RegistrationProps) {
  // Plan options: 100 (Full ₦535k) vs 70 (1st installment ₦374.5k)
  const [installmentPercent, setInstallmentPercent] = useState<100 | 70>(100)
  const [includeHostel, setIncludeHostel] = useState<boolean>(false)
  const [processingTuition, setProcessingTuition] = useState(false)
  const [processingFacilitation, setProcessingFacilitation] = useState(false)

  const isTuitionPaid = invoice?.status === 'paid'
  const isTuitionPartial = invoice?.status === 'partial' || (invoice && invoice.amount_paid > 0 && !isTuitionPaid)
  const isHostelPaid = hostelInvoice?.status === 'paid'

  const fullTuitionAmount = invoice ? Number(invoice.amount_due) : 535000
  const paidTuitionAmount = invoice ? Number(invoice.amount_paid) : 0
  const outstandingTuition = Math.max(0, fullTuitionAmount - paidTuitionAmount)

  // Facilitation Fee amount (₦3,850)
  const facilitationAmount = facilitationFee?.amount ? Number(facilitationFee.amount) : 3850

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
  const gatewayCharge = gatewayChargeCap // 0 charge

  // Total payable in Stage 2 checkout
  const totalTuitionPayable = tuitionToPay + hostelToPay + gatewayCharge

  // Generic gateway dispatch helper
  const dispatchGatewayPayment = (data: any, onFinish: () => void) => {
    if (data.gateway === 'zainpay') {
      if (data.error || !data.redirect_url) {
        alert(data.error || 'ZainPay could not initialize payment. Please try again or contact support.')
        onFinish()
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
          paymentDescription: 'Academic Fee Payment',
          isTestMode: true,
          onComplete: function () {
            router.post(`/student/payments/verify/${data.reference}`, {}, {
              onSuccess: () => onFinish(),
              onError: () => onFinish(),
            })
          },
          onClose: function () {
            onFinish()
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
      onSuccess: () => onFinish(),
      onError: () => onFinish(),
    })
  }

  // Handle Stage 1 Facilitation Fee Payment (₦3,850.00)
  const handleFacilitationPayment = async () => {
    if (!facilitationInvoice) {
      alert('Academic facilitation fee schedule not found. Please refresh or contact support.')
      return
    }
    setProcessingFacilitation(true)
    try {
      const response = await axios.post(`/student/payments/initialize/${facilitationInvoice.id}`)
      dispatchGatewayPayment(response.data, () => setProcessingFacilitation(false))
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Facilitation fee initialization failed. Please try again.'
      alert(errorMsg)
      setProcessingFacilitation(false)
    }
  }

  // Handle Stage 2 School Fees / Tuition Payment
  const handleTuitionPayment = async () => {
    if (!invoice) return
    if (!isFacilitationPaid) {
      alert('You must pay the Academic Facilitation Fee (₦3,850.00) before paying your Semester Registration & School Fees.')
      return
    }
    setProcessingTuition(true)

    try {
      const response = await axios.post(`/student/payments/initialize/${invoice.id}`, {
        installment_percent: installmentPercent,
        include_hostel: includeHostel && !isHostelPaid,
      })

      dispatchGatewayPayment(response.data, () => setProcessingTuition(false))
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Payment initialization failed. Please try again.'
      alert(errorMsg)
      setProcessingTuition(false)
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
          {!isFacilitationPaid ? (
            <Badge variant="warning" className="px-3 py-1 text-xs">
              Stage 1 Required
            </Badge>
          ) : isTuitionPaid ? (
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

      {/* Two-Stage Progress Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Step 1: Academic Facilitation */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            isFacilitationPaid
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isFacilitationPaid
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-600 text-white'
                }`}
              >
                {isFacilitationPaid ? <Check size={14} strokeWidth={3} /> : '1'}
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-900">Stage 1: Academic Facilitation</p>
                <p className="text-[11px] text-surface-500">
                  {isFacilitationPaid ? 'Verified & Paid' : `Mandatory Prerequisite · ${formatCurrency(facilitationAmount)}`}
                </p>
              </div>
            </div>
            <Badge variant={isFacilitationPaid ? 'success' : 'warning'} size="sm">
              {isFacilitationPaid ? 'Completed' : 'Action Required'}
            </Badge>
          </div>
        </div>

        {/* Step 2: Tuition & Registration */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            !isFacilitationPaid
              ? 'border-surface-200 bg-surface-50/60 opacity-80'
              : isTuitionPaid
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  !isFacilitationPaid
                    ? 'bg-surface-200 text-surface-500'
                    : isTuitionPaid
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-600 text-white'
                }`}
              >
                {!isFacilitationPaid ? <Lock size={12} /> : isTuitionPaid ? <Check size={14} strokeWidth={3} /> : '2'}
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-900">Stage 2: School Fees & Registration</p>
                <p className="text-[11px] text-surface-500">
                  {!isFacilitationPaid
                    ? 'Locked until Stage 1 is paid'
                    : isTuitionPaid
                    ? '100% Fully Paid'
                    : isTuitionPartial
                    ? '70% Paid · 30% Balance'
                    : '100% (₦535k) or 70% (₦374.5k)'}
                </p>
              </div>
            </div>
            <Badge
              variant={!isFacilitationPaid ? 'neutral' : isTuitionPaid ? 'success' : isTuitionPartial ? 'warning' : 'outline'}
              size="sm"
            >
              {!isFacilitationPaid ? 'Locked' : isTuitionPaid ? 'Completed' : isTuitionPartial ? '70% Cleared' : 'Pending'}
            </Badge>
          </div>
        </div>
      </div>

      {!invoice && !facilitationFee ? (
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
          {/* Tuition Status Alert Banners */}
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
            {/* Left 2 Cols: Stages */}
            <div className="lg:col-span-2 space-y-6">

              {/* Stage 1: Facilitation Fee Card */}
              <div className={`bg-white rounded-xl border p-6 shadow-sm transition-all ${
                isFacilitationPaid ? 'border-surface-200' : 'border-brand-300 ring-1 ring-brand-100'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        Stage 1
                      </span>
                      <h2 className="text-base font-semibold text-surface-900">
                        Academic Facilitation Fee
                      </h2>
                      {isFacilitationPaid ? (
                        <Badge variant="success" size="sm">
                          Paid & Verified
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          Prerequisite Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-surface-500 mt-1 max-w-xl">
                      Mandatory academic facilitation fee for the {currentSession} session. This fee must be paid before school fees and course registration become accessible.
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold font-display text-surface-900">
                      {formatCurrency(facilitationAmount)}
                    </p>
                    <p className="text-[11px] text-surface-400">one-time payment</p>
                  </div>
                </div>

                {isFacilitationPaid ? (
                  <div className="mt-4 pt-4 border-t border-surface-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle size={15} className="text-emerald-600" />
                      Academic Facilitation Fee cleared. Stage 2 unlocked!
                    </span>
                    <Link href="/student/fees" className="text-brand-600 hover:text-brand-700 underline text-xs">
                      View Bursary Receipt
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 pt-4 border-t border-surface-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-surface-600">
                      Click below to proceed to encrypted checkout via <strong>{activeGateway.toUpperCase()}</strong>.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={processingFacilitation}
                      onClick={handleFacilitationPayment}
                      iconRight={<ArrowRight size={14} />}
                    >
                      {processingFacilitation ? 'Connecting to Gateway...' : `Pay Facilitation Fee (${formatCurrency(facilitationAmount)})`}
                    </Button>
                  </div>
                )}
              </div>

              {/* Stage 2: School Fees & Registration Card */}
              <div className={`relative transition-all duration-200 ${
                !isFacilitationPaid ? 'opacity-60 select-none' : ''
              }`}>
                {/* Lock Overlay Banner if Facilitation Unpaid */}
                {!isFacilitationPaid && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 flex items-center gap-3 text-amber-900">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                      <Lock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-900">Stage 2 is Currently Locked</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Please pay the <strong>Academic Facilitation Fee ({formatCurrency(facilitationAmount)})</strong> in Stage 1 above to unlock your School Fees payment plan.
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Plan Options (If not already paid) */}
                {!isTuitionPaid && !isTuitionPartial && (
                  <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm mb-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-surface-500 bg-surface-100 px-2 py-0.5 rounded">
                          Stage 2
                        </span>
                        <h2 className="text-base font-semibold text-surface-900">Select School Fees Payment Plan</h2>
                      </div>
                      <p className="text-xs text-surface-500">
                        Choose between 100% full session payment or the 70% first installment plan.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1: 100% Full Payment */}
                      <div
                        onClick={() => isFacilitationPaid && setInstallmentPercent(100)}
                        className={`relative rounded-xl border-2 p-4 transition-all duration-150 ${
                          !isFacilitationPaid
                            ? 'border-surface-200 bg-surface-50 cursor-not-allowed'
                            : installmentPercent === 100
                            ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600 cursor-pointer'
                            : 'border-surface-200 hover:border-surface-300 bg-white cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                            Full Payment (100%)
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              installmentPercent === 100 && isFacilitationPaid
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-surface-300 bg-white'
                            }`}
                          >
                            {installmentPercent === 100 && isFacilitationPaid && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="text-2xl font-bold font-display text-surface-900 mb-1">
                          {formatCurrency(fullTuitionAmount)}
                        </div>
                        <p className="text-xs text-surface-600 leading-relaxed">
                          Covers complete school fees and tuition for the entire {currentSession} academic session.
                        </p>

                        <div className="mt-3 pt-3 border-t border-surface-100 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          Full session clearance & instant exam access
                        </div>
                      </div>

                      {/* Option 2: 70% 1st Installment */}
                      <div
                        onClick={() => isFacilitationPaid && setInstallmentPercent(70)}
                        className={`relative rounded-xl border-2 p-4 transition-all duration-150 ${
                          !isFacilitationPaid
                            ? 'border-surface-200 bg-surface-50 cursor-not-allowed'
                            : installmentPercent === 70
                            ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600 cursor-pointer'
                            : 'border-surface-200 hover:border-surface-300 bg-white cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                            1st Installment (70%)
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              installmentPercent === 70 && isFacilitationPaid
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-surface-300 bg-white'
                            }`}
                          >
                            {installmentPercent === 70 && isFacilitationPaid && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="text-2xl font-bold font-display text-surface-900 mb-1">
                          {formatCurrency(Math.round(fullTuitionAmount * 0.7))}
                        </div>
                        <p className="text-xs text-surface-600 leading-relaxed">
                          Unlocks <strong>First Semester Course Registration</strong> immediately. Balance of {formatCurrency(fullTuitionAmount - Math.round(fullTuitionAmount * 0.7))} due before Second Semester.
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
                  <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm mb-6">
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
                          College student hostel accommodation for the {currentSession} session. Leave unselected if staying off-campus.
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
                      <label className={`flex items-center gap-3 select-none ${
                        isFacilitationPaid ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}>
                        <input
                          type="checkbox"
                          disabled={!isFacilitationPaid}
                          checked={includeHostel}
                          onChange={(e) => isFacilitationPaid && setIncludeHostel(e.target.checked)}
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
                <div className="bg-surface-50 rounded-xl border border-surface-200 p-4 mt-6">
                  <div className="flex items-start gap-2.5 text-xs text-surface-600 leading-relaxed">
                    <AlertCircle size={16} className="text-surface-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-surface-800 font-medium">Important Registration Guidelines:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-surface-600">
                        <li>Payment of the Academic Facilitation Fee (₦3,850.00) is mandatory before school fees can be cleared.</li>
                        <li>Payment of at least <strong>70% ({formatCurrency(Math.round(fullTuitionAmount * 0.7))})</strong> enables immediate course registration for the First Semester.</li>
                        <li>Hostel fee is only required if you intend to reside in the college hostel premises.</li>
                        <li>Official e-receipts are automatically generated and downloadable from your Bursary portal.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Live Invoice & Payment Breakdown Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden sticky top-20">
                <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60">
                  <h3 className="text-sm font-semibold text-surface-900">Payment Breakdown</h3>
                  <p className="text-xs text-surface-500">
                    {!isFacilitationPaid ? 'Stage 1 Checkout' : 'Stage 2 Checkout'}
                  </p>
                </div>

                <div className="p-5 space-y-3.5 text-sm">
                  {!isFacilitationPaid ? (
                    /* Stage 1 Breakdown */
                    <>
                      <div className="flex justify-between items-start text-surface-700">
                        <div>
                          <p className="font-medium text-surface-900">Academic Facilitation Fee</p>
                          <p className="text-xs text-surface-500">Stage 1 Prerequisite</p>
                        </div>
                        <span className="font-medium text-surface-900">
                          {formatCurrency(facilitationAmount)}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-surface-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs uppercase tracking-wider font-semibold text-surface-500">Total Payable</p>
                          <p className="text-[11px] text-surface-400">Stage 1 clearance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold font-display text-surface-900">
                            {formatCurrency(facilitationAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="primary"
                          className="w-full py-3"
                          disabled={processingFacilitation}
                          onClick={handleFacilitationPayment}
                          iconRight={<ArrowRight size={16} />}
                        >
                          {processingFacilitation
                            ? 'Connecting to Gateway...'
                            : `Pay ${formatCurrency(facilitationAmount)} via ${activeGateway.toUpperCase()}`}
                        </Button>
                      </div>

                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <Info size={13} className="inline mr-1 -mt-0.5" />
                        Once cleared, Stage 2 (School Fees & Tuition) will unlock automatically.
                      </p>
                    </>
                  ) : (
                    /* Stage 2 Breakdown */
                    <>
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
                      {gatewayCharge > 0 && (!isTuitionPaid || includeHostel) && (
                        <div className="flex justify-between items-start text-surface-700">
                          <div>
                            <p className="font-medium text-surface-900">Gateway Processing Fee</p>
                            <p className="text-xs text-surface-500">Processing fee</p>
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
                            {isTuitionPaid && !includeHostel ? '₦0.00' : formatCurrency(totalTuitionPayable)}
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
                            disabled={processingTuition || (!tuitionToPay && !hostelToPay)}
                            onClick={handleTuitionPayment}
                            iconRight={<ArrowRight size={16} />}
                          >
                            {processingTuition
                              ? 'Connecting to Gateway...'
                              : `Pay ${formatCurrency(totalTuitionPayable)} via ${activeGateway.toUpperCase()}`}
                          </Button>
                        )}
                      </div>
                    </>
                  )}

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
