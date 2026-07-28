import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  Trophy, Calendar, CreditCard, Bell, TrendingUp, 
  ArrowRight, BookOpen, Star, CheckCircle, AlertCircle,
  FileText, ShieldCheck
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, Avatar } from '@/Components/UI'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PageProps } from '@/types'

interface DashboardProps extends PageProps {
  student: any
  cgpa: number | string
  creditsEarned: number
  creditsRegistered: number
  registrationStatus: string
  recentResults: any[]
  outstandingFees: any[]
  announcements: any[]
}

export default function StudentDashboard({ 
  student, cgpa, creditsEarned, creditsRegistered, 
  registrationStatus, recentResults, outstandingFees, announcements 
}: DashboardProps) {
  const totalOutstanding = outstandingFees.reduce((sum, f) => sum + f.amount, 0)

  return (
    <AppLayout title="Student Dashboard">
      <Head title="Student Dashboard" />

      {/* 1. Profile Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 card p-6 bg-white border-0 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={120} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <Avatar name={student.user.name} src={student.user.avatar} size="xl" className="ring-4 ring-brand-50 shadow-xl" />
            <div className="text-center sm:text-left flex-1">
              <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mb-1">Academic Session 2025/2026</p>
              <h1 className="text-3xl font-display font-bold text-surface-900 mb-2">{student.user.name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <Badge variant="brand" className="px-3 py-1">{student.department?.name}</Badge>
                <Badge variant="neutral" className="px-3 py-1 font-mono text-xs">{student.matriculation_number}</Badge>
                <Badge variant="success" className="px-3 py-1">Level {student.current_level}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-surface-50">
            <div>
              <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Current CGPA</p>
              <p className="text-xl font-display font-bold text-surface-900">
                {typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Credits Reg.</p>
              <p className="text-xl font-display font-bold text-surface-900">{creditsRegistered}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Reg. Status</p>
              <Badge variant={registrationStatus === 'Approved' ? 'success' : registrationStatus === 'Pending' ? 'warning' : 'neutral'} className="mt-1">
                {registrationStatus}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Financial Status</p>
              <Badge variant={totalOutstanding > 0 ? 'danger' : 'success'} className="mt-1">
                {totalOutstanding > 0 ? 'Indebted' : 'Cleared'}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* 2. Quick Actions Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="bg-brand-600 text-white border-0 shadow-lg h-full flex flex-col justify-between p-6">
            <div>
              <h3 className="text-lg font-bold mb-1">My Courses</h3>
              <p className="text-sm text-white/70 mb-4">View your officially assigned HOD course schedule for the current semester.</p>
            </div>
            <Link href="/student/course-registration">
              <Button variant="white" className="w-full text-brand-600 font-bold" iconRight={<ArrowRight size={16} />}>
                Manage Courses
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* 3. Middle Section: Results & Finances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Results */}
        <div className="lg:col-span-2">
          <Card padding="none" className="h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-bold text-surface-900 flex items-center gap-2">
                <Trophy size={18} className="text-warning-500" />
                Recent Semester Results
              </h3>
              <Link href="/student/results" className="text-xs text-brand-600 font-bold hover:underline">View All</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-50 text-[10px] uppercase tracking-wider text-surface-500 font-bold">
                  <tr>
                    <th className="px-6 py-3">Course Code & Name</th>
                    <th className="px-6 py-3 text-center">Score</th>
                    <th className="px-6 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {recentResults.length > 0 ? recentResults.map((r, i) => (
                    <tr key={i} className="hover:bg-surface-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-surface-900">{r.course}</p>
                        <p className="text-[10px] text-surface-500">First Semester</p>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-surface-700">{r.score}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs
                          ${['A', 'B'].includes(r.grade_letter) ? 'bg-success-100 text-success-700' : 'bg-brand-100 text-brand-700'}`}>
                          {r.grade_letter}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-surface-400 italic">No results released for the current semester.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Finance Snapshot */}
        <div className="space-y-4">
          <Card className={totalOutstanding > 0 ? 'border-danger-200' : 'border-success-200'}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className={totalOutstanding > 0 ? 'text-danger-500' : 'text-success-500'} />
              <h3 className="font-bold text-sm text-surface-900 uppercase tracking-tight">Account Statement</h3>
            </div>
            
            {totalOutstanding > 0 ? (
              <div>
                <p className="text-3xl font-display font-bold text-danger-600 mb-1">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-surface-500 mb-4">Outstanding balance across {outstandingFees.length} invoices.</p>
                <Link href="/student/fees">
                  <Button variant="danger" className="w-full" size="sm">Settle Payment</Button>
                </Link>
              </div>
            ) : (
              <div className="py-4 text-center">
                <CheckCircle size={32} className="mx-auto text-success-500 mb-2" />
                <p className="font-bold text-surface-900">All Fees Cleared</p>
                <p className="text-xs text-surface-500 mt-1">You have no pending financial obligations.</p>
              </div>
            )}
          </Card>

          <Card>
            <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Notice Board</h4>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-surface-900 line-clamp-1">{a.title}</p>
                    <p className="text-[10px] text-surface-400">{formatDate(a.published_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
