import React, { useState } from 'react'
import { Head, router, useForm, usePage } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogOut, CheckCircle2, Clock, Calendar, 
  MapPin, Printer, Phone, Award, FileText,
  Lock, Unlock, ShieldCheck, Upload, Camera, Edit3, Plus,
  Trash2, AlertCircle, ChevronRight, User, BookOpen, AlertTriangle,
  RefreshCw, X, Download, Check, CreditCard
} from 'lucide-react'

interface ProgramOption {
  id: number
  name: string
  degree_type?: string
  duration_years?: number
}

interface DashboardProps {
  tenant: any
  applicant: any
  academicSession?: any
  admissionForm?: any
  programs?: ProgramOption[]
  examDetails?: {
    exam_date: string
    exam_venue: string
    seat_number: string
    batch: string
    cbt_duration: string
    subjects: Array<{ name: string; questions: number }>
    instructions: string[]
  }
}

export default function Dashboard({ 
  tenant, 
  applicant, 
  academicSession, 
  admissionForm,
  programs = [],
  examDetails
}: DashboardProps) {
  const pageProps = usePage().props as any
  const flash = pageProps.flash || {}
  const [flashDismissed, setFlashDismissed] = useState(false)

  // Tabs: overview | exam_card | passport | qualifications | documents
  const [activeTab, setActiveTab] = useState<'overview' | 'exam_card' | 'passport' | 'qualifications' | 'documents'>('overview')

  // Print Modals
  const [printSlipMode, setPrintSlipMode] = useState(false)
  const [letterMode, setLetterMode] = useState(false)
  const [examCardModal, setExamCardModal] = useState(false)
  const [acceptanceModal, setAcceptanceModal] = useState(false)
  const [payingAcceptance, setPayingAcceptance] = useState(false)

  const isAdmittedOrCleared = ['admitted', 'cleared'].includes(applicant.admission_status)
  const isAcceptancePaid = Boolean(applicant.acceptance_fee_paid)
  const canEditQualifications = !isAdmittedOrCleared
  const hasPassport = Boolean(applicant.passport_photo)

  const handlePayAcceptance = () => {
    setPayingAcceptance(true)
    router.post(route('admissions.acceptance_fee.pay', applicant.id), {}, {
      onFinish: () => setPayingAcceptance(false),
    })
  }

  const handleOpenLetter = () => {
    if (!isAcceptancePaid) {
      setAcceptanceModal(true)
    } else {
      setLetterMode(true)
    }
  }

  const handleLogout = () => {
    router.post(route('admissions.logout'))
  }

  // ── Passport Upload Form ───────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(applicant.passport_photo || null)
  const { 
    data: photoData, 
    setData: setPhotoData, 
    post: postPhoto, 
    processing: photoProcessing, 
    errors: photoErrors,
    reset: resetPhoto
  } = useForm<{ passport_photo: File | null }>({
    passport_photo: null,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoData('passport_photo', file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!photoData.passport_photo) return

    postPhoto(route('admissions.photo.upload'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        resetPhoto()
        setFlashDismissed(false)
      }
    })
  }

  // ── Qualifications Form ────────────────────────────────────────────────────
  const initialFirstGrades = (applicant.first_sitting_grades && applicant.first_sitting_grades.length > 0)
    ? applicant.first_sitting_grades
    : [
        { subject: 'English Language', grade: 'C6' },
        { subject: 'Mathematics', grade: 'C5' },
        { subject: 'Biology', grade: 'B3' },
        { subject: 'Chemistry', grade: 'C4' },
        { subject: 'Physics', grade: 'C6' },
      ]

  const initialSecondGrades = (applicant.second_sitting_grades && applicant.second_sitting_grades.length > 0)
    ? applicant.second_sitting_grades
    : []

  const [hasSecondSitting, setHasSecondSitting] = useState(Boolean(applicant.second_sitting_type))

  const {
    data: examFormData,
    setData: setExamFormData,
    post: postExamForm,
    processing: examProcessing,
    errors: examErrors
  } = useForm({
    first_sitting_type: applicant.first_sitting_type || 'NECO',
    first_sitting_year: applicant.first_sitting_year || '2025',
    first_sitting_no: applicant.first_sitting_no || '',
    first_sitting_grades: initialFirstGrades as Array<{ subject: string; grade: string }>,
    second_sitting_type: applicant.second_sitting_type || '',
    second_sitting_year: applicant.second_sitting_year || '',
    second_sitting_no: applicant.second_sitting_no || '',
    second_sitting_grades: initialSecondGrades as Array<{ subject: string; grade: string }>,
    applied_program_id: applicant.applied_program_id || (programs[0]?.id ?? null),
    phone_number: applicant.phone_number || '',
    email: applicant.email || '',
    contact_address: applicant.contact_address || '',
    next_of_kin_name: applicant.next_of_kin_name || '',
    next_of_kin_address: applicant.next_of_kin_address || '',
  })

  // Grade change helpers
  const handleGradeChange1 = (index: number, field: 'subject' | 'grade', val: string) => {
    const updated = [...examFormData.first_sitting_grades]
    updated[index][field] = val
    setExamFormData('first_sitting_grades', updated)
  }

  const addSubjectRow1 = () => {
    setExamFormData('first_sitting_grades', [
      ...examFormData.first_sitting_grades,
      { subject: 'Civic Education', grade: 'C6' }
    ])
  }

  const removeSubjectRow1 = (index: number) => {
    if (examFormData.first_sitting_grades.length <= 1) return
    const updated = examFormData.first_sitting_grades.filter((_, i) => i !== index)
    setExamFormData('first_sitting_grades', updated)
  }

  const handleGradeChange2 = (index: number, field: 'subject' | 'grade', val: string) => {
    const updated = [...examFormData.second_sitting_grades]
    updated[index][field] = val
    setExamFormData('second_sitting_grades', updated)
  }

  const addSubjectRow2 = () => {
    setExamFormData('second_sitting_grades', [
      ...examFormData.second_sitting_grades,
      { subject: 'Civic Education', grade: 'C6' }
    ])
  }

  const removeSubjectRow2 = (index: number) => {
    const updated = examFormData.second_sitting_grades.filter((_, i) => i !== index)
    setExamFormData('second_sitting_grades', updated)
  }

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    postExamForm(route('admissions.exam.update'), {
      preserveScroll: true,
      onSuccess: () => {
        setFlashDismissed(false)
      }
    })
  }

  // Fallback defaults for examination details
  const fallbackExamDate = applicant.exam_date 
    ? new Date(applicant.exam_date).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Wednesday, October 14, 2026 — 8:30 AM'

  const activeExam = {
    exam_date: examDetails?.exam_date || fallbackExamDate,
    exam_venue: examDetails?.exam_venue || (applicant.exam_venue || 'ACONS Advanced CBT Centre, Main Campus, Takur Site, Dutse, Jigawa State'),
    seat_number: examDetails?.seat_number || (applicant.seat_number || `ACONS/CBT/2025/${String(applicant.id).padStart(4, '0')}`),
    batch: examDetails?.batch || 'Batch A (Morning Session)',
    cbt_duration: examDetails?.cbt_duration || '90 Minutes (Computer-Based Test)',
    subjects: examDetails?.subjects || [
      { name: 'English Language', questions: 20 },
      { name: 'Biology & Human Anatomy', questions: 20 },
      { name: 'Chemistry', questions: 20 },
      { name: 'Physics', questions: 20 },
      { name: 'Current Affairs & General Nursing Aptitude', questions: 20 },
    ],
    instructions: examDetails?.instructions || [
      'Arrive at the CBT Examination Centre at least 45 minutes prior to the scheduled start time for biometric accreditation.',
      'Candidates must present a printed color copy of this Examination Photocard along with their original JAMB UTME slip.',
      'Electronic gadgets, mobile phones, smartwatches, and programmable calculators are strictly prohibited in the hall.',
      'Impersonation or examination malpractice will lead to instant disqualification and referral to law enforcement.',
      'Ensure your verified passport photograph is clearly visible on this card. Photocards without photos will not be admitted.'
    ]
  }

  // Program display name
  const appliedProgramName = applicant.applied_program?.name 
    || programs.find((p) => p.id === applicant.applied_program_id)?.name
    || applicant.applied_program_name 
    || 'National Diploma in Nursing (ND/HND)'

  // Admission status config
  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'admitted':
      case 'cleared':
        return {
          label: 'Provisional Admission Offered',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-600',
          description: 'You have been recommended and cleared for provisional admission. Download your Official Admission Letter and proceed with physical verification.'
        }
      case 'rejected':
        return {
          label: 'Admission Not Granted',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-600',
          description: 'Your application did not meet the screening cutoff for this academic session.'
        }
      case 'under_review':
        return {
          label: 'Academic Screening in Progress',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-600 animate-pulse',
          description: 'Your O\'Level credentials and JAMB score combination are currently being screened by the Admissions Board.'
        }
      default:
        return {
          label: 'Application Under Initial Review',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
          dotClass: 'bg-sky-600',
          description: 'Application fee settled. Please upload your passport photograph to unlock your Examination Photocard for the CBT entrance screening.'
        }
    }
  }

  const statusMeta = getStatusMeta(applicant.admission_status)

  // ── Reusable Printable Examination Photocard Sheet ───────────────────────
  const renderExamCardSheet = () => (
    <div className="bg-white rounded-3xl p-8 sm:p-10 border border-surface-300 shadow-md max-w-4xl mx-auto space-y-6 text-left font-sans text-surface-900 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-red-900 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-surface-200 shrink-0">
            <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-red-900 tracking-tight font-display leading-tight uppercase">
              AMEENATU COLLEGE OF NURSING SCIENCES
            </h1>
            <p className="text-xs font-bold text-surface-700 tracking-wider uppercase mt-0.5">
              Office of the Registrar & Admissions Directorate
            </p>
            <p className="text-[11px] text-surface-500">
              Takur Site, PMB 105, Dutse, Jigawa State, Nigeria
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-surface-400 block uppercase">SESSION</span>
          <span className="text-xs font-black text-surface-800 uppercase block">{academicSession?.name || '2026/2027'}</span>
          <span className="text-[10px] font-mono font-bold text-red-900 block mt-1">SLIP NO: ACONS/{applicant.id}</span>
        </div>
      </div>

      {/* Banner Title */}
      <div className="bg-surface-100 border border-surface-200 py-2.5 text-center rounded-xl">
        <h2 className="text-xs sm:text-sm font-black text-red-900 tracking-wider uppercase font-display">
          ENTRANCE SCREENING & COMPUTER-BASED TEST (CBT) PHOTOCARD
        </h2>
      </div>

      {/* Candidate Details & Biometric Passport Photo (Photo on top right opposite name) */}
      <div className="flex flex-row items-start justify-between gap-6">
        
        {/* Left: Candidate Details Table */}
        <div className="flex-1 space-y-4">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-surface-100">
              <tr>
                <td className="py-2 font-semibold text-surface-500 w-1/3">Full Name:</td>
                <td className="py-2 font-bold text-surface-900 uppercase">{applicant.full_name}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-surface-500">JAMB Registration No:</td>
                <td className="py-2 font-mono font-black text-red-900">{applicant.jamb_number}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-surface-500">CBT Roll / Seat Number:</td>
                <td className="py-2 font-mono font-bold text-blue-900">{activeExam.seat_number}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-surface-500">Applied Program:</td>
                <td className="py-2 font-bold text-surface-900">{appliedProgramName}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-surface-500">Gender / Sex:</td>
                <td className="py-2 font-bold text-surface-900 uppercase">{applicant.sex}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-surface-500">State of Origin / LGA:</td>
                <td className="py-2 font-bold text-surface-900">{applicant.state_of_origin} / {applicant.lga}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-surface-500">Telephone / Phone:</td>
                <td className="py-2 font-bold text-surface-900">{applicant.phone_number}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Top Right: Passport Photo opposite Candidate Name */}
        <div className="w-32 sm:w-36 shrink-0 flex flex-col items-center text-center space-y-2">
          <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-red-900 bg-surface-100 shadow-sm relative">
            {applicant.passport_photo ? (
              <img 
                src={applicant.passport_photo} 
                alt={applicant.full_name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-surface-400 p-2 text-center">
                <Camera size={24} className="mb-1 text-surface-400" />
                <span className="text-[10px] font-bold">NO PHOTO</span>
              </div>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-red-900 block">
            Verified Biometric Photo
          </span>
        </div>

      </div>

      {/* Schedule & Venue Box */}
      <div className="border border-surface-200 rounded-2xl p-4 bg-surface-50 space-y-3">
        <div className="flex items-center justify-between border-b border-surface-200 pb-2">
          <span className="text-xs font-black text-red-900 uppercase tracking-wider">
            Examination Schedule & Hall Allocation
          </span>
          <span className="text-[10px] font-bold uppercase text-surface-500">
            {activeExam.batch}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-surface-500 font-medium block">Date & Time:</span>
            <span className="font-bold text-surface-900 block">{activeExam.exam_date}</span>
          </div>
          <div>
            <span className="text-surface-500 font-medium block">Mode & Duration:</span>
            <span className="font-bold text-surface-900 block">{activeExam.cbt_duration}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-surface-500 font-medium block">Venue:</span>
            <span className="font-bold text-surface-900 block">{activeExam.exam_venue}</span>
          </div>
        </div>
      </div>

      {/* Registered Examination Papers Table */}
      <div className="space-y-2">
        <span className="text-xs font-black text-red-900 uppercase tracking-wider block">
          Registered CBT Subject Papers (100 Questions Total)
        </span>
        <table className="w-full text-xs border border-surface-200 rounded-xl overflow-hidden">
          <thead className="bg-surface-100 text-surface-700 font-bold border-b border-surface-200">
            <tr>
              <th className="py-2 px-3 text-left w-12">#</th>
              <th className="py-2 px-3 text-left">Subject Paper</th>
              <th className="py-2 px-3 text-center w-28">Questions</th>
              <th className="py-2 px-3 text-right w-28">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {activeExam.subjects.map((sub, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                <td className="py-1.5 px-3 text-surface-400 font-mono">{idx + 1}</td>
                <td className="py-1.5 px-3 font-bold text-surface-800">{sub.name}</td>
                <td className="py-1.5 px-3 text-center text-surface-600">{sub.questions} Qs</td>
                <td className="py-1.5 px-3 text-right font-semibold text-emerald-700">Accredited</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="space-y-2 text-xs">
        <span className="font-black text-red-900 uppercase tracking-wider block">
          Rules & Instructions for Candidates
        </span>
        <ol className="list-decimal pl-5 space-y-1 text-surface-600 leading-relaxed text-[11px]">
          {activeExam.instructions.map((inst, idx) => (
            <li key={idx}>{inst}</li>
          ))}
        </ol>
      </div>

      {/* Sign-off Blocks */}
      <div className="grid grid-cols-2 gap-8 border-t border-surface-200 pt-6 text-xs">
        <div className="space-y-4">
          <div className="border-b border-surface-300 h-8 w-48" />
          <div>
            <span className="font-bold text-surface-800 block">Candidate Signature & Date</span>
            <span className="text-[10px] text-surface-400">Must be signed in ink in the exam hall</span>
          </div>
        </div>

        <div className="space-y-4 text-right">
          <div className="border-b border-surface-300 h-8 w-48 ml-auto" />
          <div>
            <span className="font-bold text-surface-800 block">Chief Invigilator / Verifier Stamp</span>
            <span className="text-[10px] text-surface-400">Official Exam Center Accreditation</span>
          </div>
        </div>
      </div>

      {/* Barcode & Hash */}
      <div className="border-t border-dashed border-surface-200 pt-3 flex items-center justify-between text-[10px] text-surface-400 font-mono">
        <span>VERIFICATION: ACONS-CBT-{applicant.jamb_number}-{applicant.id}</span>
        <span>DATE PRINTED: {new Date().toLocaleDateString()}</span>
      </div>

    </div>
  )

  return (
    <>
      <Head title="Applicant Admissions & Screening Portal — ACONS" />
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-admission-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            background-image: url('/assets/images/acons_letterhead.jpg') !important;
            background-size: 100% 100% !important;
            background-repeat: no-repeat !important;
            background-position: top center !important;
            padding-top: 64mm !important;
            padding-bottom: 20mm !important;
            padding-left: 20mm !important;
            padding-right: 20mm !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── Top Institutional Navigation Bar ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-surface-200 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-surface-200 shadow-sm shrink-0">
              <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm tracking-tight text-surface-900 leading-none">ACONS PORTAL</span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                  {academicSession?.name || '2026/2027'}
                </span>
              </div>
              <span className="text-[11px] text-surface-500 block mt-0.5">Ameenatu College of Nursing Sciences</span>
            </div>
          </div>

          {/* Candidate Profile Pill & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-50 border border-surface-200 text-left">
              {applicant.passport_photo ? (
                <img 
                  src={applicant.passport_photo} 
                  alt={applicant.full_name} 
                  className="w-7 h-7 rounded-lg object-cover border border-surface-300"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-surface-200 text-surface-600 flex items-center justify-center font-bold text-xs">
                  {applicant.full_name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="text-xs leading-tight">
                <span className="font-bold text-surface-900 block truncate max-w-[150px]">{applicant.full_name}</span>
                <span className="text-[10px] font-mono text-surface-500">{applicant.jamb_number}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              title="Sign out of applicant portal"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>

        {/* ── Tabs Navigation Strip ────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 border-t border-surface-100">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar" aria-label="Portal Navigation Tabs">
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <User size={14} />
              <span>Overview & Status</span>
            </button>

            <button
              onClick={() => setActiveTab('exam_card')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === 'exam_card'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              {hasPassport ? <Printer size={14} /> : <Lock size={14} className="text-amber-500" />}
              <span>Examination Photocard</span>
              {!hasPassport && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-amber-100 text-amber-800 border border-amber-200">
                  Locked
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('passport')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === 'passport'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <Camera size={14} />
              <span>Passport Photograph</span>
              {hasPassport ? (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Verified
                </span>
              ) : (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-rose-100 text-rose-800 border border-rose-200">
                  Required
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('qualifications')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === 'qualifications'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <BookOpen size={14} />
              <span>Edit Qualifications</span>
              {canEditQualifications && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-blue-100 text-blue-800 border border-blue-200">
                  Editable
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              <FileText size={14} />
              <span>Letters & Slips</span>
            </button>

          </nav>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ─────────────────────────────────────── */}
      <main className={`min-h-screen bg-surface-50 pb-20 pt-6 px-4 sm:px-6 ${
        printSlipMode || letterMode || examCardModal ? 'print:hidden' : ''
      }`}>
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Flash Feedback Banner */}
          {!flashDismissed && (flash.success || flash.error) && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start justify-between gap-3 shadow-sm ${
              flash.success 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {flash.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : <AlertTriangle size={16} className="shrink-0 text-rose-600" />}
                <span>{flash.success || flash.error}</span>
              </div>
              <button 
                onClick={() => setFlashDismissed(true)} 
                className="text-surface-400 hover:text-surface-700 p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW & ADMISSION STATUS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Provisional Admission Congratulatory Banner (if admitted) */}
              {isAdmittedOrCleared && (
                <div className="bg-gradient-to-r from-red-950 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-surface-300 shadow-md space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      OFFICIAL ADMISSION CLEARANCE
                    </span>
                    {isAcceptancePaid ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        Acceptance Fee Paid (₦10,000)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-500/30 px-3 py-1 rounded-full">
                        <AlertCircle size={13} className="text-amber-400" />
                        Acceptance Fee Required: ₦10,000
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-black leading-tight">
                      Congratulations, {applicant.full_name}!
                    </h1>
                    <p className="text-sm text-surface-200 leading-relaxed max-w-2xl mt-1.5">
                      You have been granted provisional admission into the <strong className="font-extrabold text-white">{applicant.admitted_program?.name || appliedProgramName}</strong> program for the {academicSession?.name || '2026/2027'} academic session.
                    </p>
                  </div>

                  {/* Payment Alert Box when unpaid */}
                  {!isAcceptancePaid && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-xs text-surface-100 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                        <Lock size={15} />
                        <span>₦10,000 Acceptance Fee Required to Unlock Admission Letter</span>
                      </div>
                      <p className="leading-relaxed">
                        To download and print your official Provisional Offer of Admission Letter, you must pay a non-refundable Acceptance Fee of <strong className="text-white font-extrabold">₦10,000</strong>.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-surface-200 border-t border-white/10 mt-2">
                        <div>📅 <strong>Registration Window:</strong> Monday 19th Oct, 2026 – Friday 31st Oct, 2026</div>
                        <div>🎓 <strong>Lectures Commence:</strong> 9th November, 2026</div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {isAcceptancePaid ? (
                      <>
                        <a
                          href={route('admissions.letter.download')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-surface-100 shadow-sm transition-colors"
                        >
                          <Download size={14} className="text-blue-900" />
                          <span>Download Admission Letter (PDF)</span>
                        </a>
                        <button
                          onClick={handleOpenLetter}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900/90 text-white font-bold text-xs hover:bg-blue-900 border border-blue-800 transition-colors"
                        >
                          <Award size={14} />
                          <span>Preview & Print Letter</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setAcceptanceModal(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md transition-colors"
                        >
                          <CreditCard size={14} />
                          <span>Pay ₦10,000 Acceptance Fee</span>
                        </button>
                        <button
                          onClick={() => setAcceptanceModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 border border-white/20 transition-colors"
                        >
                          <Lock size={14} className="text-amber-400" />
                          <span>Admission Letter (Locked)</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPrintSlipMode(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800/80 text-white font-bold text-xs hover:bg-surface-800 border border-surface-700 transition-colors"
                    >
                      <Printer size={14} />
                      <span>Print Application Slip</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Profile Summary Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm space-y-6">
                
                {/* Heading Bar */}
                <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                      Candidate Profile
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-surface-500 font-bold">
                    REG: {applicant.jamb_number}
                  </span>
                </div>

                {/* Candidate Name & Info (Left) with Picture on Top Right (Opposite Name) */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  
                  {/* Left: Name and Candidate Meta */}
                  <div className="space-y-3 flex-1">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-surface-900 font-display leading-tight">
                        {applicant.full_name}
                      </h2>
                      <p className="text-xs font-semibold text-blue-900 mt-1">
                        Applied Program: <strong className="font-bold text-surface-800">{appliedProgramName}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-surface-500">
                      <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-100">
                        <span className="text-[10px] text-surface-400 block font-medium">JAMB Reg No</span>
                        <span className="font-mono font-bold text-surface-800">{applicant.jamb_number}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-100">
                        <span className="text-[10px] text-surface-400 block font-medium">UTME Score</span>
                        <span className="font-bold text-surface-800">{applicant.jamb_score || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-100">
                        <span className="text-[10px] text-surface-400 block font-medium">State / LGA</span>
                        <span className="font-semibold text-surface-800 truncate block">{applicant.state_of_origin} / {applicant.lga}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-100">
                        <span className="text-[10px] text-surface-400 block font-medium">Phone Number</span>
                        <span className="font-semibold text-surface-800">{applicant.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right: Biometric Picture opposite Name */}
                  <div className="shrink-0 flex flex-col items-center sm:items-end">
                    {applicant.passport_photo ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={applicant.passport_photo} 
                          alt={applicant.full_name} 
                          className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl object-cover border-2 border-surface-300 shadow-sm"
                        />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1.5 block">
                          Verified Photo
                        </span>
                      </div>
                    ) : (
                      <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-surface-100 border-2 border-dashed border-surface-300 flex flex-col items-center justify-center text-surface-400 p-2 text-center">
                        <Camera size={20} className="mb-1 text-surface-400" />
                        <span className="text-[10px] font-semibold leading-tight">No Photo</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-surface-100 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      if (hasPassport) {
                        setExamCardModal(true)
                      } else {
                        setActiveTab('exam_card')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 transition-colors shadow-sm"
                  >
                    <Printer size={14} />
                    <span>{hasPassport ? 'Print Exam Card' : 'View Exam Card'}</span>
                  </button>

                  {hasPassport ? (
                    <a
                      href={route('admissions.exam.download')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-sm"
                    >
                      <Download size={14} />
                      <span>Download Exam Card PDF</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setActiveTab('passport')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs hover:bg-amber-100 transition-colors"
                    >
                      <Upload size={14} />
                      <span>Upload Passport Photo</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPrintSlipMode(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-50 text-surface-700 border border-surface-200 font-bold text-xs hover:bg-surface-100 transition-colors"
                  >
                    <FileText size={14} />
                    <span>Application Slip</span>
                  </button>
                </div>

              </div>

              {/* Passport Required Callout (if missing) */}
              {!hasPassport && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
                      <Lock size={18} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-amber-900">Action Required: Upload Passport Photograph</h3>
                      <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
                        Your CBT Examination Photocard is currently locked. In accordance with examination regulations, your passport photograph is required to enable verification on the screening day.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('passport')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-sm shrink-0"
                  >
                    <Upload size={14} />
                    <span>Upload Now</span>
                  </button>
                </div>
              )}

              {/* Live Screening Status Tracker */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-surface-900">Admission Clearance Lifecycle</h3>
                  <p className="text-xs text-surface-500 mt-0.5">Real-time tracking of candidate milestones from registration to final matriculation.</p>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-8 border-l-2 border-surface-200">
                  
                  {/* Step 1: Submit */}
                  <div className="relative">
                    <div className="absolute -left-[31px] sm:-left-[39px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white ring-2 ring-emerald-500/20" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        Application Form Submitted <CheckCircle2 size={13} />
                      </span>
                      <p className="text-xs text-surface-500 font-medium">
                        Personal profile, JAMB score, and primary/secondary educational records verified in registry.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Payment */}
                  <div className="relative">
                    <div className="absolute -left-[31px] sm:-left-[39px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white ring-2 ring-emerald-500/20" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        Application Fee Settled (₦14,700.00) <CheckCircle2 size={13} />
                      </span>
                      <p className="text-xs text-surface-500 font-medium">
                        Remita / Zainpay processing clearance: <span className="font-mono text-surface-800 font-bold">{applicant.payment_reference}</span>.
                        <a href={route('admissions.receipt', applicant.id)} className="text-blue-700 font-bold hover:underline ml-1.5">
                          View e-Receipt &rarr;
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Biometric Passport */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] sm:-left-[39px] w-4 h-4 rounded-full border-4 border-white ring-2 ${
                      hasPassport 
                        ? 'bg-emerald-500 ring-emerald-500/20' 
                        : 'bg-amber-500 ring-amber-500/20 animate-pulse'
                    }`} />
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${hasPassport ? 'text-emerald-700' : 'text-amber-700'}`}>
                        Biometric Passport Photograph {hasPassport ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      </span>
                      <p className="text-xs text-surface-500 font-medium">
                        {hasPassport 
                          ? 'Accredited passport photograph received and verified for the CBT Examination Card.' 
                          : 'Pending photograph upload. Required to unlock and print your Examination Photocard.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Entrance CBT Screening */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] sm:-left-[39px] w-4 h-4 rounded-full border-4 border-white ring-2 ${
                      isAdmittedOrCleared 
                        ? 'bg-emerald-500 ring-emerald-500/20' 
                        : 'bg-blue-600 ring-blue-600/20'
                    }`} />
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${isAdmittedOrCleared ? 'text-emerald-700' : 'text-blue-900'}`}>
                        CBT Entrance Screening & Accreditation {isAdmittedOrCleared && <CheckCircle2 size={13} />}
                      </span>
                      <p className="text-xs text-surface-500 font-medium">
                        Scheduled Date: <strong className="text-surface-800 font-bold">{activeExam.exam_date}</strong>. Venue: ACONS Main Campus CBT Hall, Dutse.
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Admission Decision */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] sm:-left-[39px] w-4 h-4 rounded-full border-4 border-white ring-2 ${
                      isAdmittedOrCleared 
                        ? 'bg-emerald-500 ring-emerald-500/20' 
                        : applicant.admission_status === 'rejected'
                        ? 'bg-rose-500 ring-rose-500/20'
                        : 'bg-surface-300 ring-surface-200'
                    }`} />
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${
                        isAdmittedOrCleared ? 'text-emerald-700' : applicant.admission_status === 'rejected' ? 'text-rose-700' : 'text-surface-600'
                      }`}>
                        Admissions Board Decision
                      </span>
                      <p className="text-xs text-surface-500 font-medium">
                        {statusMeta.description}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* CBT Examination Schedule & Guidelines Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-surface-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-surface-900">Entrance Screening Information</h3>
                    <p className="text-xs text-surface-500">Essential instructions for candidate CBT evaluation day.</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-100 text-surface-700 border border-surface-200">
                    Takur Site, Dutse
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-1">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Examination Date</span>
                    <span className="font-bold text-surface-900 block">{activeExam.exam_date}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-1">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Assigned Seat Number</span>
                    <span className="font-mono font-bold text-blue-900 block">{activeExam.seat_number}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-1">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Center & Venue</span>
                    <span className="font-semibold text-surface-800 block">{activeExam.exam_venue}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider mb-2">Mandatory Requirements to Bring:</h4>
                  <ul className="text-xs text-surface-600 space-y-1.5 pl-4 list-disc">
                    <li>Printed color copy of your ACONS CBT Examination Photocard.</li>
                    <li>Original JAMB UTME Result Slip showing Nursing choice.</li>
                    <li>Valid Photo Identification (National ID / NIN Slip / Voters Card / International Passport).</li>
                    <li>HB Pencil and eraser for rough work calculations.</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: EXAMINATION PHOTOCARD (GATED)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'exam_card' && (
            <div className="space-y-6">
              
              {!hasPassport ? (
                /* Gated Notice: Candidate MUST upload photo first */
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-surface-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                    <Lock size={32} />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Security Verification Gate
                    </span>
                    <h2 className="text-2xl font-black text-surface-900 font-display">
                      Examination Photocard Locked
                    </h2>
                    <p className="text-sm text-surface-600 leading-relaxed max-w-lg mx-auto">
                      In compliance with ACONS examination guidelines, candidate photocards cannot be downloaded or printed without a verified passport photograph. This photograph is required for facial accreditation on exam day.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 text-left text-xs text-surface-600 max-w-md mx-auto space-y-2">
                    <div className="flex items-center gap-2 font-bold text-surface-800">
                      <AlertCircle size={14} className="text-amber-600" />
                      <span>Requirements for Unlocking:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-surface-600">
                      <li>Clear, colored passport photograph with white background.</li>
                      <li>Face centered and fully visible without tinted lenses.</li>
                      <li>File format: JPG or PNG (under 2MB).</li>
                    </ul>
                  </div>

                  <div>
                    <button
                      onClick={() => setActiveTab('passport')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 transition-colors shadow-sm"
                    >
                      <Upload size={14} />
                      <span>Go to Passport Upload Tab &rarr;</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unlocked: Full Photocard View & Print Toolbar */
                <div className="space-y-6">
                  
                  {/* Action Toolbar */}
                  <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-surface-900 block">Photocard Verified & Unlocked</span>
                        <span className="text-[11px] text-surface-500">Biometric passport attached. Authorized for entrance screening.</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={route('admissions.exam.download')}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-sm transition-colors flex-1 sm:flex-none"
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </a>
                      <button
                        onClick={() => setExamCardModal(true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 shadow-sm transition-colors flex-1 sm:flex-none"
                      >
                        <Printer size={14} />
                        <span>Print Exam Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Render Photocard Sheet */}
                  {renderExamCardSheet()}
                </div>
              )}

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: PASSPORT PHOTOGRAPH UPLOAD
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'passport' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-surface-900 font-display">
                    Passport Photograph Accreditation
                  </h2>
                  <p className="text-xs text-surface-500 mt-1">
                    Upload a compliant biometric passport photo. This photo will be printed directly on your Examination Photocard and verified at the exam hall.
                  </p>
                </div>

                {/* Guidelines Checklist */}
                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 text-xs space-y-2">
                  <span className="font-bold text-surface-800 block uppercase tracking-wider text-[11px]">
                    Photo Specification Guidelines:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-surface-600">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>Plain white or light grey background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>Full face looking straight at the camera</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>No hats, headgear, or dark glasses obscuring face</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>JPG or PNG format, max size 2MB</span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handlePhotoUploadSubmit} className="space-y-6">
                  
                  {/* Photo Preview & Drop Area */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-surface-200 rounded-3xl bg-surface-50/50">
                    
                    {/* Preview Box */}
                    <div className="w-36 h-44 rounded-2xl overflow-hidden bg-white border-2 border-surface-200 shadow-sm flex items-center justify-center shrink-0 relative">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Passport preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-surface-400">
                          <Camera size={28} className="mx-auto mb-1 text-surface-300" />
                          <span className="text-[10px] font-semibold block leading-tight">No Image Chosen</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-3 text-center sm:text-left flex-1">
                      <div>
                        <label 
                          htmlFor="passport_input"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-300 text-surface-800 font-bold text-xs hover:bg-surface-50 cursor-pointer shadow-sm transition-colors"
                        >
                          <Camera size={14} />
                          <span>Choose Photo File</span>
                        </label>
                        <input 
                          id="passport_input"
                          type="file" 
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[11px] text-surface-500 leading-relaxed">
                        Click the button above to select a recent passport photo from your phone or computer.
                      </p>

                      {photoErrors.passport_photo && (
                        <p className="text-xs font-bold text-rose-600">
                          {photoErrors.passport_photo}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!photoData.passport_photo || photoProcessing}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {photoProcessing ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>Upload & Verify Passport</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: EDIT EXAMINATION (O'LEVELS & AWAITING RESULTS)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'qualifications' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {!canEditQualifications ? (
                /* Locked when already admitted */
                <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-sm text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-surface-900">Qualifications Locked</h3>
                    <p className="text-xs text-surface-500 max-w-md mx-auto mt-1">
                      Your admission has already been finalized and cleared by the Academic Board. Educational qualifications are frozen.
                    </p>
                  </div>
                </div>
              ) : (
                /* Editable Form */
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm space-y-8">
                  
                  <div className="border-b border-surface-200 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Awaiting Results Allowed
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-surface-900 font-display mt-2">
                      Edit Examination Qualifications & Sittings
                    </h2>
                    <p className="text-xs text-surface-500 mt-1">
                      Update your WAEC, NECO, or NABTEB sittings, grades, and awaiting results status while your application is undergoing screening.
                    </p>
                  </div>

                  <form onSubmit={handleExamSubmit} className="space-y-8">
                    
                    {/* Program of Choice Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-800 uppercase tracking-wider block">
                        Choice of Nursing Program:
                      </label>
                      <select
                        value={examFormData.applied_program_id || ''}
                        onChange={(e) => setExamFormData('applied_program_id', Number(e.target.value))}
                        className="w-full text-xs font-medium p-3 rounded-xl border border-surface-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      >
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.degree_type ? `(${p.degree_type})` : ''} — {p.duration_years || 4} Years
                          </option>
                        ))}
                      </select>
                      {examErrors.applied_program_id && (
                        <p className="text-xs text-rose-600 font-bold">{examErrors.applied_program_id}</p>
                      )}
                    </div>

                    {/* Sitting 1 Section */}
                    <div className="space-y-4 border border-surface-200 rounded-2xl p-5 bg-surface-50/50">
                      <div className="flex items-center justify-between border-b border-surface-200 pb-3">
                        <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                          O'Level Examination — First Sitting
                        </h3>
                        <span className="text-[10px] font-bold text-surface-500">Mandatory</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Examination Body</label>
                          <select
                            value={examFormData.first_sitting_type}
                            onChange={(e) => setExamFormData('first_sitting_type', e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-surface-300 bg-white"
                          >
                            <option value="WAEC">WAEC (May/June or GCE)</option>
                            <option value="NECO">NECO (SSCE or GCE)</option>
                            <option value="NABTEB">NABTEB (National Business & Tech)</option>
                            <option value="NBAIS">NBAIS</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Sitting Year</label>
                          <input
                            type="text"
                            value={examFormData.first_sitting_year}
                            onChange={(e) => setExamFormData('first_sitting_year', e.target.value)}
                            placeholder="e.g. 2025"
                            className="w-full text-xs p-2.5 rounded-xl border border-surface-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">
                            Examination / Registration No
                          </label>
                          <input
                            type="text"
                            value={examFormData.first_sitting_no}
                            onChange={(e) => setExamFormData('first_sitting_no', e.target.value)}
                            placeholder="e.g. 4120301045 or AWAITING"
                            className="w-full text-xs p-2.5 rounded-xl border border-surface-300 bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Dynamic Subject & Grade Rows */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-surface-700 uppercase tracking-wider block">
                            Subject Grades (Select 'AR' if Awaiting Result)
                          </label>
                          <button
                            type="button"
                            onClick={addSubjectRow1}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 hover:text-blue-950"
                          >
                            <Plus size={12} /> Add Subject
                          </button>
                        </div>

                        <div className="space-y-2">
                          {examFormData.first_sitting_grades.map((row, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={row.subject}
                                onChange={(e) => handleGradeChange1(idx, 'subject', e.target.value)}
                                placeholder="Subject Name"
                                className="flex-1 text-xs p-2 rounded-xl border border-surface-300 bg-white"
                              />
                              <select
                                value={row.grade}
                                onChange={(e) => handleGradeChange1(idx, 'grade', e.target.value)}
                                className="w-24 text-xs p-2 rounded-xl border border-surface-300 bg-white font-bold"
                              >
                                <option value="A1">A1</option>
                                <option value="B2">B2</option>
                                <option value="B3">B3</option>
                                <option value="C4">C4</option>
                                <option value="C5">C5</option>
                                <option value="C6">C6</option>
                                <option value="D7">D7</option>
                                <option value="E8">E8</option>
                                <option value="F9">F9</option>
                                <option value="AR">AR (Awaiting)</option>
                              </select>
                              {examFormData.first_sitting_grades.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSubjectRow1(idx)}
                                  className="p-2 text-surface-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                  title="Remove subject row"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Sitting 2 Toggle & Section */}
                    <div className="space-y-4 border border-surface-200 rounded-2xl p-5 bg-surface-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            id="second_sitting_toggle"
                            type="checkbox"
                            checked={hasSecondSitting}
                            onChange={(e) => {
                              setHasSecondSitting(e.target.checked)
                              if (!e.target.checked) {
                                setExamFormData('second_sitting_type', '')
                                setExamFormData('second_sitting_year', '')
                                setExamFormData('second_sitting_no', '')
                                setExamFormData('second_sitting_grades', [])
                              } else {
                                setExamFormData('second_sitting_type', 'WAEC')
                                setExamFormData('second_sitting_year', '2024')
                                if (examFormData.second_sitting_grades.length === 0) {
                                  setExamFormData('second_sitting_grades', [
                                    { subject: 'Chemistry', grade: 'C5' }
                                  ])
                                }
                              }
                            }}
                            className="rounded text-blue-900 focus:ring-blue-900 w-4 h-4"
                          />
                          <label htmlFor="second_sitting_toggle" className="text-xs font-bold text-surface-800 cursor-pointer">
                            Combine with Second Sitting (Optional)
                          </label>
                        </div>
                      </div>

                      {hasSecondSitting && (
                        <div className="space-y-4 pt-3 border-t border-surface-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-[11px] font-bold text-surface-700 block mb-1">Examination Body</label>
                              <select
                                value={examFormData.second_sitting_type}
                                onChange={(e) => setExamFormData('second_sitting_type', e.target.value)}
                                className="w-full text-xs p-2.5 rounded-xl border border-surface-300 bg-white"
                              >
                                <option value="WAEC">WAEC</option>
                                <option value="NECO">NECO</option>
                                <option value="NABTEB">NABTEB</option>
                                <option value="NBAIS">NBAIS</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-surface-700 block mb-1">Sitting Year</label>
                              <input
                                type="text"
                                value={examFormData.second_sitting_year}
                                onChange={(e) => setExamFormData('second_sitting_year', e.target.value)}
                                placeholder="e.g. 2024"
                                className="w-full text-xs p-2.5 rounded-xl border border-surface-300 bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-surface-700 block mb-1">Exam / Reg No</label>
                              <input
                                type="text"
                                value={examFormData.second_sitting_no}
                                onChange={(e) => setExamFormData('second_sitting_no', e.target.value)}
                                placeholder="Registration Number"
                                className="w-full text-xs p-2.5 rounded-xl border border-surface-300 bg-white font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-surface-700 uppercase tracking-wider block">
                                Second Sitting Subjects
                              </label>
                              <button
                                type="button"
                                onClick={addSubjectRow2}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 hover:text-blue-950"
                              >
                                <Plus size={12} /> Add Subject
                              </button>
                            </div>

                            <div className="space-y-2">
                              {examFormData.second_sitting_grades.map((row, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={row.subject}
                                    onChange={(e) => handleGradeChange2(idx, 'subject', e.target.value)}
                                    placeholder="Subject Name"
                                    className="flex-1 text-xs p-2 rounded-xl border border-surface-300 bg-white"
                                  />
                                  <select
                                    value={row.grade}
                                    onChange={(e) => handleGradeChange2(idx, 'grade', e.target.value)}
                                    className="w-24 text-xs p-2 rounded-xl border border-surface-300 bg-white font-bold"
                                  >
                                    <option value="A1">A1</option>
                                    <option value="B2">B2</option>
                                    <option value="B3">B3</option>
                                    <option value="C4">C4</option>
                                    <option value="C5">C5</option>
                                    <option value="C6">C6</option>
                                    <option value="D7">D7</option>
                                    <option value="E8">E8</option>
                                    <option value="F9">F9</option>
                                    <option value="AR">AR (Awaiting)</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeSubjectRow2(idx)}
                                    className="p-2 text-surface-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Candidate Contact Updates */}
                    <div className="space-y-4 border border-surface-200 rounded-2xl p-5 bg-surface-50/50">
                      <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b border-surface-200 pb-2">
                        Candidate Contact Details & Next of Kin
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={examFormData.phone_number}
                            onChange={(e) => setExamFormData('phone_number', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-surface-300 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Email Address</label>
                          <input
                            type="email"
                            value={examFormData.email}
                            onChange={(e) => setExamFormData('email', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-surface-300 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Contact Address</label>
                          <textarea
                            rows={2}
                            value={examFormData.contact_address}
                            onChange={(e) => setExamFormData('contact_address', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-surface-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Next of Kin Name</label>
                          <input
                            type="text"
                            value={examFormData.next_of_kin_name}
                            onChange={(e) => setExamFormData('next_of_kin_name', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-surface-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-surface-700 block mb-1">Next of Kin Address / Phone</label>
                          <input
                            type="text"
                            value={examFormData.next_of_kin_address}
                            onChange={(e) => setExamFormData('next_of_kin_address', e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-surface-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
                      <button
                        type="submit"
                        disabled={examProcessing}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 disabled:opacity-50 shadow-sm transition-colors"
                      >
                        {examProcessing ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Save & Update Qualifications</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>

                </div>
              )}

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5: CENTRAL DOCUMENTS DESK (SLIPS & LETTERS)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-surface-900 font-display">
                    Official Documents & Letters Desk
                  </h2>
                  <p className="text-xs text-surface-500 mt-1">
                    Central repository of all institutional verification slips, receipts, and offer letters.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Document 1: Application Slip */}
                  <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50/50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Document 01</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Cleared</span>
                      </div>
                      <h3 className="text-sm font-bold text-surface-900">Official ACONS Application Slip</h3>
                      <p className="text-xs text-surface-500 leading-relaxed">
                        Complete candidate registry profile showing bio-data, academic sittings, and declaration.
                      </p>
                    </div>
                    <button
                      onClick={() => setPrintSlipMode(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-300 text-surface-800 font-bold text-xs hover:bg-surface-50 shadow-sm transition-colors"
                    >
                      <Printer size={14} />
                      <span>Preview & Print Slip</span>
                    </button>
                  </div>

                  {/* Document 2: Fee Payment Receipt */}
                  <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50/50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Document 02</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Paid ₦14,700</span>
                      </div>
                      <h3 className="text-sm font-bold text-surface-900">Official Electronic Fee Receipt (e-Receipt)</h3>
                      <p className="text-xs text-surface-500 leading-relaxed">
                        Zainpay / Remita verified settlement voucher. Ref: <span className="font-mono">{applicant.payment_reference}</span>.
                      </p>
                    </div>
                    <a
                      href={route('admissions.receipt', applicant.id)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-300 text-surface-800 font-bold text-xs hover:bg-surface-50 shadow-sm transition-colors"
                    >
                      <FileText size={14} />
                      <span>View & Print e-Receipt</span>
                    </a>
                  </div>

                  {/* Document 3: Exam Photocard */}
                  <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50/50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Document 03</span>
                        {hasPassport ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Unlocked</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Photo Required</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-surface-900">Entrance Screening CBT Photocard</h3>
                      <p className="text-xs text-surface-500 leading-relaxed">
                        Candidate accreditation card with seat allocation, test venue, and registered CBT papers.
                      </p>
                    </div>
                    {hasPassport ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setExamCardModal(true)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-surface-300 text-surface-800 font-bold text-xs hover:bg-surface-50 shadow-sm transition-colors"
                        >
                          <Printer size={14} />
                          <span>Print Slip</span>
                        </button>
                        <a
                          href={route('admissions.exam.download')}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-sm transition-colors"
                        >
                          <Download size={14} />
                          <span>Download PDF</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTab('passport')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-sm transition-colors"
                      >
                        <Upload size={14} />
                        <span>Upload Passport to Unlock</span>
                      </button>
                    )}
                  </div>

                  {/* Document 4: Provisional Admission Letter */}
                  <div className="p-5 rounded-2xl border border-surface-200 bg-surface-50/50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Document 04</span>
                        {isAdmittedOrCleared ? (
                          isAcceptancePaid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Unlocked & Cleared</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Fee Required (₦10,000)</span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-surface-500 bg-surface-100 px-2 py-0.5 rounded border border-surface-200">Pending Review</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-surface-900">Official Provisional Offer of Admission</h3>
                      <p className="text-xs text-surface-500 leading-relaxed">
                        Formal letter from the Provost and Registry confirming placement, dates, and registration conditions.
                      </p>
                    </div>
                    {isAdmittedOrCleared ? (
                      isAcceptancePaid ? (
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={route('admissions.letter.download')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 shadow-sm transition-colors"
                          >
                            <Download size={14} />
                            <span>Download PDF</span>
                          </a>
                          <button
                            onClick={handleOpenLetter}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-surface-300 text-surface-800 font-bold text-xs hover:bg-surface-50 shadow-sm transition-colors"
                          >
                            <Printer size={14} />
                            <span>Print Preview</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAcceptanceModal(true)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md transition-colors"
                        >
                          <CreditCard size={14} />
                          <span>Pay ₦10,000 Acceptance Fee</span>
                        </button>
                      )
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-200 text-surface-500 font-bold text-xs cursor-not-allowed"
                      >
                        <Lock size={14} />
                        <span>Offer Pending Evaluation</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: FORMAL APPLICATION SLIP PREVIEW & PRINT
         ═══════════════════════════════════════════════════════════════════════ */}
      {printSlipMode && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-4 flex items-start justify-center pt-10 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-8 sm:p-10 border border-surface-200 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 relative">
            
            {/* Print Action Bar */}
            <div className="flex justify-between items-center bg-surface-50 border border-surface-200 p-4 rounded-2xl print:hidden">
              <span className="text-xs font-bold text-surface-700">Official ACONS Application Slip Preview</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 shadow-md"
                >
                  <Printer size={14} /> Send to Printer
                </button>
                <button 
                  onClick={() => setPrintSlipMode(false)}
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
                <div className="text-right flex items-center gap-4 shrink-0">
                  {applicant.passport_photo && (
                    <img 
                      src={applicant.passport_photo} 
                      alt={applicant.full_name} 
                      className="w-16 h-20 rounded-lg object-cover border-2 border-red-900 shadow-sm"
                    />
                  )}
                  <div className="text-right">
                    <span className="text-xs font-bold text-surface-400 block">APPLICATION ID</span>
                    <span className="text-base font-black text-red-900 tracking-wide font-mono block">ACONS/2025/{applicant.id}</span>
                  </div>
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
                      <tr className="border-b border-surface-100"><td className="py-1.5 font-semibold text-surface-400">Date of Birth:</td><td className="py-1.5 font-bold text-surface-800">{applicant.dob ? new Date(applicant.dob).toLocaleDateString() : 'N/A'}</td></tr>
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
                      <span className="text-red-900 font-mono">No: {applicant.first_sitting_no || 'Awaiting'}</span>
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
                        <span className="text-red-900 font-mono">No: {applicant.second_sitting_no || 'Awaiting'}</span>
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
                  <span className="font-black text-blue-900 block uppercase tracking-wider">C. Parent & Sponsor Contacts</span>
                  <p className="leading-relaxed text-surface-700">
                    Parent: <strong className="font-bold text-surface-800">{applicant.parent_name}</strong> ({applicant.parent_phone})<br />
                    Address: {applicant.parent_address}<br />
                    Sponsor Name & Addr: {applicant.sponsor_name_address}
                  </p>
                </div>

                <div className="space-y-1 text-xs bg-surface-50 p-4 border border-surface-200 rounded-2xl">
                  <span className="font-black text-blue-900 block uppercase tracking-wider">D. Payment Settle Clearance</span>
                  <p className="leading-relaxed text-surface-600">
                    Remita Fee Settle Status: <strong className="font-bold text-emerald-700">CLEARED / PAID</strong><br />
                    Total Paid Amount: <strong className="font-bold text-surface-800">₦14,700.00</strong><br />
                    Reference Clearance Code: <strong className="font-bold text-blue-900 font-mono">{applicant.payment_reference}</strong>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: OFFICIAL PROVISIONAL ADMISSION LETTER PREVIEW & PRINT
         ═══════════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: OFFICIAL PROVISIONAL ADMISSION LETTER PREVIEW & PRINT
         ═══════════════════════════════════════════════════════════════════════ */}
      {letterMode && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 flex items-start justify-center pt-8 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 sm:p-8 border border-surface-200 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 relative">
            
            {/* Print Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-surface-50 border border-surface-200 p-4 rounded-2xl print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-surface-800">
                  ACONS Official Provisional Offer of Admission Letter
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-200 text-surface-700 font-bold">
                  2026/2027 SESSION
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={route('admissions.letter.download')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-sm transition-colors"
                >
                  <Download size={14} /> Download PDF
                </a>
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 shadow-sm transition-colors"
                >
                  <Printer size={14} /> Send to Printer
                </button>
                <button 
                  onClick={() => setLetterMode(false)}
                  className="px-3.5 py-2 border border-surface-200 text-surface-700 rounded-xl text-xs font-bold hover:bg-surface-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Letter Paper Sheet matching ACONS ND ADMISSION LETTER.docx */}
            <div 
              className="print-admission-sheet relative bg-white text-black shadow-xl mx-auto rounded-none print:shadow-none print:m-0"
              style={{
                width: '100%',
                maxWidth: '794px',
                minHeight: '1123px',
                backgroundImage: "url('/assets/images/acons_letterhead.jpg')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'top center',
                paddingTop: '240px',
                paddingBottom: '80px',
                paddingLeft: '65px',
                paddingRight: '65px',
                boxSizing: 'border-box',
                fontFamily: '"Times New Roman", Times, Georgia, serif',
              }}
            >
              {/* Date */}
              <div className="text-right font-bold text-[13px] mb-2 text-black">
                16th October, 2026
              </div>

              {/* Candidate Metadata */}
              <table className="w-full text-[13px] mb-3 border-collapse text-black">
                <tbody>
                  <tr>
                    <td className="w-48 py-0.5 text-black">Registration Number:</td>
                    <td className="font-bold py-0.5 text-black font-mono">
                      {applicant.registration_number || `ACONS/ND/2026/${String(applicant.id).padStart(3, '0')}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-black">Name of Candidate:</td>
                    <td className="font-bold py-0.5 text-black uppercase">{applicant.full_name}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-black">L.G.A:</td>
                    <td className="font-bold py-0.5 text-black uppercase">{applicant.lga || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-black">State:</td>
                    <td className="font-bold py-0.5 text-black uppercase">{applicant.state_of_origin || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-black">Phone Number:</td>
                    <td className="font-bold py-0.5 text-black">{applicant.phone_number || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Subject Title */}
              <div className="text-center my-3 text-black">
                <div className="font-bold text-[13.5px] uppercase tracking-wide">
                  PROVISIONAL OFFER OF ADMISSION INTO ND/HND NURSING PROGRAM
                </div>
                <div className="font-bold text-[13px]">
                  (2026/2027 ACADEMIC SESSION)
                </div>
              </div>

              {/* Body */}
              <div className="text-justify text-[13px] leading-relaxed mb-2.5 text-black">
                Following your successful participation in the recent screening exercise, you have been offered provisional admission to a four-year ND/HND Nursing program at Ameenatu College of Nursing Sciences (ACONS), Dutse.
              </div>

              <div className="font-bold text-[13px] mt-2 mb-1 text-black">Conditions of Admission:</div>
              <div className="font-bold text-[13px] mb-1 text-black">Document verification:</div>
              <div className="text-[13px] mb-1.5 text-black">You are required to present both the ORIGINAL and PHOTOCOPY of the following documents during registration.</div>

              <ul className="list-disc pl-6 text-[12.5px] leading-relaxed mb-2.5 space-y-0.5 text-black">
                <li>Primary School Leaving Certificate</li>
                <li>SSCE Statement/Certificate of results (WAEC, NECO, NABTEB or NBAIS), including the online printout</li>
                <li>Testimonial from your previous school</li>
                <li>Birth certificate or declaration of Age</li>
                <li>Medical Certificate of Fitness (Original)</li>
                <li>Two (2) recent passport-size photographs</li>
              </ul>

              <div className="text-justify text-[13px] leading-relaxed mb-2 text-black">
                <strong className="font-bold">Disqualification Clause:</strong> If it is found at any point that you lack any of the required qualifications, your admission will be revoked immediately.
              </div>

              <div className="text-justify text-[13px] leading-relaxed mb-2 text-black">
                <strong className="font-bold">Registration period:</strong> Registration will take place from <strong className="font-bold">Monday 19th October, 2026 to Friday 31st October, 2026</strong>. Failure to complete registration within this time frame will result in the cancellation of your admission.
              </div>

              <div className="text-justify text-[13px] leading-relaxed mb-2 text-black">
                <strong className="font-bold">Acceptance Fee:</strong> Payment of a non-refundable Acceptance Fee of <strong className="font-bold">₦10,000</strong> is required prior to document verification and completion of registration.
              </div>

              <div className="text-justify text-[13px] leading-relaxed mb-2 text-black">
                <strong className="font-bold">Name policy:</strong> Change of name is not permitted throughout the training period.
              </div>

              <div className="text-justify text-[13px] leading-relaxed mb-2 text-black">
                <strong className="font-bold">Additional Requirements:</strong> A list of additional items required for registration is attached for your reference.
              </div>

              <div className="text-justify text-[13px] leading-relaxed mb-2.5 text-black">
                <strong className="font-bold">Commencement of lectures:</strong> <strong className="font-bold">9th November, 2026</strong>.
              </div>

              <div className="text-center font-bold text-[13px] my-2.5 text-black">
                We look forward to welcoming you to the college. Congratulations!
              </div>

              {/* Signatory */}
              <div className="text-center mt-3 text-black">
                <img 
                  src="/assets/images/provost_signature.jpeg" 
                  alt="Dr. Abdullahi Adamu Provost Signature" 
                  className="h-9 mx-auto mb-1 object-contain"
                />
                <div className="font-bold text-[13px] leading-tight">Dr. Abdullahi Adamu</div>
                <div className="text-[12px] leading-tight">(Provost)</div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: OFFICIAL CBT EXAMINATION PHOTOCARD PREVIEW & PRINT
         ═══════════════════════════════════════════════════════════════════════ */}
      {examCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-4 flex items-start justify-center pt-10 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 sm:p-10 border border-surface-200 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none relative">
            
            {/* Print Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-surface-50 border border-surface-200 p-4 rounded-2xl print:hidden">
              <span className="text-xs font-bold text-surface-700 flex items-center gap-1.5">
                <Printer size={14} className="text-blue-900" />
                Official ACONS CBT Examination Photocard Preview
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={route('admissions.exam.download')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-md transition-colors"
                >
                  <Download size={14} /> Download PDF
                </a>
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 shadow-md transition-colors"
                >
                  <Printer size={14} /> Send to Printer
                </button>
                <button 
                  onClick={() => setExamCardModal(false)}
                  className="px-4 py-2 border border-surface-200 text-surface-600 rounded-xl text-xs font-bold hover:bg-surface-100 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Printable Photocard Sheet */}
            {renderExamCardSheet()}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: ACCEPTANCE FEE PAYMENT (₦10,000)
         ═══════════════════════════════════════════════════════════════════════ */}
      {acceptanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 border border-surface-200 shadow-2xl space-y-6 relative">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 leading-tight">Acceptance Fee Settlement</h3>
                  <p className="text-xs text-surface-500 mt-0.5">ACONS 2026/2027 Provisional Admission Offer</p>
                </div>
              </div>
              <button 
                onClick={() => setAcceptanceModal(false)}
                className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Fee summary card */}
            <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-surface-500">Candidate Name:</span>
                <span className="font-bold text-surface-900 uppercase">{applicant.full_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-surface-500">JAMB Reg Number:</span>
                <span className="font-mono font-bold text-blue-900">{applicant.jamb_number}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-surface-500">Program Offered:</span>
                <span className="font-semibold text-surface-800">{applicant.admitted_program?.name || 'ND/HND Nursing Program'}</span>
              </div>
              <div className="border-t border-surface-200 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-surface-700 block">Acceptance Fee Amount</span>
                  <span className="text-[10px] text-surface-400">Non-refundable institutional admission fee</span>
                </div>
                <span className="text-2xl font-black text-emerald-600 font-mono">₦10,000.00</span>
              </div>
            </div>

            {/* Important dates notice */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span>Crucial Registration & Lecture Dates</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-amber-900/90 leading-relaxed">
                <li><strong>Registration Window:</strong> Monday 19th October, 2026 to Friday 31st October, 2026.</li>
                <li><strong>Commencement of Lectures:</strong> 9th November, 2026.</li>
                <li>Payment of this Acceptance Fee is required before your Official Provisional Offer of Admission Letter can be issued and downloaded.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handlePayAcceptance}
                disabled={payingAcceptance}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
              >
                {payingAcceptance ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Connecting to ZainPay...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Pay ₦10,000 with ZainPay (Card / USSD / Bank)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAcceptanceModal(false)}
                className="w-full py-2 text-center text-xs font-semibold text-surface-500 hover:text-surface-700 transition-colors"
              >
                Cancel and Return
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  )
}
