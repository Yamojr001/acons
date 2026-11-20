import React, { useState } from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'
import { 
  User, Phone, Mail, BookOpen, GraduationCap, Users, ShieldAlert,
  CheckCircle, ArrowLeft, Lock, Unlock, CreditCard, AlertCircle,
  Plus, Trash2, Save, FileText, ChevronRight
} from 'lucide-react'

interface ProgramOption {
  id: number
  name: string
  degree_type?: string
  duration_years?: number
}

interface EditProps {
  tenant: any
  institution: any
  applicant?: any
  programs?: ProgramOption[]
  is_admitted?: boolean
  edit_fee_paid?: boolean
  fee_amount?: number
  mode?: 'lookup' | 'edit'
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const SUBJECTS_LIST = [
  'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics',
  'Civic Education', 'Computer Studies', 'Agricultural Science', 'Geography',
  'Economics', 'Islamic Studies', 'Christian Religious Studies', 'Government'
]

const GRADES_LIST = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']

export default function Edit({
  tenant,
  institution,
  applicant,
  programs = [],
  is_admitted = false,
  edit_fee_paid = false,
  fee_amount = 2000.00,
  mode = 'edit'
}: EditProps) {
  // ── Lookup Form (if not logged in) ──────────────────────────────────────────
  const { 
    data: lookupData, 
    setData: setLookupData, 
    post: postLookup, 
    processing: lookupProcessing, 
    errors: lookupErrors 
  } = useForm({
    identifier: ''
  })

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    postLookup(route('admissions.edit.lookup.submit'))
  }

  // ── Main Edit Form ──────────────────────────────────────────────────────────
  const initialFirstGrades = Array.isArray(applicant?.first_sitting_grades) && applicant.first_sitting_grades.length > 0
    ? applicant.first_sitting_grades
    : [
        { subject: 'English Language', grade: 'C6' },
        { subject: 'Mathematics', grade: 'C6' },
        { subject: 'Biology', grade: 'C6' },
        { subject: 'Chemistry', grade: 'C6' },
        { subject: 'Physics', grade: 'C6' },
      ]

  const initialSecondGrades = Array.isArray(applicant?.second_sitting_grades) && applicant.second_sitting_grades.length > 0
    ? applicant.second_sitting_grades
    : []

  const [hasSecondSitting, setHasSecondSitting] = useState(
    Boolean(applicant?.second_sitting_type || initialSecondGrades.length > 0)
  )

  const {
    data: formData,
    setData: setFormData,
    post: postEdit,
    processing: editProcessing,
    errors: editErrors
  } = useForm({
    // Personal Info
    full_name: applicant?.full_name || '',
    dob: applicant?.dob ? (typeof applicant.dob === 'string' ? applicant.dob.split('T')[0] : '') : '',
    place_of_birth: applicant?.place_of_birth || '',
    lga: applicant?.lga || '',
    state_of_origin: applicant?.state_of_origin || '',
    nationality: applicant?.nationality || 'Nigeria',
    email: applicant?.email || '',
    contact_address: applicant?.contact_address || '',
    phone_number: applicant?.phone_number || '',
    sex: applicant?.sex || 'Female',
    next_of_kin_name: applicant?.next_of_kin_name || '',
    next_of_kin_address: applicant?.next_of_kin_address || '',
    physical_disabilities: applicant?.physical_disabilities || 'None',
    highest_qualification: applicant?.highest_qualification || 'Senior Secondary School Certificate',
    jamb_score: applicant?.jamb_score ?? '',
    jamb_number: applicant?.jamb_number || '',

    // Program Choice
    applied_program_id: applicant?.applied_program_id || (programs[0]?.id ?? ''),

    // Parents & Sponsors
    parent_name: applicant?.parent_name || '',
    parent_address: applicant?.parent_address || '',
    parent_phone: applicant?.parent_phone || '',
    sponsor_name_address: applicant?.sponsor_name_address || '',

    // Schools Attended
    primary_school_name: applicant?.primary_school_name || '',
    primary_school_from: applicant?.primary_school_from || '',
    primary_school_to: applicant?.primary_school_to || '',
    secondary_school_name: applicant?.secondary_school_name || '',
    secondary_school_from: applicant?.secondary_school_from || '',
    secondary_school_to: applicant?.secondary_school_to || '',
    tertiary_school_name: applicant?.tertiary_school_name || '',
    tertiary_school_from: applicant?.tertiary_school_from || '',
    tertiary_school_to: applicant?.tertiary_school_to || '',

    // O'Levels Sitting 1
    first_sitting_type: applicant?.first_sitting_type || 'WAEC',
    first_sitting_year: applicant?.first_sitting_year || '2025',
    first_sitting_no: applicant?.first_sitting_no || '',
    first_sitting_grades: initialFirstGrades as Array<{ subject: string; grade: string }>,

    // O'Levels Sitting 2
    second_sitting_type: applicant?.second_sitting_type || '',
    second_sitting_year: applicant?.second_sitting_year || '',
    second_sitting_no: applicant?.second_sitting_no || '',
    second_sitting_grades: initialSecondGrades as Array<{ subject: string; grade: string }>,
  })

