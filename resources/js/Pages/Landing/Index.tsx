import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, Users, BookOpen, Heart, 
  Shield, Phone, Mail, MapPin, ChevronRight, 
  CheckCircle, Landmark, Sparkles, Award,
  X, ChevronLeft, Camera, ZoomIn
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'

interface LandingProps extends PageProps {
  tenant: any
  stats: { students: number; lecturers: number; departments: number }
  admission_form: { id: number; title: string } | null
}

export default function Landing({ tenant, stats, auth, admission_form }: LandingProps) {
  const primary = '#2e5fa9' // Royal Blue brand color
  const secondary = '#a31d1d' // Crimson Red brand color

  const [activePhoto, setActivePhoto] = useState<number | null>(null)

  const gallery = [
    {
      src: '/assets/images/acons_gate.jpg',
      title: 'ACONS Main Campus Entrance',
      tag: 'Campus Gates',
      desc: 'Our modern gated facility located in Dutse, Jigawa State, symbolizing our dedication to student safety and academic structure.'
    },
    {
      src: '/assets/images/acons_lab.jpg',
      title: 'Clinical Practice Lab',
      tag: 'Facilities',
      desc: 'A state-of-the-art laboratory fully equipped with microscopes, active clinical desks, and real medical tools for intensive practice.'
    },
    {
      src: '/assets/images/acons_female_matric.jpg',
      title: 'Official Matriculation Ceremony',
      tag: 'Student Life',
      desc: 'Our brilliant female student cohorts fully dressed in professional scrubs and hijabs celebrating their formal entry into the nursing profession.'
    },
    {
      src: '/assets/images/acons_male_students.jpg',
      title: 'Clinical Cohort Peer Group',
      tag: 'Student Life',
      desc: 'ACONS male nursing students standing tall in crisp clinical uniforms at the main academic pavilion entrance.'
    },
    {
      src: '/assets/images/acons_female_students.jpg',
      title: 'Peer Learning & Community',
      tag: 'Candid Moments',
      desc: 'A heartwarming portrait of nursing students sharing collaborative moments outside their daily lecture halls.'
    }
  ]

  const programs = [
    {
      title: 'National Diploma in Nursing',
      duration: '4 Years (ND/HND Track)',
      desc: 'A comprehensive modern curriculum fully aligned with the unified ND/HND Nursing Council guidelines designed to produce world-class registered nurse professionals.',
      features: ['Unified ND/HND Track', 'Clinical Practicums', 'NMCN Accredited', 'Expert Mentoring']
    },
    {
      title: 'National Diploma in Midwifery',
      duration: '4 Years (ND/HND Track)',
      desc: 'Advanced modern track focusing on high-fidelity clinical midwifery simulation, maternal health systems, and modern postnatal procedures.',
      features: ['Unified ND/HND Track', 'Maternal Simulation', 'Hospital Rotations', 'Neo-natal Care']
    }
  ]

  const facilities = [
    { icon: <Heart size={22} />, title: 'Clinical Simulation Labs', desc: 'Fully equipped simulation wards featuring high-fidelity clinical manikins for realistic hands-on skill training.' },
    { icon: <Users size={22} />, title: 'Distinguished Faculty', desc: 'Learn from highly qualified nursing educators, clinical scientists, and healthcare practice veterans.' },
    { icon: <BookOpen size={22} />, title: 'Modern E-Library & Research Hub', desc: 'Access to extensive databases of international nursing, medicine, and global health research journals.' },
    { icon: <Landmark size={22} />, title: 'National Accreditation', desc: 'Programs carefully curated and fully aligned with the requirements of the Nursing and Midwifery Council of Nigeria (NMCN).' },
    { icon: <Sparkles size={22} />, title: 'Excellent Career Pipeline', desc: 'Strong clinical partnerships with premier specialist hospitals ensuring seamless student placements.' },
  ]

  const portalGateways = [
    {
      role: 'Student Portal',
      desc: 'Register semester courses, settle fee invoices, and download your consolidated academic transcript.',
      link: '/login',
      badge: 'Active Roster'
    },
    {
      role: 'Academic Staff Hub',
      desc: 'For lecturers and HODs to manage course allocations, upload continuous assessments, and review results.',
      link: '/login',
      badge: 'Faculty Portal'
    },
    {
      role: 'Administrative Suite',
      desc: 'Secure gateway for Provost, Registrar, and Bursars to coordinate campus admissions, finance, and clearances.',
      link: '/login',
      badge: 'Campus Admin'
    }
  ]

  return (
    <>
      <Head title="Ameenatu College of Nursing Sciences (ACONS) — Portal" />
      <style>{`:root { --color-tenant-primary: ${primary}; --color-tenant-secondary: ${secondary}; }`}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ opacity: 0, y: -16 }} 
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white p-0.5 rounded-full border border-surface-200 shadow-inner flex items-center justify-center">
              <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-surface-900 block leading-none">AMEENATU</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-blue-600 block mt-0.5">College of Nursing Sciences</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {auth.user ? (
              <Link 
                href={
                  {
                    super_admin: '/superadmin/dashboard',
                    school_admin: '/admin/dashboard',
                    lecturer: '/lecturer/dashboard',
                    teacher: '/lecturer/dashboard',
                    student: '/student/dashboard',
                    registrar: '/registrar/dashboard',
                    bursar: '/bursary/dashboard',
                    admission_officer: '/admissions/dashboard',
                    exam_officer: '/exam-office/dashboard',
                    provost: '/registrar/dashboard',
                    hod: '/hod/dashboard',
                    dean: '/dean/dashboard',
                  }[auth.user.role] ?? '/'
                }
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg bg-blue-600 hover:bg-blue-700 transition-all shadow-blue-600/10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href={route('admissions.login')} className="px-4 py-2 text-sm text-blue-600 hover:underline transition-colors font-bold">My Application</Link>
                <Link href="/login" className="px-4 py-2 text-sm text-surface-600 hover:text-blue-600 transition-colors font-semibold">Sign In</Link>
                <Link 
                  href="/login" 
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10"
                >
                  Student Hub
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-surface-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-surface-50" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="lg:col-span-7 text-left space-y-8">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm"
            >
              <Award size={14} className="text-blue-600" /> Official ACONS Academic Portal
            </motion.span>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-surface-900 leading-tight"
            >
              Nurturing <span className="text-blue-600">Excellence</span> & Compassion in Nursing
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
              className="text-lg text-surface-600 leading-relaxed max-w-2xl"
            >
              Welcome to the official portal of <span className="font-bold text-blue-700">Ameenatu College of Nursing Sciences (ACONS)</span>. Experience state-of-the-art simulation labs, fully accredited nursing curricula, and a streamlined digital campus.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all"
              >
                Access Portal Login <ChevronRight size={18} />
              </Link>
              
              <Link 
                href={route('admissions.apply')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-blue-600 font-bold text-blue-600 bg-white hover:bg-blue-50 transition-all"
              >
                Apply Online <ChevronRight size={18} />
              </Link>
            </motion.div>

            {/* Quick Live Stats */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4 max-w-md"
            >
              {[
                { label: 'Enrolled Students', val: stats.students || 120 }, 
                { label: 'Expert Lecturers', val: stats.lecturers || 18 }, 
                { label: 'Departments', val: stats.departments || 3 }
              ].map((s, i) => (
                <div 
                  key={s.label}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-surface-200 text-center"
                >
                  <p className="text-2xl font-display font-black text-blue-600">{s.val}</p>
                  <p className="text-[10px] uppercase font-bold text-surface-400 tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Premium Hero Image Frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-2xl opacity-10 animate-pulse" />
            <div className="relative border-4 border-white shadow-2xl rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-square bg-surface-100">
              <img 
                src="/assets/images/acons_gate.jpg" 
                alt="Ameenatu College of Nursing Sciences Front Gate" 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
                <p className="font-bold text-sm uppercase tracking-widest text-amber-400">ACONS Main Campus</p>
                <p className="text-xs text-white/90 mt-1">Our pristine main entrance at Dutse, Jigawa State — welcoming future healthcare leaders.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Academic Programs ────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white border-t border-surface-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Curriculum</span>
            <h2 className="text-4xl font-display font-black text-surface-900">Academic Programs</h2>
            <p className="text-surface-500 text-base leading-relaxed">
              We offer world-class training programs fully accredited by appropriate regulatory boards to ensure immediate professional placement upon graduation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programs.map((prog, idx) => (
              <motion.div 
                key={prog.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface-50 rounded-3xl p-8 border border-surface-200 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">{prog.duration}</span>
                  <Heart className="text-blue-600/30 group-hover:text-red-600 transition-colors" size={20} />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{prog.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed mb-6">{prog.desc}</p>
                
                <ul className="space-y-2 border-t border-surface-200 pt-4">
                  {prog.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-surface-600 font-medium">
                      <CheckCircle size={14} className="text-blue-600" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Campus Facilities ───────────────────────────────────────── */}
      <section className="py-24 px-4 bg-surface-50 border-t border-surface-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Why Choose ACONS</span>
            <h2 className="text-4xl font-display font-black text-surface-900">Standard Healthcare Facilities</h2>
            <p className="text-surface-500 text-base leading-relaxed">
              We combine professional guidance, rigorous academics, and exceptional facilities to guarantee stellar learning outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((fac, idx) => (
              <motion.div 
                key={fac.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-surface-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600">
                  {fac.icon}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{fac.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{fac.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Campus Gallery & Student Life ──────────────────────────────── */}
      <section className="py-24 px-4 bg-white border-t border-surface-100 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Campus Life</span>
            <h2 className="text-4xl font-display font-black text-surface-900">ACONS Campus Gallery</h2>
            <p className="text-surface-500 text-base leading-relaxed">
              Explore our real academic environment, student cohorts, and state-of-the-art clinical simulation laboratories built to produce world-class health practitioners.
            </p>
          </div>

          {/* Premium Grid Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {gallery.map((photo, idx) => (
              <motion.div
                key={photo.src}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setActivePhoto(idx)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-surface-200 bg-white p-3 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-100">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center text-blue-600 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <ZoomIn size={20} />
                    </div>
                  </div>
                  {/* Tag */}
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {photo.tag}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-surface-900 text-lg group-hover:text-blue-600 transition-colors">{photo.title}</h3>
                  <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">{photo.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Modal Lightbox with AnimatePresence */}
        <AnimatePresence>
          {activePhoto !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-50 animate-pulse"
              >
                <X size={24} />
              </button>

              {/* Prev Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActivePhoto((prev) => (prev !== null && prev > 0 ? prev - 1 : gallery.length - 1))
                }}
                className="absolute left-4 sm:left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-50"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActivePhoto((prev) => (prev !== null && prev < gallery.length - 1 ? prev + 1 : 0))
                }}
                className="absolute right-4 sm:right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-50"
              >
                <ChevronRight size={24} />
              </button>

              {/* Main Lightbox Card */}
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full bg-surface-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row"
              >
                {/* Image display */}
                <div className="w-full md:w-3/5 aspect-[4/3] md:aspect-auto md:h-[500px] bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={gallery[activePhoto].src}
                    alt={gallery[activePhoto].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Text Details */}
                <div className="w-full md:w-2/5 p-8 flex flex-col justify-between text-white bg-surface-900 border-t md:border-t-0 md:border-l border-white/10">
                  <div className="space-y-4">
                    <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                      {gallery[activePhoto].tag}
                    </span>
                    <h3 className="text-2xl font-display font-black leading-tight text-white">{gallery[activePhoto].title}</h3>
                    <p className="text-sm text-surface-300 leading-relaxed">{gallery[activePhoto].desc}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-8">
                    <span className="text-xs text-surface-400 font-bold uppercase tracking-widest">
                      Photo {activePhoto + 1} of {gallery.length}
                    </span>
                    <span className="text-xs text-blue-400 font-bold">Ameenatu College of Nursing</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Interactive Gateways ────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white border-t border-surface-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Campus Access</span>
            <h2 className="text-4xl font-display font-black text-surface-900">Digital Campus Gateways</h2>
            <p className="text-surface-500 text-base leading-relaxed">
              Log in to access academic rosters, financial statement summaries, and interactive marks entry registries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portalGateways.map((gate, idx) => (
              <motion.div 
                key={gate.role}
                className="relative bg-surface-50 rounded-3xl p-8 border border-surface-200 hover:border-blue-200 overflow-hidden flex flex-col justify-between h-72 shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1">{gate.badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-3">{gate.role}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{gate.desc}</p>
                </div>
                <Link 
                  href={gate.link}
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 group mt-6"
                >
                  Access Gateway <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-16 px-4 bg-surface-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/10">
            
            {/* School details */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white p-0.5 rounded-full border border-white/20 shadow-inner flex items-center justify-center">
                  <img src="/assets/images/acons_logo.png" alt="ACONS Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <span className="font-display font-black text-sm tracking-tight text-white block">AMEENATU</span>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-red-400 block mt-0.5">Nursing Sciences</span>
                </div>
              </div>
              <p className="text-sm text-white/60 max-w-md leading-relaxed">
                Dedicated to clinical skill excellence, ethical leadership, and high quality professional training.
              </p>
            </div>

            {/* Contacts */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">Institution Contact</h4>
              <div className="space-y-2 text-sm text-white/60">
                <div className="flex items-center gap-3"><Phone size={16} className="text-red-400" /><span>{tenant?.phone ?? '08036894451'}</span></div>
                <div className="flex items-center gap-3"><Mail size={16} className="text-red-400" /><span>{tenant?.email ?? 'info@ameenatu.edu.ng'}</span></div>
                <div className="flex items-center gap-3"><MapPin size={16} className="text-red-400" /><span>{tenant?.address ?? 'Dutse, Jigawa State'}</span></div>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} Ameenatu College of Nursing Sciences (ACONS). All rights reserved.</p>
            <p className="text-xs text-white/20">Authorized School Portal Administration Gateway</p>
          </div>
        </div>
      </footer>
    </>
  )
}
