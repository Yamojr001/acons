import { ReactNode, useState, useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList, BarChart3,
  DollarSign, Bell, Settings, LogOut, Menu, X, School, UserCheck, BookMarked,
  PenLine, Home, Calendar, FileText, Megaphone, User, Shield, Activity,
  CreditCard, Trophy, Wallet, Building2, CheckCircle
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Avatar, Badge, NairaIcon } from '@/Components/UI'
import type { PageProps } from '@/types'

const navConfig: Record<string, Array<{ label: string; href: string; icon: ReactNode }>> = {
  provost: [
    { label: 'Dashboard',         href: '/provost/dashboard',            icon: <LayoutDashboard size={17} /> },
    { label: 'Result Release',    href: '/provost/results',              icon: <CheckCircle size={17} /> },
    { label: 'Student Records',   href: '/provost/registrar/students',   icon: <GraduationCap size={17} /> },
    { label: 'Staff Directory',   href: '/provost/registrar/lecturers',  icon: <UserCheck size={17} /> },
    { label: 'Departments',       href: '/provost/registrar/faculties',  icon: <School size={17} /> },
    { label: 'Academic Calendar', href: '/provost/registrar/calendar',   icon: <Calendar size={17} /> },
    { label: 'Admissions',        href: '/provost/registrar/admissions', icon: <FileText size={17} /> },
    { label: 'Fee Schedules',     href: '/provost/bursary/fees',         icon: <NairaIcon size={17} /> },
    { label: 'Financial Reports', href: '/provost/bursary/reports',      icon: <Wallet size={17} /> },
    { label: 'Notices',           href: '/provost/announcements',        icon: <Megaphone size={17} /> },
  ],
  super_admin: [
    { label: 'System',      href: '/superadmin/system-health', icon: <Activity size={17} /> },
  ],
  school_admin: [
    { label: 'Dashboard',     href: '/admin/dashboard',        icon: <LayoutDashboard size={17} /> },
    { label: 'Students',      href: '/admin/students',         icon: <GraduationCap size={17} /> },
    { label: 'Lecturers',     href: '/admin/teachers',         icon: <UserCheck size={17} /> },
    { label: 'Departments',   href: '/admin/classrooms',       icon: <BookOpen size={17} /> },
    { label: 'Courses',       href: '/admin/subjects',         icon: <BookMarked size={17} /> },
    { label: 'Fees',          href: '/admin/fees',             icon: <DollarSign size={17} /> },
    { label: 'Payments',      href: '/admin/payments',         icon: <Wallet size={17} /> },
    { label: 'Notices',       href: '/admin/announcements',    icon: <Megaphone size={17} /> },
    { label: 'Settings',      href: '/admin/settings',         icon: <Settings size={17} /> },
  ],
  registrar: [
    { label: 'Dashboard',     href: '/registrar/dashboard',    icon: <LayoutDashboard size={17} /> },
    { label: 'Student Records', href: '/registrar/students',   icon: <GraduationCap size={17} /> },
    { label: 'Staff Directory', href: '/registrar/lecturers',  icon: <UserCheck size={17} /> },
    { label: 'Departments', href: '/registrar/faculties', icon: <School size={17} /> },
    { label: 'Academic Calendar', href: '/registrar/calendar',  icon: <Calendar size={17} /> },
    { label: 'Admissions',    href: '/registrar/admissions',   icon: <FileText size={17} /> },
    { label: 'Results Approval', href: '/registrar/results',   icon: <ClipboardList size={17} /> },
    { label: 'Notices',       href: '/registrar/announcements', icon: <Megaphone size={17} /> },
  ],
  bursar: [
    { label: 'Dashboard',     href: '/bursary/dashboard',      icon: <LayoutDashboard size={17} /> },
    { label: 'Fee Schedules', href: '/bursary/fees',           icon: <NairaIcon size={17} /> },
    { label: 'Transaction Logs', href: '/bursary/payments',    icon: <Wallet size={17} /> },
    { label: 'Expenses',      href: '/bursary/expenses',       icon: <CreditCard size={17} /> },
    { label: 'Financial Reports', href: '/bursary/reports',    icon: <BarChart3 size={17} /> },
    { label: 'Notices',       href: '/bursary/announcements',  icon: <Megaphone size={17} /> },
  ],
  admission_officer: [
    { label: 'Dashboard',     href: '/admissions/dashboard',   icon: <LayoutDashboard size={17} /> },
    { label: 'Configure Intake', href: '/admissions/open',     icon: <Settings size={17} /> },
    { label: 'Applicants',    href: '/admissions/manage',      icon: <Users size={17} /> },
    { label: 'Admitted Candidates', href: '/admissions/admitted', icon: <CheckCircle size={17} /> },
    { label: 'Broadcast Desk', href: '/admissions/announcements', icon: <Megaphone size={17} /> },
  ],
  hod: [
    { label: 'Dashboard',     href: '/hod/dashboard',          icon: <LayoutDashboard size={17} /> },
    { label: 'Dept. Lecturers', href: '/hod/lecturers',        icon: <Users size={17} /> },
    { label: 'Dept. Students',  href: '/hod/students',         icon: <GraduationCap size={17} /> },
    { label: 'Clearance Queue', href: '/hod/clearance',        icon: <ClipboardList size={17} /> },
    { label: 'Course Offerings', href: '/hod/courses',         icon: <BookOpen size={17} /> },
    { label: 'Grades Approval', href: '/hod/results',          icon: <CheckCircle size={17} /> },
  ],
  exam_officer: [
    { label: 'Dashboard',     href: '/exam-office/dashboard',  icon: <LayoutDashboard size={17} /> },
  ],
  lecturer: [
    { label: 'Dashboard',     href: '/lecturer/dashboard',     icon: <LayoutDashboard size={17} /> },
    { label: 'Courses',       href: '/lecturer/my-courses',    icon: <BookOpen size={17} /> },
    { label: 'Results',       href: '/lecturer/grades',        icon: <Trophy size={17} /> },
    { label: 'Notices',       href: '/lecturer/announcements', icon: <Megaphone size={17} /> },
    { label: 'Profile',       href: '/profile',                icon: <User size={17} /> },
  ],
  student: [
    { label: 'Dashboard',     href: '/student/dashboard',      icon: <LayoutDashboard size={17} /> },
    { label: 'My Courses',     href: '/student/course-registration', icon: <BookOpen size={17} /> },
    { label: 'Registration',  href: '/student/registration',   icon: <ClipboardList size={17} /> },
    { label: 'My Results',    href: '/student/results',        icon: <Trophy size={17} /> },
    { label: 'Bursary / Fees',href: '/student/fees',           icon: <CreditCard size={17} /> },
    { label: 'Notices',       href: '/student/announcements',  icon: <Megaphone size={17} /> },
    { label: 'Profile',       href: '/profile',                icon: <User size={17} /> },
  ],
}

