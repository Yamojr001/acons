import React, { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { CreditCard, Shield, Landmark, ArrowRight, AlertCircle } from 'lucide-react'

interface PaymentGatewayProps {
  tenant: any
  applicant: any
  fee_amount: number
  errors?: Record<string, string>
}

export default function PaymentGateway({ tenant, applicant, fee_amount, errors }: PaymentGatewayProps) {
  const [processing, setProcessing] = useState(false)
  const { props } = usePage<any>()
  const flash = props.flash ?? {}

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    router.post(
      route('admissions.pay.zainpay.init', { applicant: applicant.id }),
      {},
      { onFinish: () => setProcessing(false) }
    )
  }

  return (
    <>
      <Head title="ACONS Portal Fee Gateway — ZainPay" />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 shadow-sm h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-blue-100 shadow-sm">
            <img src="/assets/images/acons_logo.png" alt="ACONS" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <span className="font-display font-black text-sm tracking-tight text-surface-900 block leading-none">ACONS PORTAL</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-blue-600 block mt-0.5">Online Admissions</span>
          </div>
        </div>
      </nav>

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <div className="min-h-screen bg-surface-50 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-surface-200 shadow-lg overflow-hidden">

          {/* Header Brand */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-6 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src="/assets/images/acons_logo.png" alt="ACONS" className="w-8 h-8 object-contain rounded-lg bg-white/20 p-1" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100 bg-blue-900/40 px-3 py-1 rounded-full">Official ZainPay Gateway</span>
            </div>
            <h2 className="text-xl font-black mt-1 font-display">ACONS Admission Payment</h2>
            <p className="text-xs text-blue-200 mt-1">Ref: ACONS/ADM/{applicant.id}</p>
          </div>

          <form onSubmit={handlePayment} className="p-8 space-y-6">

            {/* Flash messages */}
            {flash.error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                {flash.error}
              </div>
            )}
            {errors?.payment && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                {errors.payment}
              </div>
            )}

            {/* Applicant details */}
            <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-surface-200 pb-2">
                <span className="font-semibold text-surface-400">Applicant:</span>
                <span className="font-bold text-surface-800">{applicant.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-surface-200 pb-2">
                <span className="font-semibold text-surface-400">JAMB Reg No:</span>
                <span className="font-bold text-blue-700 font-mono">{applicant.jamb_number}</span>
              </div>
              <div className="flex justify-between border-b border-surface-200 pb-2">
                <span className="font-semibold text-surface-400">Phone Number:</span>
                <span className="font-bold text-surface-800">{applicant.phone_number}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-surface-400">Description:</span>
                <span className="font-bold text-surface-800">Application Form &amp; Processing Fee</span>
              </div>
            </div>

            {/* Amount card */}
            <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-5 text-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Total Amount Due</span>
              <span className="text-3xl font-display font-black text-blue-900 block mt-1">₦{fee_amount.toLocaleString()}.00</span>
              <span className="text-[10px] text-blue-600 font-semibold block mt-1">Fourteen Thousand Seven Hundred Naira Only</span>
            </div>

            {/* Info */}
            <div className="space-y-3 text-center">
              <span className="text-xs font-bold text-surface-700 uppercase tracking-wider block">Powered by ZainPay — Nigeria</span>
              <p className="text-sm text-surface-500 leading-relaxed">
                You will be securely redirected to ZainPay to complete your payment via <strong>Card</strong>, <strong>Bank Transfer</strong>, or <strong>USSD</strong>.
              </p>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 text-[10px] text-surface-400 font-semibold">
              <span className="flex items-center gap-1"><Shield size={12} className="text-blue-600" /> 256-bit SSL Secure</span>
              <span className="flex items-center gap-1"><Landmark size={12} className="text-blue-600" /> ZainPay Verified</span>
            </div>

            {/* Pay button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl text-white bg-blue-700 hover:bg-blue-800 shadow-md shadow-blue-700/20 font-bold text-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting to ZainPay...
                </span>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Pay ₦{fee_amount.toLocaleString()}.00 via ZainPay</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-surface-400">
              After payment, you will be redirected back automatically. Do not close this tab.
            </p>

          </form>

        </div>
      </div>
    </>
  )
}
