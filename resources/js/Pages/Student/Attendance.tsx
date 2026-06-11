import { Head, router } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, EmptyState } from '@/Components/UI'
import { Calendar, UserCheck, UserX, Clock, FileMinus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  attendance: any[]
  summary: { present: number; absent: number; late: number; excused: number; rate: number }
  selectedMonth: string
}

export default function AttendancePage({ attendance, summary, selectedMonth }: Props) {
  
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.get('/student/attendance', { month: e.target.value }, { preserveState: true })
  }

  return (
    <AppLayout title="My Attendance">
      <Head title="My Attendance" />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="text-sm text-surface-500 mt-1">
            Review your daily attendance records.
          </p>
        </div>
        <div>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={handleMonthChange}
            className="input-select bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center py-4 border-b-4 border-b-success-500 rounded-b-sm">
          <p className="text-sm text-surface-500 mb-1">Present</p>
          <div className="text-2xl font-bold text-surface-900">{summary.present}</div>
        </Card>
        <Card className="text-center py-4 border-b-4 border-b-warning-500 rounded-b-sm">
          <p className="text-sm text-surface-500 mb-1">Late</p>
          <div className="text-2xl font-bold text-surface-900">{summary.late}</div>
        </Card>
        <Card className="text-center py-4 border-b-4 border-b-danger-500 rounded-b-sm">
          <p className="text-sm text-surface-500 mb-1">Absent</p>
          <div className="text-2xl font-bold text-surface-900">{summary.absent}</div>
        </Card>
        <Card className="text-center py-4 border-b-4 border-b-surface-300 rounded-b-sm">
          <p className="text-sm text-surface-500 mb-1">Attendance Rate</p>
          <div className="text-2xl font-bold text-surface-900">{summary.rate}%</div>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 font-medium text-surface-900">
          Attendance History
        </div>
        {attendance.length > 0 ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-surface-900">Date</th>
                <th className="px-6 py-3 font-semibold text-surface-900">Status</th>
                <th className="px-6 py-3 font-semibold text-surface-900">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-surface-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-surface-400" />
                       {formatDate(record.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {record.status === 'present' && <Badge variant="success" className="flex items-center gap-1"><UserCheck size={12}/> Present</Badge>}
                    {record.status === 'absent' && <Badge variant="danger" className="flex items-center gap-1"><UserX size={12}/> Absent</Badge>}
                    {record.status === 'late' && <Badge variant="warning" className="flex items-center gap-1"><Clock size={12}/> Late</Badge>}
                    {record.status === 'excused' && <Badge variant="secondary" className="flex items-center gap-1"><FileMinus size={12}/> Excused</Badge>}
                  </td>
                  <td className="px-6 py-4 text-surface-500 max-w-[200px] truncate">
                    {record.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12">
            <EmptyState
              title="No Attendance Records Found"
              description={`We couldn't find any attendance logs for ${selectedMonth}.`}
              icon={<Calendar size={48} className="text-surface-300" />}
            />
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