const roleBadge: Record<string, 'danger'|'brand'|'success'|'warning'|'neutral'|'info'> = {
  super_admin: 'danger', provost: 'brand', registrar: 'brand', bursar: 'neutral', admission_officer: 'danger', hod: 'warning', exam_officer: 'info', lecturer: 'success', student: 'warning'
}

interface SidebarProps {
  open: boolean; onClose: () => void
  tenant: any; user: any; currentPath: string
}

function Sidebar({ open, onClose, tenant, user, currentPath }: SidebarProps) {
  const nav = navConfig[user.role] ?? []
  const primary = tenant?.primary_color ?? '#1d4ed8'
  const secondary = tenant?.secondary_color ?? '#a31d1d'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-64 border-r border-white/10 flex flex-col z-40 lg:translate-x-0 lg:static lg:h-screen shadow-xl"
        style={{ background: 'var(--color-tenant-primary, #2e5fa9)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
          <img src="/assets/images/acons_logo.png" alt={tenant?.name ?? 'ACONS'} className="h-9 w-9 rounded-full object-cover bg-white p-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{tenant?.name ?? 'Ameenatu'}</p>
            {tenant?.tagline && <p className="text-xs text-white/70 truncate">{tenant.tagline}</p>}
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-white/70 hover:bg-white/10"><X size={16} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <div className="space-y-0.5">
            {nav.map((item, i) => {
              const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 + 0.05 }}>
                  <Link href={item.href} onClick={() => window.innerWidth < 1024 && onClose()}
                    className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                      isActive ? 'bg-white text-surface-900 shadow-sm shadow-black/10' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-colors">
            <Avatar name={user.name} src={user.avatar_url} size="sm" className="ring-2 ring-offset-1 ring-white/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <div className="mt-0.5 text-[10px] font-bold tracking-wider uppercase text-white/70 bg-white/10 px-2 py-0.5 rounded-md inline-block">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5 mt-2">
            <Link href="/profile"
              className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer", 
                currentPath === '/profile' ? 'bg-white text-surface-900 shadow-sm shadow-black/10' : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}>
              <User size={14} /> My Profile
            </Link>
            <Link href="/settings"
              className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                currentPath === '/settings' ? 'bg-white text-surface-900 shadow-sm shadow-black/10' : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}>
              <Settings size={14} /> Security Settings
            </Link>
          </div>

          <Link href="/logout" method="post" as="button"
            className="w-full mt-2 flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:bg-danger-500/20 hover:text-white transition-colors cursor-pointer">
            <LogOut size={14} /> Sign Out
          </Link>
        </div>
      </motion.aside>
    </>
  )
}

function Topbar({ onMenuClick, title, user, tenant }: { onMenuClick: () => void; title?: string; user: any; tenant?: any }) {
  return (
    <header className="h-16 shadow-sm flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20 text-white" 
      style={{ background: 'var(--color-tenant-primary, #2e5fa9)' }}>
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-white/80 hover:bg-white/20 transition-colors"><Menu size={20} /></button>
      {title && <h1 className="text-lg font-semibold text-white hidden sm:block">{title}</h1>}
      {tenant?.email && (
        <a href={`mailto:${tenant.email}`} className="hidden md:block text-sm text-white/80 hover:text-white transition-colors truncate">
          {tenant.email}
        </a>
      )}
      <div className="flex items-center gap-2 ml-auto">
        <button className="p-2 rounded-xl text-white/80 hover:bg-white/20 transition-colors relative">
          <Bell size={20} />
        </button>
        <Link href="/profile">
          <Avatar name={user.name} src={user.avatar_url} size="sm" className="cursor-pointer ring-2 ring-offset-1 ring-white/30 hover:ring-white transition-all shadow-sm" />
        </Link>
      </div>
    </header>
  )
}

export default function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { auth, ziggy } = usePage<PageProps>().props
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
  const user = auth?.user
  const tenant = auth?.tenant

  useEffect(() => {
    if (tenant?.primary_color) document.documentElement.style.setProperty('--color-tenant-primary', tenant.primary_color)
    if (tenant?.secondary_color) document.documentElement.style.setProperty('--color-tenant-secondary', tenant.secondary_color)
  }, [tenant])

  if (!user) return null

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar open={true} onClose={() => {}} tenant={tenant} user={user} currentPath={currentPath} />
      </div>
      <div className="lg:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} tenant={tenant} user={user} currentPath={currentPath} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} user={user} tenant={tenant} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div key={currentPath} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}
            className="p-4 lg:p-6 max-w-screen-2xl mx-auto w-full">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
