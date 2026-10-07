import React, { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { Printer, ArrowRight, CheckCircle2, Copy, Check, ShieldCheck, Download, ExternalLink } from 'lucide-react'

interface ReceiptProps {
  tenant: any
  applicant: any
  academicSession?: any
  fee_amount: number
  amount_in_words?: string
}

export default function Receipt({
  tenant,
  applicant,
  academicSession,
  fee_amount = 14700.0,
  amount_in_words = 'Fourteen Thousand Seven Hundred Naira Only',
}: ReceiptProps) {
  const [copied, setCopied] = useState(false)

  const paymentRef = applicant.payment_reference || `ACON_ADM_${applicant.id}_${Math.floor(Date.now() / 1000)}`
  const formattedAmount = Number(fee_amount || 14700).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Format payment date
  const rawDate = applicant.updated_at || applicant.created_at || new Date().toISOString()
  const dateObj = new Date(rawDate)
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const copyReference = () => {
    navigator.clipboard.writeText(paymentRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const sessionName = academicSession?.name || '2025/2026'

  return (
    <>
      <Head title={`Payment Receipt — ${paymentRef} — ACONS`} />

      {/* ── Screen Navigation & Actions (Hidden on Print) ───────────────── */}
      <div className="print:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden">
              <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight block leading-none">ACONS PORTAL</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block mt-0.5">
                Official e-Receipt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <Printer size={14} className="text-emerald-400" />
              <span>Print Receipt</span>
            </button>

            <Link
              href={route('admissions.dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <span>Go to Dashboard / Slip</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Receipt Canvas Container ────────────────────────────────── */}
      <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6 print:bg-white print:p-0 print:min-h-0">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden print:border-none print:shadow-none print:rounded-none">

          {/* Top Banner Notice (Screen Only) */}
          <div className="print:hidden bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Payment transaction confirmed successfully. Print or download this receipt for your records.</span>
            </div>
            <button
              onClick={handlePrint}
              className="underline font-bold text-emerald-800 hover:text-emerald-900 shrink-0 ml-2"
            >
              Print / Save PDF
            </button>
          </div>

          {/* ── Official Receipt Sheet ──────────────────────────────────── */}
          <div className="p-6 sm:p-10 space-y-6 text-slate-800 text-left font-sans print:p-6 print:space-y-5">

            {/* Institution Header */}
            <div className="border-b-2 border-slate-800 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                    <img src="/assets/images/acons_logo.png" alt="ACONS Crest" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase block">
                      Federal Republic of Nigeria
                    </span>
                    <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug font-serif">
                      AMEENATU COLLEGE OF NURSING SCIENCES
                    </h1>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      P.M.B. 105, Dutse, Jigawa State, Nigeria
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold tracking-wider uppercase rounded">
                      Official Electronic Payment Receipt (e-Receipt)
                    </span>
                  </div>
                </div>

                {/* Paid Seal Badge */}
                <div className="shrink-0 text-right">
                  <div className="inline-flex flex-col items-center border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-emerald-800">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700">Payment Status</span>
                    <span className="text-sm sm:text-base font-black tracking-wide flex items-center gap-1">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      PAID
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                    {formattedDate} {formattedTime}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Transaction Core Metadata Strip (Remita RRR-style Box) ─── */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Transaction / RRR Ref
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] break-all">
                    {paymentRef}
                  </span>
                  <button
                    onClick={copyReference}
                    title="Copy Reference"
                    className="print:hidden text-slate-400 hover:text-slate-600 shrink-0 p-0.5"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Payment Date & Time
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block font-mono">
                  {formattedDate}, {formattedTime}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Payment Channel
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  ZainPay Card Gateway
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Settlement Status
                </span>
                <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                  Completed & Verified
                </span>
              </div>
            </div>

            {/* ── Payer Information Section ──────────────────────────────── */}
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-3">
                Payer (Applicant) Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between sm:justify-start sm:gap-4 py-1 border-b border-slate-100">
                  <span className="w-32 text-slate-500 font-medium">Payer Full Name:</span>
                  <span className="font-bold text-slate-900 uppercase">{applicant.full_name}</span>
                </div>

                <div className="flex justify-between sm:justify-start sm:gap-4 py-1 border-b border-slate-100">
                  <span className="w-32 text-slate-500 font-medium">JAMB Reg. Number:</span>
                  <span className="font-mono font-bold text-slate-900">{applicant.jamb_number}</span>
                </div>

                <div className="flex justify-between sm:justify-start sm:gap-4 py-1 border-b border-slate-100">
                  <span className="w-32 text-slate-500 font-medium">Phone Number:</span>
                  <span className="font-semibold text-slate-900 font-mono">{applicant.phone_number || 'N/A'}</span>
                </div>

                <div className="flex justify-between sm:justify-start sm:gap-4 py-1 border-b border-slate-100">
                  <span className="w-32 text-slate-500 font-medium">Email Address:</span>
                  <span className="font-medium text-slate-900 break-all">{applicant.email || 'N/A'}</span>
                </div>

                <div className="flex justify-between sm:justify-start sm:gap-4 py-1 border-b border-slate-100">
                  <span className="w-32 text-slate-500 font-medium">Application ID:</span>
                  <span className="font-mono font-bold text-red-900">ACONS/2025/{applicant.id}</span>
                </div>

                <div className="flex justify-between sm:justify-start sm:gap-4 py-1 border-b border-slate-100">
                  <span className="w-32 text-slate-500 font-medium">State / LGA:</span>
                  <span className="font-medium text-slate-900">
                    {applicant.lga ? `${applicant.lga}, ` : ''}{applicant.state_of_origin || 'Nigeria'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Itemized Payment Schedule Table ────────────────────────── */}
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-3">
                Payment Breakdown & Fee Schedule
              </h2>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">S/N</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 w-32 hidden sm:table-cell">Revenue Code</th>
                      <th className="py-2.5 px-3 text-right w-32">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">1</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">
                          Nursing Admission Application & Screening Form Fee
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Academic Session: {sessionName} — Basic Nursing / Midwifery
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 hidden sm:table-cell">
                        ACONS-ADM-001
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formattedAmount}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right text-slate-500">
                        Subtotal:
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        ₦{formattedAmount}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right text-slate-500">
                        Gateway & Service Charges:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        ₦0.00
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-300 bg-slate-100 text-slate-900 font-black text-[13px]">
                      <td colSpan={3} className="py-2.5 px-3 text-right">
                        TOTAL AMOUNT PAID:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        ₦{formattedAmount}
                      </td>
                    </tr>
                    <tr className="text-slate-500 text-[11px]">
                      <td colSpan={3} className="py-1.5 px-3 text-right">
                        Balance Due:
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-700">
                        ₦0.00
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in words banner */}
              <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Amount in Words:
                </span>
                <span className="font-bold text-slate-900 italic font-serif">
                  {amount_in_words}
                </span>
              </div>
            </div>

            {/* ── Security, Barcode & Authenticity Elements ─────────────── */}
            <div className="border-t-2 border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">

              {/* Barcode representation */}
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <svg className="h-9 w-48 text-slate-800" viewBox="0 0 200 40" fill="currentColor">
                  {/* Generated code128 pattern */}
                  <rect x="0" y="0" width="3" height="35" />
                  <rect x="5" y="0" width="1" height="35" />
                  <rect x="8" y="0" width="4" height="35" />
                  <rect x="14" y="0" width="2" height="35" />
                  <rect x="18" y="0" width="1" height="35" />
                  <rect x="21" y="0" width="3" height="35" />
                  <rect x="26" y="0" width="2" height="35" />
                  <rect x="30" y="0" width="4" height="35" />
                  <rect x="36" y="0" width="1" height="35" />
                  <rect x="39" y="0" width="2" height="35" />
                  <rect x="43" y="0" width="3" height="35" />
                  <rect x="48" y="0" width="1" height="35" />
                  <rect x="51" y="0" width="4" height="35" />
                  <rect x="57" y="0" width="2" height="35" />
                  <rect x="61" y="0" width="1" height="35" />
                  <rect x="64" y="0" width="3" height="35" />
                  <rect x="69" y="0" width="4" height="35" />
                  <rect x="75" y="0" width="1" height="35" />
                  <rect x="78" y="0" width="3" height="35" />
                  <rect x="83" y="0" width="2" height="35" />
                  <rect x="87" y="0" width="4" height="35" />
                  <rect x="93" y="0" width="1" height="35" />
                  <rect x="96" y="0" width="3" height="35" />
                  <rect x="101" y="0" width="2" height="35" />
                  <rect x="105" y="0" width="1" height="35" />
                  <rect x="108" y="0" width="4" height="35" />
                  <rect x="114" y="0" width="2" height="35" />
                  <rect x="118" y="0" width="3" height="35" />
                  <rect x="123" y="0" width="1" height="35" />
                  <rect x="126" y="0" width="4" height="35" />
                  <rect x="132" y="0" width="2" height="35" />
                  <rect x="136" y="0" width="1" height="35" />
                  <rect x="139" y="0" width="3" height="35" />
                  <rect x="144" y="0" width="4" height="35" />
                  <rect x="150" y="0" width="2" height="35" />
                  <rect x="154" y="0" width="1" height="35" />
                  <rect x="157" y="0" width="3" height="35" />
                  <rect x="162" y="0" width="4" height="35" />
                  <rect x="168" y="0" width="1" height="35" />
                  <rect x="171" y="0" width="3" height="35" />
                  <rect x="176" y="0" width="2" height="35" />
                  <rect x="180" y="0" width="4" height="35" />
                  <rect x="186" y="0" width="2" height="35" />
                  <rect x="190" y="0" width="1" height="35" />
                  <rect x="193" y="0" width="4" height="35" />
                  <rect x="198" y="0" width="2" height="35" />
                </svg>
                <span className="font-mono text-[9px] text-slate-500 tracking-wider">
                  {paymentRef}
                </span>
              </div>

              {/* Disclaimer Note */}
              <div className="max-w-xs text-center sm:text-right text-[9px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700 block">SECURITY NOTICE:</span>
                This is an official computer-generated receipt issued by Ameenatu College of Nursing Sciences.
                Electronic value confirmed via ZainPay. No physical signature is required.
              </div>
            </div>

            {/* Bottom Actions Row (Screen Only) */}
            <div className="print:hidden border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Need to complete your screening evaluation?
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrint}
                  type="button"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-300"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>

                <Link
                  href={route('admissions.dashboard')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <span>Continue to Portal Slip</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
