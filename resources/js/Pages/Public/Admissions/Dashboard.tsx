import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  Heart, LogOut, CheckCircle, Clock, Calendar, 
  MapPin, Printer, ClipboardCheck, Phone, ShieldAlert, Sparkles, Award
} from 'lucide-react'

interface DashboardProps {
  tenant: any
  applicant: any
  academicSession?: any
  admissionForm?: any
}

export default function Dashboard({ tenant, applicant, academicSession, admissionForm }: DashboardProps) {
  const [printMode, setPrintMode] = useState(false)
  const [letterMode, setLetterMode] = useState(false)

  const handleLogout = () => {
    router.post(route('admissions.logout'))
  }

  // Get active color matching admission status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'bg-emerald-500 border-emerald-500 text-emerald-700'
      case 'rejected': return 'bg-danger-500 border-danger-500 text-danger-700'
      case 'under_review': return 'bg-amber-500 border-amber-500 text-amber-700'
      default: return 'bg-surface-400 border-surface-400 text-surface-500'
    }
  }

  return (
    <>
      <Head title="ACONS Applicant Clearance Tracking Portal" />

      {/* ── Formal Print Slip Modal ────────────────────────────────────── */}
      {printMode && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-4 flex items-start justify-center pt-10 print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-10 border border-surface-200 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 relative">
            
            {/* Print Action Bar */}
            <div className="flex justify-between items-center bg-surface-50 border border-surface-200 p-4 rounded-2xl print:hidden">
              <span className="text-xs font-bold text-surface-600">Official ACONS Application Slip Preview</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md"
                >
                  <Printer size={14} /> Send to Printer
                </button>
                <button 
                  onClick={() => setPrintMode(false)}
                  className="px-4 py-2 border border-surface-200 text-surface-600 rounded-xl text-xs font-bold hover:bg-surface-100"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Slip Paper Sheet */}
            <div className="space-y-8 text-left font-sans">
              
              {/* Slip Header Logo */}
              <div className="flex items-center justify-between border-b-4 border-red-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-surface-200">
                    <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-red-900 tracking-tight font-display leading-none">AMEENATU COLLEGE OF NURSING SCIENCES</h1>
                    <span className="text-xs font-bold text-red-800 tracking-widest uppercase block mt-1">ACONS Online Registry Portal</span>
                    <span className="text-[10px] text-surface-400 block mt-0.5">PMB 105, Jigawa State, Nigeria</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-surface-400 block">APPLICATION ID</span>
                  <span className="text-base font-black text-red-900 tracking-wide font-mono block">ACONS/2025/{applicant.id}</span>
                </div>
              </div>

              {/* Title slip banner */}
              <div className="bg-surface-50 border border-surface-200 py-3 text-center rounded-xl">
                <h2 className="text-sm font-black text-surface-800 tracking-widest uppercase">Official Admissions Clearance & Application Slip</h2>
              </div>

              {/* Two columns data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Column 1: Personal Profile */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-red-900 border-b border-surface-200 pb-1 uppercase tracking-wider">A. Personal Profile</h3>
                  <table className="min-w-full text-xs space-y-2">
                    <tbody>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400 w-1/3">Full Name:</td><td className="py-1.5 font-bold text-surface-800">{applicant.full_name}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">JAMB Reg No:</td><td className="py-1.5 font-bold text-red-900 font-mono">{applicant.jamb_number}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">JAMB Score:</td><td className="py-1.5 font-bold text-surface-800">{applicant.jamb_score}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">Sex / Gender:</td><td className="py-1.5 font-bold text-surface-800">{applicant.sex}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">Date of Birth:</td><td className="py-1.5 font-bold text-surface-800">{new Date(applicant.dob).toLocaleDateString()}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">Phone Number:</td><td className="py-1.5 font-bold text-surface-800">{applicant.phone_number}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">State of Origin:</td><td className="py-1.5 font-bold text-surface-800">{applicant.state_of_origin}</td></tr>
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">L.G.A:</td><td className="py-1.5 font-bold text-surface-800">{applicant.lga}</td></tr>
                      <tr><td className="py-1.5 font-semibold text-surface-400">Contact Address:</td><td className="py-1.5 font-semibold text-surface-700 leading-relaxed">{applicant.contact_address}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Column 2: O'Level Sittings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-red-900 border-b border-surface-200 pb-1 uppercase tracking-wider">B. O'Level Sittings</h3>
                  
                  {/* Sitting 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold bg-surface-50 p-1.5 border border-surface-200 rounded-lg">
                      <span className="text-surface-600">Exam: {applicant.first_sitting_type} ({applicant.first_sitting_year})</span>
                      <span className="text-red-900 font-mono">No: {applicant.first_sitting_no}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {applicant.first_sitting_grades?.map((row: any, i: number) => (
                        <div key={i} className="flex justify-between border-b border-surface-100 py-1">
                          <span className="text-surface-500 font-medium">{row.subject}</span>
                          <span className="font-bold text-surface-800">{row.grade}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sitting 2 */}
                  {applicant.second_sitting_type && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs font-bold bg-surface-50 p-1.5 border border-surface-200 rounded-lg">
                        <span className="text-surface-600">Exam: {applicant.second_sitting_type} ({applicant.second_sitting_year})</span>
                        <span className="text-red-900 font-mono">No: {applicant.second_sitting_no}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {applicant.second_sitting_grades?.map((row: any, i: number) => (
                          <div key={i} className="flex justify-between border-b border-surface-100 py-1">
                            <span className="text-surface-500 font-medium">{row.subject}</span>
                            <span className="font-bold text-surface-800">{row.grade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parents & Sponsors & Declaration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-surface-200 pt-4">
                <div className="space-y-1 text-xs">
                  <span className="font-black text-blue-700 block uppercase tracking-wider">C. Parent & Sponsor Contacts</span>
                  <p className="leading-relaxed text-surface-700">
                    Parent: <strong className="font-bold text-surface-800">{applicant.parent_name}</strong> ({applicant.parent_phone})<br />
                    Address: {applicant.parent_address}<br />
                    Sponsor Name & Addr: {applicant.sponsor_name_address}
                  </p>
                </div>

                <div className="space-y-1 text-xs bg-surface-50 p-4 border border-surface-200 rounded-2xl">
                  <span className="font-black text-blue-700 block uppercase tracking-wider">D. Payment Settle Clearance</span>
                  <p className="leading-relaxed text-surface-600">
                    Remita Fee Settle Status: <strong className="font-bold text-emerald-700">CLEARED / PAID</strong><br />
                    Total Paid Amount: <strong className="font-bold text-surface-800">₦14,700.00</strong><br />
                    Reference Clearance Code: <strong className="font-bold text-blue-700 font-mono">{applicant.payment_reference}</strong>
                  </p>
                </div>
              </div>

              {/* Stamp & Verification */}
              <div className="flex justify-between items-end border-t border-dashed border-surface-300 pt-10">
                <div className="text-xs space-y-1 text-surface-500">
                  <p>Declaration Signed Date: <strong className="font-bold text-surface-800">{new Date().toLocaleDateString()}</strong></p>
                  <p className="font-mono text-[9px]">Hash Clearance SHA256: {applicant.payment_reference}_VERIFIED</p>
                </div>
                <div className="text-center w-48 space-y-1">
                  <div className="border-b border-surface-300 h-10 w-full" />
                  <span className="text-[10px] font-bold text-surface-400 block uppercase">ACONS Registrar Signature</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── Dashboard Content ─────────────────────────────────────────── */}
      {!printMode && !letterMode && (
        <div className="min-h-screen bg-surface-50 pb-20">
          
          {/* Header bar */}
          <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-200 shadow-sm h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-blue-600 shadow-md">
                <Heart size={20} className="animate-pulse" />
              </div>
              <div>
                <span className="font-display font-black text-sm tracking-tight text-surface-900 block leading-none">ACONS PORTAL</span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-blue-600 block mt-0.5">Online Admissions</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-danger-600 hover:bg-danger-50 border border-danger-100 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </nav>

          {/* Main Dashboard view */}
          <div className="max-w-4xl mx-auto pt-24 px-4 space-y-8 text-left">
            
            {/* Celebratory offer banner if status is Admitted */}
            {applicant.admission_status === 'admitted' && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-blue-600 to-red-700 text-white rounded-3xl p-8 shadow-xl shadow-blue-500/10 space-y-4"
              >
                <div className="flex items-center gap-2"><Sparkles className="animate-spin text-red-200" size={24} /> <span className="text-xs font-black uppercase tracking-wider text-red-100">PROVISIONAL ADMISSION OFFERED</span></div>
                <h1 className="text-3xl font-display font-black leading-tight">Congratulations, {applicant.full_name.split(' ')[1] || applicant.full_name}!</h1>
                <p className="text-sm text-blue-50 leading-relaxed max-w-xl">
                  You have been successfully screened and cleared for admission into the <strong className="font-extrabold text-white">{applicant.admitted_program?.name || 'National Diploma in Nursing'}</strong> diploma program at Ameenatu College of Nursing Sciences!
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => setPrintMode(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors"
                  >
                    <Printer size={14} /> Download Application Slip
                  </button>
                  <button 
                    onClick={() => setLetterMode(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors border border-blue-500"
                  >
                    <Award size={14} /> Official Admission Letter
                  </button>
                </div>
              </motion.div>
            )}

            {/* Welcome banner personal stats */}
            <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Clearance Account active</span>
                <h2 className="text-2xl font-black text-surface-900 font-display">{applicant.full_name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500 font-semibold">
                  <span className="flex items-center gap-1 font-mono text-blue-700"><ClipboardCheck size={14} /> JAMB: {applicant.jamb_number}</span>
                  <span className="flex items-center gap-1"><Phone size={14} /> {applicant.phone_number}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> DOB: {new Date(applicant.dob).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap gap-2">
                <button 
                  onClick={() => setPrintMode(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors font-bold text-xs border border-blue-100"
                >
                  <Printer size={14} /> Print Application Slip
                </button>
                {applicant.admission_status === 'admitted' && (
                  <button 
                    onClick={() => setLetterMode(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors font-bold text-xs border border-emerald-100"
                  >
                    <Award size={14} /> Official Admission Letter
                  </button>
                )}
              </div>
            </div>

            {/* Admission Process Live Stepper Timeline */}
            <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-sm space-y-6">
              <div className="border-b border-surface-200 pb-2">
                <h3 className="text-lg font-bold text-surface-900">Admission Process Timeline</h3>
                <p className="text-xs text-surface-400">Real-time clearance state monitoring index.</p>
              </div>

              <div className="relative pl-6 space-y-8 border-l-2 border-surface-200 text-left">
                
                {/* Step 1: Submit */}
                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white ring-2 ring-emerald-500/20" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">Application Submitted <CheckCircle size={12} /></span>
                    <p className="text-xs text-surface-500 font-medium">All personal records, schools attended, and O'levels sittings details received.</p>
                  </div>
                </div>

                {/* Step 2: Pay */}
                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white ring-2 ring-emerald-500/20" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">Application Fee Settled <CheckCircle size={12} /></span>
                    <p className="text-xs text-surface-500 font-medium">₦14,700 processing fee paid successfully. Clearance Code: <strong className="font-bold text-surface-800">{applicant.payment_reference}</strong>.</p>
                  </div>
                </div>

                {/* Step 3: Academic review */}
                <div className="relative">
                  <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 border-white ring-2 ${
                    applicant.admission_status === 'admitted' 
                      ? 'bg-emerald-500 ring-emerald-500/20' 
                      : 'bg-amber-500 ring-amber-500/20 animate-pulse'
                  }`} />
                  <div className="space-y-1">
                    <span className={`text-xs font-bold ${
                      applicant.admission_status === 'admitted' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>Academic Review & Screening</span>
                    <p className="text-xs text-surface-500 font-medium">
                      {applicant.admission_status === 'admitted' 
                        ? 'Minimum of 5 credits in O\'Level subjects (English, Mathematics, Biology, Chemistry, Physics) cleared successfully.'
                        : 'Screener is verifying your O\'Level sittings and JAMB Score combination compliance.'
                      }
                    </p>
                  </div>
                </div>

                {/* Step 4: Examination & Interview */}
                <div className="relative">
                  <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 border-white ring-2 ${
                    applicant.admission_status === 'admitted' 
                      ? 'bg-emerald-500 ring-emerald-500/20' 
                      : 'bg-surface-300 ring-surface-200'
                  }`} />
                  <div className="space-y-1">
                    <span className={`text-xs font-bold ${
                      applicant.admission_status === 'admitted' ? 'text-emerald-600' : 'text-surface-500'
                    }`}>Entrance Exam & Campus Interview</span>
                    <p className="text-xs text-surface-500 font-medium">
                      {applicant.admission_status === 'admitted'
                        ? 'Pre-registration interview cleared! Venue: ACONS Advanced Simulation Campus. Bring all physical WAEC/NECO certificates.'
                        : 'Invites for the physical entrance evaluation interview will be scheduled upon successful academic review clearance.'
                      }
                    </p>
                  </div>
                </div>

                {/* Step 5: Offer */}
                <div className="relative">
                  <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 border-white ring-2 ${
                    applicant.admission_status === 'admitted' 
                      ? 'bg-emerald-500 ring-emerald-500/20 animate-bounce' 
                      : 'bg-surface-300 ring-surface-200'
                  }`} />
                  <div className="space-y-1">
                    <span className={`text-xs font-bold ${
                      applicant.admission_status === 'admitted' ? 'text-emerald-600' : 'text-surface-500'
                    }`}>Admission Decision</span>
                    <p className="text-xs text-surface-500 font-medium">
                      {applicant.admission_status === 'admitted'
                        ? 'Provisional Admission Offer clearance active! Congratulations!'
                        : 'Clearance decision pending.'
                      }
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── Official ACONS Admission Letter Preview Modal ──────────────── */}
      {letterMode && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-4 flex items-start justify-center pt-10 print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-10 border border-surface-200 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 relative">
            
            {/* Print Action Bar */}
            <div className="flex justify-between items-center bg-surface-50 border border-surface-200 p-4 rounded-2xl print:hidden">
              <span className="text-xs font-bold text-surface-600 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                ACONS Official Provisional Admission Letter Replicated Design
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md"
                >
                  <Printer size={14} /> Send to Printer
                </button>
                <button 
                  onClick={() => setLetterMode(false)}
                  className="px-4 py-2 border border-surface-200 text-surface-600 rounded-xl text-xs font-bold hover:bg-surface-100"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Letter Paper Sheet */}
            <div className="relative p-12 bg-[#faf7f0] text-surface-900 border border-[#e8dfc7] shadow-inner font-serif text-sm leading-relaxed text-left mx-auto max-w-[800px] rounded-2xl print:bg-white print:border-none print:shadow-none print:p-0 print:mx-0">
              
              {/* Decorative faint background watermark logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <img src="/assets/images/acons_logo.png" alt="Watermark" className="w-[450px] h-[450px] object-contain" />
              </div>

              <div className="relative z-10 space-y-6">
                
                {/* Header Section */}
                <div className="flex items-start justify-between border-b-2 border-[#8c7853] pb-4">
                  <div className="flex items-center gap-4">
                    <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-20 h-20 object-contain bg-white rounded-full p-1 border border-[#e8dfc7]" />
                    <div className="space-y-0.5">
                      <h1 className="text-3xl font-black tracking-tight text-blue-900 font-display leading-none">Ameenatu</h1>
                      <h2 className="text-xl font-bold tracking-tight text-[#6b5832] font-display">College of Nursing</h2>
                      <h3 className="text-base font-semibold tracking-wide text-surface-800 font-display">Sciences, Dutse</h3>
                    </div>
                  </div>
                  <div className="text-right max-w-[240px] text-[10px] text-[#8c7853] font-sans font-bold leading-normal uppercase italic">
                    <p className="text-blue-900 font-extrabold not-italic text-xs mb-1 tracking-wider">* Motto:</p>
                    <p>Leading in nursing education,</p>
                    <p>leading in health care Delivery</p>
                  </div>
                </div>

                {/* Date & Core Letter Metadata Block */}
                <div className="relative">
                  {/* Right-aligned Date */}
                  <div className="text-right font-sans font-bold text-surface-700 text-xs mb-2">
                    Date: 27/10/2025
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2.5 max-w-[480px] font-sans text-xs">
                    <div className="flex items-end">
                      <span className="font-semibold text-surface-600 shrink-0">Admission Number:</span>
                      <span className="border-b border-dashed border-[#8c7853] flex-1 ml-1 pl-2 font-mono font-bold text-blue-900">ACONS/2025/{applicant.id}</span>
                    </div>
                    <div className="flex items-end">
                      <span className="font-semibold text-surface-600 shrink-0">Name of Candidate:</span>
                      <span className="border-b border-dashed border-[#8c7853] flex-1 ml-1 pl-2 font-bold text-surface-900 uppercase">{applicant.full_name}</span>
                    </div>
                    <div className="flex items-end">
                      <span className="font-semibold text-surface-600 shrink-0">L.G.A:</span>
                      <span className="border-b border-dashed border-[#8c7853] flex-1 ml-1 pl-2 font-bold text-surface-950 uppercase">{applicant.lga || 'N/A'}</span>
                    </div>
                    <div className="flex items-end">
                      <span className="font-semibold text-surface-600 shrink-0">State:</span>
                      <span className="border-b border-dashed border-[#8c7853] flex-1 ml-1 pl-2 font-bold text-surface-950 uppercase">{applicant.state_of_origin || 'N/A'}</span>
                    </div>
                    <div className="flex items-end">
                      <span className="font-semibold text-surface-600 shrink-0">Phone Number:</span>
                      <span className="border-b border-dashed border-[#8c7853] flex-1 ml-1 pl-2 font-bold text-surface-900 font-mono">{applicant.phone_number}</span>
                    </div>
                  </div>
                </div>

                {/* Offer title subject block */}
                <div className="text-center py-2 space-y-1">
                  <h2 className="text-base font-black text-blue-900 uppercase tracking-tight underline decoration-2 decoration-[#8c7853] underline-offset-4">
                    Provisional Offer of Admission into {applicant.admitted_program?.name || 'ND/HND Nursing Program'}
                  </h2>
                  <p className="text-xs font-bold text-surface-800 font-sans tracking-wide">
                    (2025/2026 Academic Session)
                  </p>
                </div>

                {/* Letter Body */}
                <div className="space-y-4 text-xs font-serif leading-relaxed text-surface-800 text-justify">
                  <p>
                    Following your successful participation in the recent screening exercise, you have been offered provisional admission to a four-years <strong className="font-bold text-surface-900">{applicant.admitted_program?.name || 'ND/HND Nursing Program'}</strong> at Ameenatu College of Nursing Sciences (ACONS), Dutse.
                  </p>

                  <div className="space-y-3 pl-2">
                    <p className="font-bold text-surface-900 border-b border-[#e8dfc7] pb-0.5">Conditions of Admission:</p>
                    
                    <div className="space-y-2.5">
                      {/* Condition 1 */}
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-900 shrink-0">1.</span>
                        <div className="space-y-1.5">
                          <p className="font-semibold text-surface-900">Document Verification:</p>
                          <p>You are required to present both the <strong className="font-bold text-surface-950 uppercase">ORIGINAL and PHOTOCOPY</strong> of the following documents during registration:</p>
                          <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] font-sans pl-2 list-none">
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Primary School Leaving Certificate</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> SSCE Results (WAEC/NECO/NABTEB)</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Previous School Testimonial</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Birth Cert / Age Declaration</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Indigene Certificate</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Original Medical Fitness Cert</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Two (2) Passport Photographs</li>
                            <li className="flex items-center gap-2"><div className="w-3.5 h-3.5 border border-surface-400 rounded-sm bg-white shrink-0" /> Printed JAMB Slip</li>
                          </ul>
                        </div>
                      </div>

                      {/* Condition 2 */}
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-900 shrink-0">2.</span>
                        <p><strong className="font-semibold text-surface-900">Disqualification Clause:</strong> If it is found at any point that you lack any of the required qualifications, your admission will be revoked immediately.</p>
                      </div>

                      {/* Condition 3 */}
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-900 shrink-0">3.</span>
                        <p><strong className="font-semibold text-surface-900">Registration Period:</strong> Registration will take place from <strong className="font-bold">{admissionForm?.registration_start_date ? new Date(admissionForm.registration_start_date).toLocaleDateString() : (academicSession ? new Date(academicSession.start_date).toLocaleDateString() : '1st November, 2025')}</strong>. Failure to complete registration within this time frame will result in the cancellation of your admission.</p>
                      </div>

                      {/* Condition 4 */}
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-900 shrink-0">4.</span>
                        <p><strong className="font-semibold text-surface-900">Name Policy:</strong> Changes to your name will not be permitted throughout the training period.</p>
                      </div>

                      {/* Condition 5 */}
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-900 shrink-0">5.</span>
                        <p><strong className="font-semibold text-surface-900">Additional Requirements:</strong> A list of additional items required for registration is attached for your reference.</p>
                      </div>

                      {/* Condition 6 */}
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-900 shrink-0">6.</span>
                        <p><strong className="font-semibold text-surface-900">Commencement of Lectures:</strong> <strong className="font-bold">{academicSession ? new Date(new Date(academicSession.start_date).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString() : '14th November, 2025'}</strong>.</p>
                      </div>
                    </div>
                  </div>

                  <p className="pt-2 font-bold text-center text-surface-900 font-sans tracking-wide">
                    We look forward to welcoming you to the college. Congratulations!
                  </p>
                </div>

                {/* Signatory Stamp Section */}
                <div className="flex justify-center pt-4">
                  <div className="relative text-center w-64 flex flex-col items-center">
                    
                    <div className="relative z-10 pt-2">
                      <strong className="font-black text-surface-900 text-xs block font-sans">Abdullahi Adamu</strong>
                      <span className="text-[10px] text-surface-500 font-bold uppercase tracking-wider block mt-0.5 font-sans">(Provost)</span>
                    </div>
                  </div>
                </div>

                {/* Footer Address */}
                <div className="border-t border-[#e8dfc7] pt-4 text-center space-y-1 text-[9px] font-sans font-bold text-surface-500 uppercase tracking-wider leading-relaxed">
                  <p>Plot 36, Takur Site Road, Adjacent to Correctional Service Headquarters, Dutse, Jigawa State, Nigeria.</p>
                  <p className="text-[#8c7853] text-[8px] tracking-widest">
                    09081818180, 09099999965 &nbsp;|&nbsp; info@acons.edu.ng &nbsp;|&nbsp; aconsdutse@gmail.com
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
