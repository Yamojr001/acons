import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Check, X } from 'lucide-react'
import { Card, Button } from '@/Components/UI'
import { useState, useEffect } from 'react'

export default function ForcePasswordChange() {
  const { data, setData, post, processing, errors } = useForm({
    password: '',
    password_confirmation: ''
  })

  // Local state to display checklist validation rules dynamically
  const [rules, setRules] = useState({
    min: false,
    mixed: false,
    number: false,
    symbol: false,
  })

  useEffect(() => {
    const p = data.password;
    setRules({
      min: p.length >= 8,
      mixed: /[a-z]/.test(p) && /[A-Z]/.test(p),
      number: /[0-9]/.test(p),
      symbol: /[^a-zA-Z0-9]/.test(p)
    })
  }, [data.password])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('student.password.force.post'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Head title="Secure Your Account" />

      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-success-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border border-surface-100 p-8 bg-white/80 backdrop-blur-md rounded-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Secure Your Account</h2>
            <p className="text-sm text-surface-500 mt-2">
              This is your first login. To secure your account, you must update your temporary password to a strong one.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              {errors.password_confirmation && <p className="text-xs text-danger-500 mt-1">{errors.password_confirmation}</p>}
            </div>

            {/* Validation Checklist */}
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-100 space-y-2 mt-4">
              <p className="text-[10px] uppercase font-bold text-surface-400 mb-2">Password Requirements Checklist</p>
              
              <div className="flex items-center gap-2 text-xs font-medium">
                {rules.min ? <Check size={14} className="text-success-600" /> : <X size={14} className="text-surface-400" />}
                <span className={rules.min ? "text-success-700" : "text-surface-500"}>At least 8 characters long</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-medium">
                {rules.mixed ? <Check size={14} className="text-success-600" /> : <X size={14} className="text-surface-400" />}
                <span className={rules.mixed ? "text-success-700" : "text-surface-500"}>Contains both uppercase & lowercase letters</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-medium">
                {rules.number ? <Check size={14} className="text-success-600" /> : <X size={14} className="text-surface-400" />}
                <span className={rules.number ? "text-success-700" : "text-surface-500"}>Contains at least one number (0-9)</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-medium">
                {rules.symbol ? <Check size={14} className="text-success-600" /> : <X size={14} className="text-surface-400" />}
                <span className={rules.symbol ? "text-success-700" : "text-surface-500"}>Contains at least one special symbol (@, #, $, etc.)</span>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full mt-6 py-3 font-semibold rounded-xl text-sm transition-all"
              loading={processing}
              disabled={!(rules.min && rules.mixed && rules.number && rules.symbol)}
            >
              Update Password & Log Out
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
