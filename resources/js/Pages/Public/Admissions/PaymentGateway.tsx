import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Heart, CreditCard, Shield, Landmark, ArrowRight, CheckCircle2 } from 'lucide-react'

interface PaymentGatewayProps {
  tenant: any
  applicant: any
  fee_amount: number
  monnify?: {
    apiKey: string
    contractCode: string
  }
}

export default function PaymentGateway({ tenant, applicant, fee_amount, monnify }: PaymentGatewayProps) {
  const [processing, setProcessing] = useState(false)

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    
    if (monnify?.apiKey) {
      // @ts-ignore
      window.MonnifySDK.initialize({
        amount: fee_amount,
        currency: "NGN",
        reference: `ACON_ADM_${new Date().getTime()}`,
        customerFullName: applicant.full_name,
        customerEmail: applicant.email || `${applicant.jamb_number}@acons.edu.ng`,
        apiKey: monnify.apiKey,
        contractCode: monnify.contractCode,
        paymentDescription: "Admission Application Fee",
        isTestMode: true,
        onComplete: function(response: any) {
          router.post(route('admissions.pay.authorize', { applicant: applicant.id }), {}, {
            onFinish: () => setProcessing(false)
          })
        },
        onClose: function(data: any) {
          setProcessing(false)
        }
      });
    } else {
      // Fallback
      router.post(route('admissions.pay.authorize', { applicant: applicant.id }), {}, {
        onFinish: () => setProcessing(false)
      })
    }
  }

  return (
    <>
      <Head title="ACONS Portal Fee Gateway — Remita Settle" />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 shadow-sm h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-teal-600 shadow-md">
            <Heart size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="font-display font-black text-sm tracking-tight text-surface-900 block leading-none">ACONS PORTAL</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-teal-600 block mt-0.5">Online Admissions</span>
          </div>
        </div>
      </nav>

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <div className="min-h-screen bg-surface-50 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-surface-200 shadow-lg overflow-hidden">
          
          {/* Header Brand */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100 bg-teal-800/40 px-3 py-1 rounded-full">Official Monnify Payment</span>
            <h2 className="text-xl font-black mt-2 font-display">ACONS Admission Gateway</h2>
            <p className="text-xs text-teal-100 mt-1">Order Ref: ACONS/ADM/{applicant.id}</p>
          </div>

          <form onSubmit={handlePayment} className="p-8 space-y-6">
            
            {/* User Roster Card */}
            <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-surface-200 pb-2">
                <span className="font-semibold text-surface-400">Applicant:</span>
                <span className="font-bold text-surface-800">{applicant.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-surface-200 pb-2">
                <span className="font-semibold text-surface-400">JAMB Reg No:</span>
                <span className="font-bold text-surface-800 text-teal-700">{applicant.jamb_number}</span>
              </div>
              <div className="flex justify-between border-b border-surface-200 pb-2">
                <span className="font-semibold text-surface-400">Phone Number:</span>
                <span className="font-bold text-surface-800">{applicant.phone_number}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-surface-400">Description:</span>
                <span className="font-bold text-surface-800">Application Form & Processing Fee</span>
              </div>
            </div>

            {/* Structured Amount Card */}
            <div className="bg-teal-50/50 border-2 border-dashed border-teal-200 rounded-2xl p-5 text-center">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block">Total Amount Due</span>
              <span className="text-3xl font-display font-black text-teal-800 block mt-1">₦{fee_amount.toLocaleString()}.00</span>
              <span className="text-[10px] text-teal-600 font-semibold block mt-1">Fourteen Thousand Seven Hundred Naira Only</span>
            </div>

            {/* Payment Description Text */}
            <div className="space-y-4 text-center">
              <span className="text-xs font-bold text-surface-700 uppercase tracking-wider block">Official Monnify Payment Portal</span>
              <p className="text-sm text-surface-500">
                You will be redirected to the secure Monnify payment gateway to complete your fee payment via Card, Transfer, or USSD.
              </p>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 text-[10px] text-surface-400 font-semibold">
              <span className="flex items-center gap-1"><Shield size={12} className="text-teal-600" /> 256-bit SSL Secure</span>
              <span className="flex items-center gap-1"><Landmark size={12} className="text-teal-600" /> Monnify Authenticated</span>
            </div>

            {/* Settle Action Button */}
            <button 
              type="submit"
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md font-bold text-sm transition-all focus:ring-2 focus:ring-teal-500"
            >
              {processing ? (
                <span>Initializing Payment Gateway...</span>
              ) : (
                <>
                  <span>Pay ₦{fee_amount.toLocaleString()}.00 Now</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

        </div>
      </div>
    </>
  )
}
