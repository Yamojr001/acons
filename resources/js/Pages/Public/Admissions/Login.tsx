import React from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { User, Lock, AlertCircle } from 'lucide-react'

interface LoginProps {
  tenant: any
}

export default function Login({ tenant }: LoginProps) {
  const { data, setData, post, processing, errors } = useForm({
    jamb_number: '',
    phone_number: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('admissions.login.submit'))
  }

  return (
    <>
      <Head title="Applicant Clearance Portal Login — ACONS" />

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
        <div className="max-w-md w-full space-y-6">

          <div className="bg-white rounded-3xl border border-surface-200 shadow-lg overflow-hidden">
            
            {/* Header branding */}
            <div className="p-8 pb-4 text-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Track Admission Process</span>
              <h2 className="text-2xl font-black text-surface-900 font-display mt-2">Applicant Clearance Portal</h2>
              <p className="text-xs text-surface-500 mt-1">Sign in to check your screening evaluation and download official slips.</p>
            </div>

            {/* Instruction Warning banner */}
            <div className="mx-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-2 text-left">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">Credentials Help</span>
                <span className="text-[10px] text-blue-700 leading-relaxed block">
                  Your **Username** is your **JAMB Registration Number**.<br />
                  Your **Password** is the **Phone Number** you submitted in the application form (e.g. `08036894451`).
                </span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5 text-left">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-surface-700">JAMB Registration Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. 2510283168AH"
                    required
                    value={data.jamb_number}
                    onChange={(e)=>setData('jamb_number', e.target.value)}
                    className="w-full rounded-xl border-surface-300 text-sm pl-9 focus:border-blue-500" 
                  />
                  <User className="absolute left-3 top-3.5 text-surface-400" size={14} />
                </div>
                {errors.jamb_number && <p className="text-xs font-semibold text-danger-600">{errors.jamb_number}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-surface-700">Phone Number (Password)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="e.g. 08036894451"
                    required
                    value={data.phone_number}
                    onChange={(e)=>setData('phone_number', e.target.value)}
                    className="w-full rounded-xl border-surface-300 text-sm pl-9 focus:border-blue-500" 
                  />
                  <Lock className="absolute left-3 top-3.5 text-surface-400" size={14} />
                </div>
                {errors.phone_number && <p className="text-xs font-semibold text-danger-600">{errors.phone_number}</p>}
              </div>

              <button 
                type="submit"
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold text-sm shadow-md transition-colors"
              >
                {processing ? 'Signing In...' : 'Sign In & Track Clearance'}
              </button>

            </form>

          </div>

          {/* Footer apply redirect links */}
          <div className="text-center text-xs text-surface-400 font-semibold space-y-1">
            <p>Haven't submitted an ACONS application form yet?</p>
            <Link 
              href={route('admissions.apply')}
              className="text-blue-600 hover:underline font-bold"
            >
              Apply Online Now & Pay Form Fee (N14,700) →
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
