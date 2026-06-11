import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader, Select } from '@/Components/UI/Advanced'
import { Card, Button, Badge } from '@/Components/UI'
import { CheckCircle2, XCircle, Clock, Save } from 'lucide-react'
import type { PageProps } from '@/types'

interface Student { id: number; user: { name: string }; attendances?: { status: string }[] }
interface AttendanceProps extends PageProps {
  classrooms: { id: number; name: string }[]
  students: Student[]
  selected_class: number
  selected_date: string
  filters: any
}

const statusOptions = ['present', 'absent', 'late', 'excused']
const statusColor: Record<string, string> = { present: 'success', absent: 'danger', late: 'warning', excused: 'brand' }
const StatusIcon = ({ s }: { s: string }) => s === 'present' ? <CheckCircle2 size={15} className="text-success-500" /> : s === 'absent' ? <XCircle size={15} className="text-danger-500" /> : <Clock size={15} className="text-warning-500" />

export default function Attendance({ classrooms, students, selected_class, selected_date, filters }: AttendanceProps) {
  const [records, setRecords] = useState<Record<number, string>>(() =>
    Object.fromEntries(students.map(s => [s.id, s.attendances?.[0]?.status ?? 'present']))
  )
  const { post, processing } = useForm()

  function save() {
    post('/admin/attendance', { data: { date: selected_date, class_room_id: selected_class, records } } as any)
  }

  return (
    <AppLayout title="Attendance">
      <Head title="Attendance" />
      <PageHeader
        title="Attendance Register"
        subtitle={`${students.length} students — ${selected_date}`}
        actions={
          <Button variant="primary" icon={<Save size={15} />} loading={processing} onClick={save}>
            Save Attendance
          </Button>
        }
      />

      <Card className="mb-5 flex flex-wrap gap-4">
        <div className="flex gap-4 flex-1">
          <select
            className="input text-sm py-2"
            defaultValue={selected_class}
            onChange={e => { window.location.href = `/admin/attendance?class_room_id=${e.target.value}&date=${selected_date}` }}
          >
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            className="input text-sm py-2"
            defaultValue={selected_date}
            onChange={e => { window.location.href = `/admin/attendance?class_room_id=${selected_class}&date=${e.target.value}` }}
          />
        </div>
      </Card>

      {students.length === 0 ? (
        <Card className="py-12 text-center text-surface-400">Select a class to begin taking attendance.</Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-50 border-b border-surface-200 text-xs text-surface-500 uppercase">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-surface-50">
                  <td className="px-6 py-3 text-sm text-surface-400">{i + 1}</td>
                  <td className="px-6 py-3 text-sm font-medium text-surface-900">{s.user.name}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {statusOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setRecords(r => ({ ...r, [s.id]: opt }))}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 capitalize ${
                            records[s.id] === opt
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-white text-surface-500 border-surface-200 hover:border-brand-300'
                          }`}
                        >
                          <StatusIcon s={opt} /> {opt}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppLayout>
  )
}
