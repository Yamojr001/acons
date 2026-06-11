import { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { motion } from 'framer-motion'
import type { PageProps } from '@/types'

export default function GuestLayout({ children }: { children: ReactNode }) {
  const { auth } = usePage<PageProps>().props
  const tenant = auth?.tenant
  const primary = tenant?.primary_color ?? '#1d4ed8'
  const secondary = tenant?.secondary_color ?? '#a31d1d'

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.4,0,0.2,1] }}
        className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 100%)` }}>
        {/* Decorative blobs and watermark */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] transform scale-[1.3] rotate-12">
            <img src="/assets/images/acons_logo.png" alt="Watermark" className="w-96 h-96 object-contain" />
          </div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl w-fit shadow-lg">
            <div className="bg-white p-1 rounded-full shadow-inner flex items-center justify-center">
              <img src="/assets/images/acons_logo.png" alt={tenant?.name ?? 'ACONS'} className="h-16 w-16 object-contain" />
            </div>
            <div>
              <h2 className="text-white font-display font-black leading-none text-lg tracking-tight">AMEENATU</h2>
              <p className="text-white/80 text-[10px] uppercase font-bold tracking-widest mt-1">College of Nursing Sciences</p>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl xl:text-4xl font-display font-black text-white leading-tight mb-4 tracking-tight drop-shadow-sm">
            {tenant?.tagline ?? 'Leading in Nursing Education, Leading in Health Care Delivery'}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
            className="text-white/80 text-sm leading-relaxed max-w-lg font-medium">
            Welcome to the Ameenatu College of Nursing Sciences (ACONS), Dutse portal. We provide a state-of-the-art educational ecosystem for high-fidelity clinical simulations, ethical care training, and professional healthcare excellence.
          </motion.p>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
          className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'NMCN Approved', value: 'Accredited' },
            { label: 'State-of-the-Art Wards', value: 'Simulation Labs' },
            { label: 'Excellence Pass Rate', value: '100%' }
          ].map(s => (
            <div key={s.label} className="bg-white/10 border border-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-lg xl:text-xl font-black text-white tracking-tight">{s.value}</p>
              <p className="text-white/70 text-[9px] uppercase tracking-wider font-bold mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.4,0,0.2,1] }}
          className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center flex flex-col items-center justify-center">
            <div className="bg-white p-2.5 rounded-2xl shadow-md border border-surface-200 w-20 h-20 flex items-center justify-center mb-3">
              <img src="/assets/images/acons_logo.png" alt={tenant?.name ?? 'ACONS'} className="w-16 h-16 object-contain" />
            </div>
            <h2 className="text-xl font-display font-black text-surface-900 tracking-tight">{tenant?.name ?? 'Ameenatu College of Nursing'}</h2>
            <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-0.5">Dutse, Jigawa State</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
