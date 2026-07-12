import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Avatar, Button } from '@/Components/UI'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, CreditCard } from 'lucide-react'
import type { PageProps } from '@/types'

export default function StudentShow({ student, auth }: PageProps & { student: any }) {
  const isProvost = (auth?.user?.role as string) === 'provost'

  return (
    <AppLayout title="Student Profile">
      <Head title={`${student.user.name} - Profile`} />

      <div className="mb-6">
        <Link href={isProvost ? "/provost/registrar/students" : "/registrar/students"} className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center pt-8">
            <Avatar name={student.user.name} size="xl" className="mx-auto mb-4" />
            <h2 className="text-xl font-bold text-surface-900">{student.user.name}</h2>
            <p className="text-sm font-mono text-surface-500 mt-1">{student.matriculation_number}</p>
            
            <div className="mt-4 flex justify-center">
              <Badge variant={student.status === 'active' ? 'success' : 'neutral'} className="capitalize">
                {student.status}
              </Badge>
            </div>

            <div className="mt-6 border-t border-surface-100 pt-6 space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-surface-600">
                <Mail size={16} className="text-surface-400" />
                {student.user.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-surface-600">
                <Phone size={16} className="text-surface-400" />
                {student.phone_number || 'N/A'}
              </div>
              <div className="flex flex-col gap-1 text-sm text-surface-600 mt-2">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-surface-400" />
                  Address
                </div>
                <span className="pl-7">{student.address || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-surface-600 mt-2">
                <Calendar size={16} className="text-surface-400" />
                DOB: {student.dob || 'N/A'}
              </div>
            </div>
          </Card>
        </div>

        {/* Details and Academic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-surface-900 mb-4 border-b border-surface-100 pb-3">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Department</p>
                <p className="text-sm font-medium text-surface-900 mt-1">{student.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Current Level</p>
                <p className="text-sm font-medium text-surface-900 mt-1">{student.current_level || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Admission Year</p>
                <p className="text-sm font-medium text-surface-900 mt-1">{student.created_at ? new Date(student.created_at).getFullYear() : 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 border-b border-surface-100 pb-3 mb-4">
              <BookOpen size={18} className="text-brand-600" />
              <h3 className="text-lg font-bold text-surface-900">Recent Course Registrations</h3>
            </div>
            
            {student.registrations?.length > 0 ? (
              <div className="space-y-3">
                {student.registrations.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <div>
                      <p className="font-bold text-sm text-surface-900">{reg.course?.name}</p>
                      <p className="text-xs text-surface-500 font-mono mt-0.5">{reg.course?.code}</p>
                    </div>
                    <Badge variant="brand">{reg.semester?.name}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 text-center py-4">No course registrations found.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 border-b border-surface-100 pb-3 mb-4">
              <CreditCard size={18} className="text-brand-600" />
              <h3 className="text-lg font-bold text-surface-900">Payment History</h3>
            </div>
            
            {student.payments?.length > 0 ? (
              <div className="space-y-3">
                {student.payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <div>
                      <p className="font-bold text-sm text-surface-900">₦{Number(payment.amount).toLocaleString()}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={payment.status === 'successful' ? 'success' : 'neutral'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500 text-center py-4">No payments recorded.</p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
