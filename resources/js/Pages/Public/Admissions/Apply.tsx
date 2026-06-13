import React, { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, ChevronLeft, CheckCircle, 
  User, BookOpen, GraduationCap, Users, ShieldAlert, Sparkles
} from 'lucide-react'

interface ApplyProps {
  tenant: any
  programs: any[]
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

export default function Apply({ tenant, programs }: ApplyProps) {
  const [step, setStep] = useState(1)
  const [hasReadSectionA, setHasReadSectionA] = useState(false)

  const { data, setData, post, processing, errors } = useForm({
    // Step 1: Personal Info
    full_name: '',
    dob: '',
    place_of_birth: '',
    lga: '',
    state_of_origin: '',
    nationality: 'Nigeria',
    email: '',
    contact_address: '',
    phone_number: '',
    sex: 'Female',
    next_of_kin_name: '',
    next_of_kin_address: '',
    physical_disabilities: 'None',
    highest_qualification: 'Senior Secondary School Certificate',
    jamb_score: '',
    jamb_number: '',

    // Step 2: Schools Attended
    primary_school_name: '',
    primary_school_from: '',
    primary_school_to: '',
    secondary_school_name: '',
    secondary_school_from: '',
    secondary_school_to: '',
    tertiary_school_name: '',
    tertiary_school_from: '',
    tertiary_school_to: '',

    // Step 3: Parents & Sponsors
    parent_name: '',
    parent_address: '',
    parent_phone: '',
    sponsor_name_address: '',

    // Step 4: O'Levels Sitting 1
    first_sitting_type: 'NECO',
    first_sitting_year: '2025',
    first_sitting_no: '',
    first_sitting_grades: [
      { subject: 'English Language', grade: 'C6' },
      { subject: 'Mathematics', grade: 'B3' },
      { subject: 'Biology', grade: 'C6' },
      { subject: 'Chemistry', grade: 'D7' },
      { subject: 'Physics', grade: 'C5' },
    ] as Array<{ subject: string; grade: string }>,

    // O'Levels Sitting 2 (Optional)
    second_sitting_type: '',
    second_sitting_year: '',
    second_sitting_no: '',
    second_sitting_grades: [] as Array<{ subject: string; grade: string }>,

    // Declaration Signature Name
    declaration_signature: ''
  })

  // Grade helper sitting 1
  const handleGradeChange1 = (index: number, field: 'subject' | 'grade', value: string) => {
    const updated = [...data.first_sitting_grades]
    updated[index][field] = value
    setData('first_sitting_grades', updated)
  }

  const addSubjectRow1 = () => {
    setData('first_sitting_grades', [...data.first_sitting_grades, { subject: 'Civic Education', grade: 'C6' }])
  }

  const removeSubjectRow1 = (index: number) => {
    const updated = data.first_sitting_grades.filter((_, i) => i !== index)
    setData('first_sitting_grades', updated)
  }

  // Grade helper sitting 2
  const handleGradeChange2 = (index: number, field: 'subject' | 'grade', value: string) => {
    const updated = [...data.second_sitting_grades]
    updated[index][field] = value
    setData('second_sitting_grades', updated)
  }

  const addSubjectRow2 = () => {
    setData('second_sitting_grades', [...data.second_sitting_grades, { subject: 'English Language', grade: 'C6' }])
  }

  const removeSubjectRow2 = (index: number) => {
    const updated = data.second_sitting_grades.filter((_, i) => i !== index)
    setData('second_sitting_grades', updated)
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('admissions.apply.submit'))
  }

