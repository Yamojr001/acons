import React, { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { Printer, ArrowLeft, Check, Copy, Download, ShieldCheck } from 'lucide-react'

interface StudentReceiptProps {
  institution: any
  invoice: any
  payment: any
  paymentRef: string
  paidAt: string
  paymentGateway: string
  student: {
    name: string
    matricNumber: string
    jambNumber: string
    level: string
    department: string
    program: string
    phone: string
    email: string
  }
  feeName: string
  feeType: string
  amountDue: number
  amountPaid: number
  amountInWords: string
  academicSessionName: string
  downloadUrl: string
  pdfStreamUrl: string
  verificationHash: string
}

export default function StudentReceipt({
  institution,
  invoice,
  payment,
  paymentRef,
  paidAt,
  paymentGateway,
  student,
  feeName,
  feeType,
  amountDue,
  amountPaid,
  amountInWords,
  academicSessionName,
  downloadUrl,
  pdfStreamUrl,
  verificationHash,
}: StudentReceiptProps) {
  const [copied, setCopied] = useState(false)

  const formattedAmountDue = Number(amountDue || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const formattedAmountPaid = Number(amountPaid || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const copyReference = () => {
    navigator.clipboard.writeText(paymentRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Head title={`Official Payment Receipt — ${paymentRef} — ACONS`} />

      {/* ── Screen Navigation & Actions (Hidden on Print) ───────────────── */}
      <div className="print:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block leading-none">ACONS STUDENT PORTAL</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block mt-0.5">
                Official Electronic Payment Receipt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/student/registration"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to Registration</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <Printer size={14} className="text-emerald-400" />
              <span>Print</span>
            </button>

            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Download size={14} className="text-white" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Receipt Sheet Container ──────────────────────────────────── */}
      <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6 print:p-0 print:bg-white">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">

          {/* Top Status Alert (Hidden on Print) */}
          <div className="print:hidden bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Fee payment confirmed and credited to the Bursary. You may preview, print, or download this receipt below.</span>
            </div>
            <a
              href={pdfStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-emerald-800 hover:text-emerald-950 shrink-0 ml-3"
            >
              Open PDF Preview &rarr;
            </a>
          </div>

          {/* ── Authentic Receipt Canvas ────────────────────────────────── */}
          <div className="p-6 sm:p-10 space-y-6 text-slate-800 font-sans print:p-4 print:space-y-4">

            {/* Header: College Info & Logo */}
            <div className="border-b-2 border-emerald-800 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img src="/assets/images/acons_logo.png" alt="ACONS Crest" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block">
                      Federal Republic of Nigeria
                    </span>
                    <h1 className="text-base sm:text-xl font-black text-emerald-900 tracking-tight leading-snug">
                      AMEENATU COLLEGE OF NURSING SCIENCES
                    </h1>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      Bursary Department — Financial Services Unit
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Takur Adua, P.M.B. 105, Dutse, Jigawa State, Nigeria
                    </p>
                  </div>
                </div>

                {/* Status Stamp */}
                <div className="shrink-0 text-right">
                  <div className="inline-flex flex-col items-center border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-emerald-800">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Payment Status</span>
                    <span className="text-sm font-black tracking-wide text-emerald-800">
                      PAID &amp; CONFIRMED
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1">OFFICIAL e-RECEIPT</span>
                </div>
              </div>
            </div>

            {/* Receipt Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-center">
              <div className="text-xs sm:text-sm font-black text-emerald-900 uppercase tracking-wide">
                Electronic Payment Receipt (e-Receipt)
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Academic Session: <strong>{academicSessionName}</strong> | Issued Under College Financial Regulations
              </div>
            </div>

            {/* ── Transaction Particulars ──────────────────────────────────── */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2.5">
                Transaction Particulars
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Receipt Reference</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-emerald-800 select-all text-xs">{paymentRef}</span>
                    <button
                      onClick={copyReference}
                      type="button"
                      className="print:hidden text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                      title="Copy Reference"
                    >
                      {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Date</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{paidAt}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Gateway</span>
                  <span className="font-semibold text-slate-800 uppercase block mt-0.5">{paymentGateway}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Settlement Status</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">SUCCESSFUL / SETTLED</span>
                </div>
              </div>
            </div>

            {/* ── Student & Academic Information ───────────────────────────── */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2.5">
                Student &amp; Academic Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Student Full Name:</span>
                  <span className="font-bold text-slate-900 uppercase">{student.name}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Matriculation / Reg No:</span>
                  <span className="font-bold text-emerald-800 font-mono">{student.matricNumber}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">JAMB Reg Number:</span>
                  <span className="font-semibold text-slate-800 font-mono">{student.jambNumber}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Current Level:</span>
                  <span className="font-semibold text-slate-800">{student.level}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="font-semibold text-slate-800">{student.department}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Programme of Study:</span>
                  <span className="font-semibold text-slate-800">{student.program}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <span className="font-semibold text-slate-800">{student.phone}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Portal Email:</span>
                  <span className="font-semibold text-slate-800">{student.email}</span>
                </div>
              </div>
            </div>

            {/* ── Fee Particulars & Billing Breakdown ───────────────────────── */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2.5">
                Fee Particulars &amp; Billing Breakdown
              </div>
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Description / Purpose of Payment</th>
                      <th className="py-2.5 px-3">Fee Category</th>
                      <th className="py-2.5 px-3 text-right">Amount Due (₦)</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="py-3 px-3 text-slate-500">1</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{feeName}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Session: {academicSessionName}</span>
                      </td>
                      <td className="py-3 px-3 uppercase font-semibold text-slate-600">{feeType}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{formattedAmountDue}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">{formattedAmountPaid}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-semibold">
                    <tr className="bg-emerald-50 text-emerald-950 font-black">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider">
                        Total Amount Cleared:
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-base text-emerald-900">
                        ₦{formattedAmountPaid}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in words */}
              <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Amount in Words:
                </span>
                <span className="font-bold text-emerald-900 italic">
                  {amountInWords}
                </span>
              </div>
            </div>

            {/* ── Security, Notice & Authenticity ─────────────────────────── */}
            <div className="border-t-2 border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">IMPORTANT NOTICE:</p>
                <p>1. This electronic receipt serves as official legal evidence of fee clearance with Ameenatu College of Nursing Sciences.</p>
                <p>2. Keep this receipt safe for course registration, physical clearance, semester examinations, and graduation audit.</p>
                <p>3. Tampering with or altering any details on this computer-generated document constitutes academic fraud.</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">BURSAR'S OFFICE</div>
                <div className="text-[10px] text-slate-500">Ameenatu College of Nursing Sciences</div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">AUTHENTICATED SYSTEM RECORD</div>
              </div>
            </div>

            {/* Document Hash & Timestamp */}
            <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400 font-mono">
              Generated electronically from the ACONS Student Portal on {paidAt}.<br />
              Verification Hash: {verificationHash}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
