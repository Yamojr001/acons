// ─── Shared Profile Page (used by Student, Lecturer, Registrar) ─────────────
import { FormEvent } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Save, Camera, User, Mail, Phone, Shield } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Avatar, Badge } from '@/Components/UI'
import { PageHeader, Input, FileUpload } from '@/Components/UI/Advanced'
import type { PageProps } from '@/types'

interface ProfileProps extends PageProps {
  user: { id: number; name: string; email: string; phone: string | null; avatar: string | null; role: string }
  extra?: Record<string, any>
}

export default function Profile({ user, extra }: ProfileProps) {
  const { data, setData, put, processing, errors } = useForm({
    name:          user.name,
    phone:         user.phone ?? '',
    qualification: extra?.qualification ?? '',
    occupation:    extra?.occupation ?? '',
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    put(`/${user.role.replace('_', '-')}/profile`)
  }

  return (
    <AppLayout title="My Profile">
      <Head title="Profile" />
      <PageHeader title="My Profile" subtitle="Manage your account information"
        breadcrumbs={[{ label: user.role.replace('_', ' ') }, { label: 'Profile' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
        {/* Avatar card */}
        <Card className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar name={user.name} src={user.avatar} size="xl"
              className="ring-4 ring-white shadow-md" />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-brand-600 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <h2 className="font-semibold text-surface-900 text-lg">{user.name}</h2>
          <p className="text-sm text-surface-500 mt-0.5">{user.email}</p>
          <Badge variant="brand" className="mt-2 capitalize">{user.role.replace('_', ' ')}</Badge>
        </Card>

        {/* Edit form */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-semibold text-surface-900 mb-5">Personal Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" value={data.name} onChange={e => setData('name', e.target.value)}
                error={errors.name} leftIcon={<User size={15} />} required />
              <div>
                <label className="label">Email Address</label>
                <div className="input bg-surface-50 text-surface-500 flex items-center gap-2 cursor-not-allowed">
                  <Mail size={15} className="text-surface-400 flex-shrink-0" />
                  {user.email}
                </div>
                <p className="mt-1.5 text-xs text-surface-400">Email cannot be changed. Contact your administrator.</p>
              </div>
              <Input label="Phone Number" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)}
                leftIcon={<Phone size={15} />} placeholder="+234 800 000 0000" />

              {user.role === 'teacher' && (
                <Input label="Qualification" value={data.qualification} onChange={e => setData('qualification', e.target.value)}
                  placeholder="B.Ed, M.Sc, PGDE…" />
              )}
              <div className="pt-2 flex justify-end">
                <Button type="submit" loading={processing} icon={<Save size={14} />}>Save Changes</Button>
              </div>
            </form>
          </Card>

          {/* Security section */}
          <Card className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={18} className="text-brand-500" />
              <h3 className="font-semibold text-surface-900">Account Security</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Password', value: '••••••••••', action: 'Change', href: '/forgot-password' },
                { label: 'Two-Factor Auth', value: 'Not enabled', action: 'Enable', href: '#' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-surface-800">{row.label}</p>
                    <p className="text-xs text-surface-500">{row.value}</p>
                  </div>
                  <Button variant="ghost" size="sm">{row.action}</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

// ─── Timetable Placeholder Page ──────────────────────────────────────────────
export function TimetablePage({ timetable, classes }: any) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const hours = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

  return (
    <AppLayout title="Timetable">
      <Head title="Timetable" />
      <PageHeader title="Timetable" subtitle="Weekly class schedule" />

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="table-head text-left w-20">Time</th>
                {days.map(d => <th key={d} className="table-head text-center">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {hours.map(hour => (
                <tr key={hour} className="table-row">
                  <td className="table-cell text-xs font-mono text-surface-400">{hour}</td>
                  {days.map(day => (
                    <td key={day} className="table-cell text-center">
                      {timetable?.[day]?.[hour] ? (
                        <div className="rounded-lg p-2 bg-brand-50 border border-brand-100 text-xs">
                          <p className="font-medium text-brand-700">{timetable[day][hour].subject}</p>
                          <p className="text-brand-500">{timetable[day][hour].class}</p>
                        </div>
                      ) : (
                        <span className="text-surface-200">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!timetable || Object.keys(timetable).length === 0) && (
          <div className="text-center py-12 text-surface-400">
            <p className="text-sm">Timetable not yet configured. Contact your institution administrator.</p>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