  return (
    <>
      <Head title="Official Admission Application Form — ACONS" />

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
        <Link 
          href={route('admissions.login')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
        >
          Track Admission Process
        </Link>
      </nav>

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <div className="min-h-screen bg-surface-50 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          
          {!hasReadSectionA ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 md:p-12 border border-surface-200 shadow-xl space-y-8 text-left"
            >
              <div className="text-center pb-6 border-b border-surface-200 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden flex items-center justify-center bg-white border border-blue-100 shadow-md">
                  <img src="/assets/images/acons_logo.png" alt="ACONS" className="w-full h-full object-contain p-2" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Entry Guidelines Criteria</span>
                <h2 className="text-2xl md:text-3xl font-black text-surface-900 font-display">SECTION A: GENERAL ADMISSION CRITERIA</h2>
                <p className="text-xs text-surface-400 max-w-md mx-auto">
                  Please review the minimum eligibility guidelines for Ameenatu College of Nursing Sciences (ACONS) before proceeding.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/80 space-y-4">
                  <h3 className="font-bold text-sm text-blue-800 flex items-center gap-1.5"><Sparkles className="text-blue-600" size={16} /> Minimum Academic Qualifications:</h3>
                  <ul className="list-disc pl-5 text-xs text-blue-900 space-y-3 leading-relaxed font-semibold">
                    <li>A minimum of <strong>Five (5) O'Level Credits</strong> in English Language, Mathematics, Physics, Chemistry, and Biology.</li>
                    <li>These credits must be earned at <strong>Not more than two (2) sittings</strong> in NECO, WAEC, NABTEB, or NBAIS examinations.</li>
                    <li>Applicants must have sat for the Unified Tertiary Matriculation Examination (JAMB) with a minimum score of <strong>150</strong> or above.</li>
                  </ul>
                </div>

                <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200 space-y-4">
                  <h3 className="font-bold text-sm text-surface-800 flex items-center gap-1.5"><ShieldAlert className="text-red-500" size={16} /> Key Portal Instructions:</h3>
                  <ul className="list-disc pl-5 text-xs text-surface-600 space-y-3 leading-relaxed font-medium">
                    <li>Upon completing the form steps, a non-refundable application screening fee of <strong>₦14,700</strong> must be paid.</li>
                    <li>Your account credentials to track your status will be your <strong>JAMB Registration Number</strong> (Username) and your <strong>Phone Number</strong> (Password).</li>
                    <li>Any false information declared on this form will lead to immediate withdrawal of admission at any point.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHasReadSectionA(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 hover:shadow-xl font-bold text-sm transition-all"
                >
                  <span>Accept Eligibility & Proceed to Form</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header Title */}
              <div className="text-center mb-10 space-y-2">
                <h1 className="text-3xl font-display font-black text-surface-900">ACONS Admission Application Form</h1>
                <p className="text-sm text-surface-500 max-w-lg mx-auto">
                  Please fill all required academic rosters, O'level sittings, and guardian information below accurately.
                </p>
              </div>

              {/* Steps indicator bar */}
          <div className="bg-white rounded-3xl p-6 border border-surface-200 mb-8 shadow-sm">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 h-1 bg-surface-200 -z-10 rounded-full" />
              <div 
                className="absolute left-0 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />

              {[
                { s: 1, label: 'Personal Data', icon: <User size={16} /> },
                { s: 2, label: 'Schools Attended', icon: <GraduationCap size={16} /> },
                { s: 3, label: 'Parents & Sponsors', icon: <Users size={16} /> },
                { s: 4, label: 'O\'Levels Sittings', icon: <BookOpen size={16} /> }
              ].map((item) => (
                <div key={item.s} className="flex flex-col items-center gap-1 bg-white px-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    step >= item.s 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-surface-200 text-surface-400'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight hidden sm:block ${
                    step >= item.s ? 'text-blue-600' : 'text-surface-400'
                  }`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-surface-200 shadow-md space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-6 text-left">
                    <h3 className="text-base font-bold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
                      <User className="text-blue-600" size={18} /> A. PERSONAL DATA
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Applicant Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={data.full_name} 
                          onChange={(e) => setData('full_name', e.target.value)}
                          placeholder="e.g. Nafisa Lawan"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500 focus:ring-blue-500" 
                        />
                        {errors.full_name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.full_name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Date of Birth</label>
                        <input 
                          type="date" 
                          required
                          value={data.dob} 
                          onChange={(e) => setData('dob', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        />
                        {errors.dob && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.dob}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Sex/Gender</label>
                        <select 
                          value={data.sex} 
                          onChange={(e) => setData('sex', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                        </select>
                        {errors.sex && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.sex}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Place of Birth</label>
                        <input 
                          type="text" 
                          required
                          value={data.place_of_birth} 
                          onChange={(e) => setData('place_of_birth', e.target.value)}
                          placeholder="e.g. Kanya Babba"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.place_of_birth && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.place_of_birth}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">State of Origin</label>
                        <select 
                          value={data.state_of_origin} 
                          onChange={(e) => setData('state_of_origin', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500"
                        >
                          <option value="">-- Choose State --</option>
                          {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.state_of_origin && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.state_of_origin}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">LGA of Origin</label>
                        <input 
                          type="text" 
                          required
                          value={data.lga} 
                          onChange={(e) => setData('lga', e.target.value)}
                          placeholder="e.g. Babura"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.lga && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.lga}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Nationality</label>
                        <input 
                          type="text" 
                          required
                          value={data.nationality} 
                          onChange={(e) => setData('nationality', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.nationality && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.nationality}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={data.email} 
                          onChange={(e) => setData('email', e.target.value)}
                          placeholder="e.g. nafisa@gmail.com"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Phone Number</label>
                        <input 
                          type="tel" 
                          required
                          value={data.phone_number} 
                          onChange={(e) => setData('phone_number', e.target.value)}
                          placeholder="e.g. 08036894451"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.phone_number && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.phone_number}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Contact Address</label>
                        <textarea 
                          rows={2}
                          required
                          value={data.contact_address} 
                          onChange={(e) => setData('contact_address', e.target.value)}
                          placeholder="e.g. Kanya Kofar Fada House No: 05"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.contact_address && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.contact_address}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Physical Disabilities (if any, state 'None' if none)</label>
                        <textarea 
                          rows={2}
                          required
                          value={data.physical_disabilities} 
                          onChange={(e) => setData('physical_disabilities', e.target.value)}
                          placeholder="State any visual/mobility impairments or write 'None'"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.physical_disabilities && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.physical_disabilities}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Highest Educational Qualification</label>
                        <select 
                          value={data.highest_qualification} 
                          onChange={(e) => setData('highest_qualification', e.target.value)}
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        >
                          <option value="Senior Secondary School Certificate">Senior Secondary School Certificate (SSCE / NECO)</option>
                          <option value="National Diploma (ND)">National Diploma (ND)</option>
                          <option value="Higher National Diploma (HND)">Higher National Diploma (HND)</option>
                          <option value="Bachelor Degree (B.Sc)">Bachelor Degree (B.Sc)</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.highest_qualification && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.highest_qualification}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">JAMB Registration Number</label>
                        <input 
                          type="text" 
                          required
                          value={data.jamb_number} 
                          onChange={(e) => setData('jamb_number', e.target.value)}
                          placeholder="e.g. 2510283168AH"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.jamb_number && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.jamb_number}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">JAMB UTME Score</label>
                        <input 
                          type="number" 
                          required
                          value={data.jamb_score} 
                          onChange={(e) => setData('jamb_score', e.target.value)}
                          placeholder="e.g. 152"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.jamb_score && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.jamb_score}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-100">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Next of Kin Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={data.next_of_kin_name} 
                          onChange={(e) => setData('next_of_kin_name', e.target.value)}
                          placeholder="e.g. Malam Nafisatu Ibrahim Hashim"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.next_of_kin_name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.next_of_kin_name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Next of Kin Address</label>
                        <input 
                          type="text" 
                          required
                          value={data.next_of_kin_address} 
                          onChange={(e) => setData('next_of_kin_address', e.target.value)}
                          placeholder="e.g. Kanya Kofar Fada House No: 05"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                        {errors.next_of_kin_address && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.next_of_kin_address}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 text-left">
                    <h3 className="text-base font-bold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
                      <GraduationCap className="text-blue-600" size={18} /> B. SCHOOLS ATTENDED WITH DATES
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pb-4 border-b border-surface-100">
                      <div className="md:col-span-3"><span className="text-sm font-bold text-blue-700">I. Primary School Details</span></div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Primary School Name</label>
                        <input 
                          type="text" 
                          required
                          value={data.primary_school_name} 
                          onChange={(e) => setData('primary_school_name', e.target.value)}
                          placeholder="e.g. Kanya Primary School"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">From (Year)</label>
                          <input type="text" placeholder="2013" required value={data.primary_school_from} onChange={(e) => setData('primary_school_from', e.target.value)} className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">To (Year)</label>
                          <input type="text" placeholder="2019" required value={data.primary_school_to} onChange={(e) => setData('primary_school_to', e.target.value)} className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pb-4 border-b border-surface-100">
                      <div className="md:col-span-3"><span className="text-sm font-bold text-blue-700">II. Secondary School Details</span></div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Secondary School Name</label>
                        <input 
                          type="text" 
                          required
                          value={data.secondary_school_name} 
                          onChange={(e) => setData('secondary_school_name', e.target.value)}
                          placeholder="e.g. Government Girls Secondary School Babura"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">From (Year)</label>
                          <input type="text" placeholder="2019" required value={data.secondary_school_from} onChange={(e) => setData('secondary_school_from', e.target.value)} className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">To (Year)</label>
                          <input type="text" placeholder="2025" required value={data.secondary_school_to} onChange={(e) => setData('secondary_school_to', e.target.value)} className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div className="md:col-span-3"><span className="text-sm font-bold text-blue-700">III. Tertiary Institution (Optional)</span></div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Tertiary School Name</label>
                        <input 
                          type="text" 
                          value={data.tertiary_school_name} 
                          onChange={(e) => setData('tertiary_school_name', e.target.value)}
                          placeholder="e.g. Jigawa State College of Education (if any)"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">From (Year)</label>
                          <input type="text" placeholder="e.g. 2023" value={data.tertiary_school_from} onChange={(e) => setData('tertiary_school_from', e.target.value)} className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">To (Year)</label>
                          <input type="text" placeholder="e.g. 2025" value={data.tertiary_school_to} onChange={(e) => setData('tertiary_school_to', e.target.value)} className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 text-left">
                    <h3 className="text-base font-bold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
                      <Users className="text-blue-600" size={18} /> C. PARENTS, GUARDIAN & SPONSOR CONTACT
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Father / Mother / Guardian Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={data.parent_name} 
                          onChange={(e) => setData('parent_name', e.target.value)}
                          placeholder="e.g. Hon. Ibrahim Hashim Kanya Babba"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Parent Phone Number</label>
                        <input 
                          type="tel" 
                          required
                          value={data.parent_phone} 
                          onChange={(e) => setData('parent_phone', e.target.value)}
                          placeholder="e.g. 08036894451"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Parent / Guardian Address</label>
                        <textarea 
                          rows={2}
                          required
                          value={data.parent_address} 
                          onChange={(e) => setData('parent_address', e.target.value)}
                          placeholder="e.g. Kanya Babba Kofar Fada House No: 05"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Sponsor Name & Full Contact Address</label>
                        <textarea 
                          rows={2}
                          required
                          value={data.sponsor_name_address} 
                          onChange={(e) => setData('sponsor_name_address', e.target.value)}
                          placeholder="e.g. Hon. Ibrahim Hashim Kanya Kofar Fada House No: 05"
                          className="w-full rounded-xl border-surface-300 text-sm focus:border-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6 text-left">
                    <h3 className="text-base font-bold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
                      <BookOpen className="text-blue-600" size={18} /> D. O'LEVELS SITTINGS
                    </h3>

                    {/* First Sitting */}
                    <div className="bg-surface-50 p-6 rounded-3xl border border-surface-200 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">First Sitting (Mandatory)</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <select 
                            value={data.first_sitting_type} 
                            onChange={(e) => setData('first_sitting_type', e.target.value)}
                            className="rounded-lg border-surface-200 text-xs py-1"
                          >
                            <option value="NECO">NECO</option>
                            <option value="WAEC">WAEC</option>
                            <option value="NABTEB">NABTEB</option>
                            <option value="NBAIS">NBAIS</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder="Year" 
                            value={data.first_sitting_year} 
                            onChange={(e) => setData('first_sitting_year', e.target.value)}
                            className="w-16 rounded-lg border-surface-200 text-xs py-1 text-center" 
                          />
                          <input 
                            type="text" 
                            placeholder="Exam Reg No" 
                            value={data.first_sitting_no} 
                            onChange={(e) => setData('first_sitting_no', e.target.value)}
                            className="w-32 rounded-lg border-surface-200 text-xs py-1 text-center font-mono" 
                          />
                        </div>
                      </div>

                      <div className="border border-surface-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-surface-100 border-b border-surface-200 text-surface-700 font-bold">
                            <tr>
                              <th className="px-4 py-2 text-left">O'Level Subject</th>
                              <th className="px-4 py-2 text-left">Grade</th>
                              <th className="px-4 py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.first_sitting_grades.map((row, index) => (
                              <tr key={index} className="border-b border-surface-100 last:border-0">
                                <td className="px-4 py-1.5">
                                  <select 
                                    value={row.subject} 
                                    onChange={(e) => handleGradeChange1(index, 'subject', e.target.value)}
                                    className="rounded-lg border-surface-200 text-xs py-1 w-full max-w-xs"
                                  >
                                    {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-1.5">
                                  <select 
                                    value={row.grade} 
                                    onChange={(e) => handleGradeChange1(index, 'grade', e.target.value)}
                                    className="rounded-lg border-surface-200 text-xs py-1"
                                  >
                                    {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-1.5 text-right">
                                  <button type="button" onClick={() => removeSubjectRow1(index)} className="text-xs text-danger-600 font-bold">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-3 bg-surface-50/50 border-t border-surface-200 text-left">
                          <button type="button" onClick={addSubjectRow1} className="text-xs font-bold text-blue-600 hover:text-blue-700">+ Add Subject Row</button>
                        </div>
                      </div>
                    </div>

                    {/* Second Sitting (Optional Toggle) */}
                    <div className="bg-surface-50 p-6 rounded-3xl border border-surface-200 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">Second Sitting (Optional)</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              if (data.second_sitting_grades.length > 0) {
                                setData(d => ({ ...d, second_sitting_grades: [], second_sitting_type: '', second_sitting_year: '', second_sitting_no: '' }))
                              } else {
                                setData(d => ({ ...d, second_sitting_grades: [{ subject: 'English Language', grade: 'C6' }], second_sitting_type: 'NECO', second_sitting_year: '2025', second_sitting_no: '' }))
                              }
                            }}
                            className="text-[10px] bg-white border border-surface-200 px-2 py-0.5 rounded font-bold text-surface-600"
                          >
                            {data.second_sitting_grades.length > 0 ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        {data.second_sitting_grades.length > 0 && (
                          <div className="flex flex-wrap items-center gap-3">
                            <select 
                              value={data.second_sitting_type} 
                              onChange={(e) => setData('second_sitting_type', e.target.value)}
                              className="rounded-lg border-surface-200 text-xs py-1"
                            >
                              <option value="NECO">NECO</option>
                              <option value="WAEC">WAEC</option>
                              <option value="NABTEB">NABTEB</option>
                              <option value="NBAIS">NBAIS</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="Year" 
                              value={data.second_sitting_year} 
                              onChange={(e) => setData('second_sitting_year', e.target.value)}
                              className="w-16 rounded-lg border-surface-200 text-xs py-1 text-center" 
                            />
                            <input 
                              type="text" 
                              placeholder="Exam Reg No" 
                              value={data.second_sitting_no} 
                              onChange={(e) => setData('second_sitting_no', e.target.value)}
                              className="w-32 rounded-lg border-surface-200 text-xs py-1 text-center font-mono" 
                            />
                          </div>
                        )}
                      </div>

                      {data.second_sitting_grades.length > 0 && (
                        <div className="border border-surface-200 rounded-2xl overflow-hidden bg-white">
                          <table className="w-full text-xs">
                            <thead className="bg-surface-100 border-b border-surface-200 text-surface-700 font-bold">
                              <tr>
                                <th className="px-4 py-2 text-left">O'Level Subject</th>
                                <th className="px-4 py-2 text-left">Grade</th>
                                <th className="px-4 py-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.second_sitting_grades.map((row, index) => (
                                <tr key={index} className="border-b border-surface-100 last:border-0">
                                  <td className="px-4 py-1.5">
                                    <select 
                                      value={row.subject} 
                                      onChange={(e) => handleGradeChange2(index, 'subject', e.target.value)}
                                      className="rounded-lg border-surface-200 text-xs py-1 w-full max-w-xs"
                                    >
                                      {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-4 py-1.5">
                                    <select 
                                      value={row.grade} 
                                      onChange={(e) => handleGradeChange2(index, 'grade', e.target.value)}
                                      className="rounded-lg border-surface-200 text-xs py-1"
                                    >
                                      {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-4 py-1.5 text-right">
                                    <button type="button" onClick={() => removeSubjectRow2(index)} className="text-xs text-danger-600 font-bold">Remove</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 bg-surface-50/50 border-t border-surface-200 text-left">
                            <button type="button" onClick={addSubjectRow2} className="text-xs font-bold text-blue-600 hover:text-blue-700">+ Add Subject Row</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Declaration Warning Card */}
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 flex flex-col gap-4 text-left">
                      <div className="flex gap-3">
                        <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-amber-800 font-display">F. APPLICANT DECLARATION & SIGNATURE</h4>
                          <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            I hereby declare that the information provided on this form is to the best of my knowledge correct. If at any time the school is satisfied that any of the information I have given on this form is false or incorrect, my admission would be immediately withdrawn.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-amber-200 pt-4">
                        <label className="text-xs font-bold text-amber-950 block">Type your Full Name to sign this declaration:</label>
                        <input 
                          type="text" 
                          placeholder="Type your exact full name (e.g. NAFISA LAWAN)"
                          required
                          value={data.declaration_signature} 
                          onChange={(e) => setData('declaration_signature', e.target.value)}
                          className="w-full rounded-xl border-amber-300 text-sm focus:border-amber-500 focus:ring-amber-500 bg-white placeholder-amber-600/30 text-amber-900 font-medium" 
                        />
                        {data.declaration_signature && data.declaration_signature.trim().toLowerCase() !== data.full_name.trim().toLowerCase() && (
                          <p className="text-[11px] font-semibold text-danger-600">Note: Signature name should match your applicant full name above ("{data.full_name}").</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Stepper Buttons navigation */}
            <div className="flex justify-between items-center border-t border-surface-200 pt-6">
              {step > 1 ? (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors font-bold text-xs"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors font-bold text-xs"
                >
                  Next Step <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 transition-all font-bold text-sm"
                >
                  {processing ? 'Submitting...' : 'Proceed to Fee Payment (N14,700)'} <CheckCircle size={16} />
                </button>
              )}
            </div>
          </form>
          </>
          )}

        </div>
      </div>
    </>
  )
}