  // Subject helpers for Sitting 1
  const updateFirstGrade = (index: number, field: 'subject' | 'grade', value: string) => {
    const list = [...formData.first_sitting_grades]
    list[index][field] = value
    setFormData('first_sitting_grades', list)
  }

  const addFirstSubject = () => {
    setFormData('first_sitting_grades', [
      ...formData.first_sitting_grades,
      { subject: 'Civic Education', grade: 'C6' }
    ])
  }

  const removeFirstSubject = (index: number) => {
    const list = formData.first_sitting_grades.filter((_, i) => i !== index)
    setFormData('first_sitting_grades', list)
  }

  // Subject helpers for Sitting 2
  const updateSecondGrade = (index: number, field: 'subject' | 'grade', value: string) => {
    const list = [...formData.second_sitting_grades]
    list[index][field] = value
    setFormData('second_sitting_grades', list)
  }

  const addSecondSubject = () => {
    setFormData('second_sitting_grades', [
      ...formData.second_sitting_grades,
      { subject: 'English Language', grade: 'C6' }
    ])
  }

  const removeSecondSubject = (index: number) => {
    const list = formData.second_sitting_grades.filter((_, i) => i !== index)
    setFormData('second_sitting_grades', list)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicant?.id) return
    postEdit(route('admissions.edit.submit', applicant.id))
  }

  const [payingFee, setPayingFee] = useState(false)
  const handlePayFee = () => {
    if (!applicant?.id) return
    setPayingFee(true)
    router.post(route('admissions.edit.pay', applicant.id), {}, {
      onFinish: () => setPayingFee(false)
    })
  }

  const handleAuthorizeFee = () => {
    if (!applicant?.id) return
    router.post(route('admissions.edit.authorize', applicant.id))
  }

  const activeSectionCount = 5
  const [currentTab, setCurrentTab] = useState<'personal' | 'program' | 'schools' | 'parents' | 'olevels'>('personal')

  return (
    <>
      <Head title="Modify Application Details — ACONS Admissions" />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 shadow-sm h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/admissions/dashboard" className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-blue-100 shadow-sm">
            <img src="/assets/images/acons_logo.png" alt="ACONS" className="w-full h-full object-contain p-1" />
          </Link>
          <div>
            <span className="font-display font-black text-sm tracking-tight text-surface-900 block leading-none">
              AMEENATU COLLEGE OF NURSING SCIENCES
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 block mt-0.5">
              Application Data Modification Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {applicant ? (
            <Link 
              href="/admissions/status" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          ) : (
            <Link 
              href="/admissions/login" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Applicant Login
            </Link>
          )}
        </div>
      </nav>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="min-h-screen bg-surface-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* CASE 1: LOOKUP MODE (Find application by Phone, JAMB, or Email) */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {mode === 'lookup' && (
            <div className="max-w-md mx-auto bg-white rounded-3xl border border-surface-200 shadow-lg p-8 space-y-6 text-left">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Candidate Self-Service</span>
                <h2 className="text-2xl font-black text-surface-900 font-display">Find Your Application</h2>
                <p className="text-xs text-surface-500">
                  Enter your Phone Number, JAMB Number, or Email Address to access and modify your application.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-left">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-bold">Important Information:</p>
                  <p className="leading-relaxed">
                    You can modify any of your personal details, choice of program, schools attended, or O'Level examination grades before admission screening is finalized. An official <strong>₦2,000 modification fee</strong> applies.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLookupSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-700">Phone Number, JAMB Number, or Email</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 08031234567 or 2510283168AH or email@example.com"
                      value={lookupData.identifier}
                      onChange={(e) => setLookupData('identifier', e.target.value)}
                      className="w-full rounded-xl border-surface-300 text-sm pl-10 focus:border-blue-500 focus:ring-blue-500 py-3"
                    />
                    <User className="absolute left-3.5 top-3.5 text-surface-400" size={16} />
                  </div>
                  {lookupErrors.identifier && (
                    <p className="text-xs font-semibold text-danger-600 mt-1">{lookupErrors.identifier}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={lookupProcessing}
                  className="w-full py-3.5 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {lookupProcessing ? 'Searching Application...' : 'Find Application & Continue'}
                  <ChevronRight size={16} />
                </button>
              </form>

              <div className="pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
                <Link href="/admissions/login" className="hover:text-blue-600 font-semibold">
                  Applicant Portal Login
                </Link>
                <Link href="/admissions/apply" className="hover:text-blue-600 font-semibold">
                  New Application Form
                </Link>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* CASE 2: APPLICANT IS ALREADY ADMITTED (Locked state)            */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {mode === 'edit' && is_admitted && (
            <div className="bg-white rounded-3xl border border-surface-200 shadow-md p-8 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold font-display text-surface-900">Application Locked</h2>
              <p className="text-sm text-surface-600 leading-relaxed">
                Your admission offer has already been finalized and approved for <strong>{applicant?.full_name}</strong> (Reg/JAMB: {applicant?.jamb_number}).
                In accordance with college regulations, candidates who have been admitted cannot modify their registration details online.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/admissions/status"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Return to Dashboard
                </Link>
                <Link
                  href="/admissions/admission-letter/download"
                  className="px-5 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-800 rounded-xl font-semibold text-sm transition-colors"
                >
                  Download Admission Letter
                </Link>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* CASE 3: EDIT FEE REQUIRED (2,000 NGN)                           */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {mode === 'edit' && !is_admitted && !edit_fee_paid && (
            <div className="bg-white rounded-3xl border border-surface-200 shadow-lg overflow-hidden max-w-2xl mx-auto text-left">
              <div className="p-8 border-b border-surface-100 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                <span className="text-[10px] font-bold tracking-widest uppercase text-blue-200 block mb-1">
                  Step 1 of 2 · Official Clearance Fee
                </span>
                <h2 className="text-2xl font-black font-display tracking-tight">Application Data Modification Fee</h2>
                <p className="text-xs text-blue-100 mt-1">
                  Pay the statutory ₦2,000 modification fee to unlock and edit any part of your submitted application.
                </p>
              </div>

              <div className="p-8 space-y-6">
                {/* Applicant summary card */}
                <div className="bg-surface-50 rounded-2xl p-5 border border-surface-200 space-y-3">
                  <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">Candidate Identification</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-surface-400 block">Full Name</span>
                      <span className="font-bold text-surface-900">{applicant?.full_name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-surface-400 block">JAMB Registration Number</span>
                      <span className="font-mono font-bold text-surface-900">{applicant?.jamb_number}</span>
                    </div>
                    <div>
                      <span className="text-xs text-surface-400 block">Phone Number</span>
                      <span className="font-mono text-surface-800">{applicant?.phone_number}</span>
                    </div>
                    <div>
                      <span className="text-xs text-surface-400 block">Email Address</span>
                      <span className="text-surface-800">{applicant?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-surface-400 block">Current Program Choice</span>
                      <span className="font-semibold text-blue-700">{applicant?.applied_program?.name || 'General Nursing'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-surface-400 block">Screening Status</span>
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 uppercase">
                        {applicant?.admission_status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What can be modified */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-900 text-xs">
                  <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold block mb-1">Full Edit Permissions Unlocked:</span>
                    <p className="leading-relaxed text-emerald-800">
                      Once cleared, you can change your <strong>Personal Bio-Data</strong>, <strong>Choice of Program</strong>, <strong>Schools Attended</strong>, <strong>Parents/Sponsors</strong>, and <strong>O'Level Examination Sittings & Grades</strong>.
                    </p>
                  </div>
                </div>

                {/* Fee breakdown and action */}
                <div className="bg-blue-50/60 rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-surface-500 uppercase tracking-wider font-semibold block">Total Amount Payable</span>
                    <span className="text-3xl font-black font-display text-blue-900">₦2,000.00</span>
                    <span className="text-[11px] text-surface-500 block mt-0.5">Secure 256-bit encrypted checkout via ZainPay</span>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={payingFee}
                      onClick={handlePayFee}
                      className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard size={16} />
                      {payingFee ? 'Connecting to Gateway...' : 'Pay ₦2,000 via ZainPay'}
                    </button>

                    <button
                      type="button"
                      onClick={handleAuthorizeFee}
                      className="px-4 py-2 bg-white hover:bg-surface-100 text-surface-600 rounded-xl font-medium text-xs border border-surface-200 transition-colors"
                    >
                      Instant Authorize (Direct Demo Clearance)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* CASE 4: FORM UNLOCKED (Fee is paid, not admitted)               */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {mode === 'edit' && !is_admitted && edit_fee_paid && (
            <div className="bg-white rounded-3xl border border-surface-200 shadow-lg overflow-hidden text-left">
              {/* Header */}
              <div className="p-8 border-b border-surface-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <Unlock size={12} /> Modification Unlocked
                    </span>
                    <span className="text-xs text-surface-400">· Fee Paid</span>
                  </div>
                  <h2 className="text-2xl font-black font-display text-surface-900">Edit Application Details</h2>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Update any of your details below. Changes are saved directly to your official screening file.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={editProcessing}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <Save size={16} />
                  {editProcessing ? 'Saving Updates...' : 'Save All Changes'}
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-surface-200 bg-surface-50 px-8 flex gap-2 overflow-x-auto py-2">
                {[
                  { id: 'personal', label: '1. Personal Info', icon: User },
                  { id: 'program', label: '2. Program Choice', icon: GraduationCap },
                  { id: 'schools', label: '3. Schools Attended', icon: BookOpen },
                  { id: 'parents', label: '4. Parents & Sponsors', icon: Users },
                  { id: 'olevels', label: "5. O'Level Sittings", icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = currentTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCurrentTab(tab.id as any)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditSubmit} className="p-8 space-y-8">

                {/* ── Section 1: Personal Info ─────────────────────────── */}
                {currentTab === 'personal' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                      Personal Bio-Data & Identification
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-surface-700">Full Name (Surname First)</label>
                        <input
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData('full_name', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                        {editErrors.full_name && <p className="text-xs text-danger-600">{editErrors.full_name}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">JAMB Registration Number</label>
                        <input
                          type="text"
                          required
                          value={formData.jamb_number}
                          onChange={(e) => setFormData('jamb_number', e.target.value.toUpperCase())}
                          className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                        />
                        {editErrors.jamb_number && <p className="text-xs text-danger-600">{editErrors.jamb_number}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">JAMB UTME Score</label>
                        <input
                          type="number"
                          required
                          min={100}
                          max={400}
                          value={formData.jamb_score}
                          onChange={(e) => setFormData('jamb_score', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                        />
                        {editErrors.jamb_score && <p className="text-xs text-danger-600">{editErrors.jamb_score}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Date of Birth</label>
                        <input
                          type="date"
                          required
                          value={formData.dob}
                          onChange={(e) => setFormData('dob', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                        {editErrors.dob && <p className="text-xs text-danger-600">{editErrors.dob}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Gender / Sex</label>
                        <select
                          value={formData.sex}
                          onChange={(e) => setFormData('sex', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Phone Number (Account Password)</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone_number}
                          onChange={(e) => setFormData('phone_number', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                        />
                        {editErrors.phone_number && <p className="text-xs text-danger-600">{editErrors.phone_number}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Email Address</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData('email', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                        {editErrors.email && <p className="text-xs text-danger-600">{editErrors.email}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Place of Birth</label>
                        <input
                          type="text"
                          required
                          value={formData.place_of_birth}
                          onChange={(e) => setFormData('place_of_birth', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">State of Origin</label>
                        <select
                          value={formData.state_of_origin}
                          onChange={(e) => setFormData('state_of_origin', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        >
                          <option value="">Select State</option>
                          {NIGERIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Local Government Area (LGA)</label>
                        <input
                          type="text"
                          required
                          value={formData.lga}
                          onChange={(e) => setFormData('lga', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Nationality</label>
                        <input
                          type="text"
                          required
                          value={formData.nationality}
                          onChange={(e) => setFormData('nationality', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-surface-700">Contact / Residential Address</label>
                        <textarea
                          rows={2}
                          required
                          value={formData.contact_address}
                          onChange={(e) => setFormData('contact_address', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Next of Kin Name</label>
                        <input
                          type="text"
                          required
                          value={formData.next_of_kin_name}
                          onChange={(e) => setFormData('next_of_kin_name', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Physical Disabilities (if any)</label>
                        <input
                          type="text"
                          value={formData.physical_disabilities}
                          onChange={(e) => setFormData('physical_disabilities', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-surface-700">Next of Kin Full Address</label>
                        <textarea
                          rows={2}
                          required
                          value={formData.next_of_kin_address}
                          onChange={(e) => setFormData('next_of_kin_address', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentTab('program')}
                        className="px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                      >
                        Next: Choice of Program →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Section 2: Program Choice ────────────────────────── */}
                {currentTab === 'program' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                      Academic Programme Selection
                    </h3>

                    <div className="space-y-4 max-w-xl">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Choose Programme to Apply For</label>
                        <select
                          value={formData.applied_program_id}
                          onChange={(e) => setFormData('applied_program_id', Number(e.target.value))}
                          className="w-full rounded-xl border-surface-300 text-sm font-medium focus:border-blue-500 py-3"
                        >
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.degree_type ? `(${p.degree_type})` : ''} — {p.duration_years || 3} Years
                            </option>
                          ))}
                        </select>
                        {editErrors.applied_program_id && (
                          <p className="text-xs text-danger-600">{editErrors.applied_program_id}</p>
                        )}
                      </div>

                      <p className="text-xs text-surface-500 bg-surface-50 p-4 rounded-xl border border-surface-200 leading-relaxed">
                        Notice: Changing your programme choice will automatically update your screening evaluation batch and department allocation for the upcoming academic session.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentTab('personal')}
                        className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"
                      >
                        ← Back to Personal
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('schools')}
                        className="px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                      >
                        Next: Schools Attended →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Section 3: Schools Attended ──────────────────────── */}
                {currentTab === 'schools' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                      Educational History & Schools Attended
                    </h3>

                    {/* Primary */}
                    <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 space-y-3">
                      <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider">Primary Education</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">Primary School Name</label>
                          <input
                            type="text"
                            required
                            value={formData.primary_school_name}
                            onChange={(e) => setFormData('primary_school_name', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">From Year</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2012"
                            value={formData.primary_school_from}
                            onChange={(e) => setFormData('primary_school_from', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">To Year</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2018"
                            value={formData.primary_school_to}
                            onChange={(e) => setFormData('primary_school_to', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Secondary */}
                    <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 space-y-3">
                      <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider">Secondary Education</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">Secondary School Name</label>
                          <input
                            type="text"
                            required
                            value={formData.secondary_school_name}
                            onChange={(e) => setFormData('secondary_school_name', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">From Year</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2018"
                            value={formData.secondary_school_from}
                            onChange={(e) => setFormData('secondary_school_from', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">To Year</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2024"
                            value={formData.secondary_school_to}
                            onChange={(e) => setFormData('secondary_school_to', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tertiary (optional) */}
                    <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 space-y-3">
                      <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider">Tertiary Institution (Optional)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">Tertiary Institution Name</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={formData.tertiary_school_name}
                            onChange={(e) => setFormData('tertiary_school_name', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">From Year</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={formData.tertiary_school_from}
                            onChange={(e) => setFormData('tertiary_school_from', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">To Year</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={formData.tertiary_school_to}
                            onChange={(e) => setFormData('tertiary_school_to', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentTab('program')}
                        className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"
                      >
                        ← Back to Program
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('parents')}
                        className="px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                      >
                        Next: Parents & Sponsors →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Section 4: Parents & Sponsors ────────────────────── */}
                {currentTab === 'parents' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                      Parents & Sponsor Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Parent / Guardian Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.parent_name}
                          onChange={(e) => setFormData('parent_name', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-700">Parent / Guardian Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={formData.parent_phone}
                          onChange={(e) => setFormData('parent_phone', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-surface-700">Parent / Guardian Residential Address</label>
                        <textarea
                          rows={2}
                          required
                          value={formData.parent_address}
                          onChange={(e) => setFormData('parent_address', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-surface-700">Sponsor Name & Address</label>
                        <textarea
                          rows={2}
                          required
                          value={formData.sponsor_name_address}
                          onChange={(e) => setFormData('sponsor_name_address', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentTab('schools')}
                        className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"
                      >
                        ← Back to Schools
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('olevels')}
                        className="px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                      >
                        Next: O'Level Sittings →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Section 5: O'Level Sittings ──────────────────────── */}
                {currentTab === 'olevels' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">
                        O'Level Examination Qualifications
                      </h3>
                      <p className="text-xs text-surface-500 mt-1">
                        Enter your verified WAEC, NECO, or NABTEB results (credit passes in English, Mathematics, Biology, Chemistry, and Physics are required).
                      </p>
                    </div>

                    {/* Sitting 1 */}
                    <div className="p-5 bg-surface-50 rounded-2xl border border-surface-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          First Sitting Examination
                        </h4>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Primary Sitting
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">Exam Body / Type</label>
                          <select
                            value={formData.first_sitting_type}
                            onChange={(e) => setFormData('first_sitting_type', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                          >
                            <option value="WAEC">WAEC (WASSCE)</option>
                            <option value="NECO">NECO (SSCE)</option>
                            <option value="NABTEB">NABTEB</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">Exam Year</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2024"
                            value={formData.first_sitting_year}
                            onChange={(e) => setFormData('first_sitting_year', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-surface-600">Examination Number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 4120892011"
                            value={formData.first_sitting_no}
                            onChange={(e) => setFormData('first_sitting_no', e.target.value)}
                            className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Grades mapping */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-surface-700 uppercase">Subjects & Grades</label>
                          <button
                            type="button"
                            onClick={addFirstSubject}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                          >
                            <Plus size={13} /> Add Subject
                          </button>
                        </div>

                        <div className="space-y-2">
                          {formData.first_sitting_grades.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <select
                                value={item.subject}
                                onChange={(e) => updateFirstGrade(idx, 'subject', e.target.value)}
                                className="flex-1 rounded-xl border-surface-300 text-xs focus:border-blue-500 py-2"
                              >
                                {SUBJECTS_LIST.map((sub) => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>

                              <select
                                value={item.grade}
                                onChange={(e) => updateFirstGrade(idx, 'grade', e.target.value)}
                                className="w-24 rounded-xl border-surface-300 text-xs font-bold focus:border-blue-500 py-2"
                              >
                                {GRADES_LIST.map((gr) => (
                                  <option key={gr} value={gr}>{gr}</option>
                                ))}
                              </select>

                              {formData.first_sitting_grades.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFirstSubject(idx)}
                                  className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Second Sitting Toggle */}
                    <div className="pt-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasSecondSitting}
                          onChange={(e) => {
                            setHasSecondSitting(e.target.checked)
                            if (e.target.checked && formData.second_sitting_grades.length === 0) {
                              setFormData('second_sitting_grades', [
                                { subject: 'English Language', grade: 'C6' },
                                { subject: 'Mathematics', grade: 'C6' },
                              ])
                              setFormData('second_sitting_type', 'NECO')
                              setFormData('second_sitting_year', '2025')
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-surface-800">
                          I have a Second Sitting to combine (WAEC / NECO / NABTEB)
                        </span>
                      </label>
                    </div>

                    {/* Sitting 2 Container */}
                    {hasSecondSitting && (
                      <div className="p-5 bg-surface-50 rounded-2xl border border-surface-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                            Second Sitting Examination (Combined)
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-surface-600">Exam Body / Type</label>
                            <select
                              value={formData.second_sitting_type}
                              onChange={(e) => setFormData('second_sitting_type', e.target.value)}
                              className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                            >
                              <option value="WAEC">WAEC (WASSCE)</option>
                              <option value="NECO">NECO (SSCE)</option>
                              <option value="NABTEB">NABTEB</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-surface-600">Exam Year</label>
                            <input
                              type="text"
                              placeholder="e.g. 2025"
                              value={formData.second_sitting_year}
                              onChange={(e) => setFormData('second_sitting_year', e.target.value)}
                              className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-surface-600">Examination Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 509201928"
                              value={formData.second_sitting_no}
                              onChange={(e) => setFormData('second_sitting_no', e.target.value)}
                              className="w-full rounded-xl border-surface-300 text-sm font-mono focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Sitting 2 Grades */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-surface-700 uppercase">Subjects & Grades</label>
                            <button
                              type="button"
                              onClick={addSecondSubject}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                            >
                              <Plus size={13} /> Add Subject
                            </button>
                          </div>

                          <div className="space-y-2">
                            {formData.second_sitting_grades.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <select
                                  value={item.subject}
                                  onChange={(e) => updateSecondGrade(idx, 'subject', e.target.value)}
                                  className="flex-1 rounded-xl border-surface-300 text-xs focus:border-blue-500 py-2"
                                >
                                  {SUBJECTS_LIST.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>

                                <select
                                  value={item.grade}
                                  onChange={(e) => updateSecondGrade(idx, 'grade', e.target.value)}
                                  className="w-24 rounded-xl border-surface-300 text-xs font-bold focus:border-blue-500 py-2"
                                >
                                  {GRADES_LIST.map((gr) => (
                                    <option key={gr} value={gr}>{gr}</option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => removeSecondSubject(idx)}
                                  className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Final Save Action */}
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                      <div>
                        <span className="font-bold text-sm text-blue-900 block">Ready to apply changes?</span>
                        <span className="text-xs text-blue-700 block">
                          Saving will update your official application record, CBT exam schedule, and department screening profile.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={editProcessing}
                        className="w-full sm:w-auto px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        {editProcessing ? 'Saving Updates...' : 'Save & Update Application'}
                      </button>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentTab('parents')}
                        className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl text-xs font-semibold hover:bg-surface-200"
                      >
                        ← Back to Parents & Sponsors
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
