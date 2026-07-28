import { useState, useEffect } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, MinusCircle, Save, Users, ChevronDown } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Badge, Avatar } from '@/Components/UI'
import { PageHeader, Select } from '@/Components/UI/Advanced'
import { cn, formatDate } from '@/lib/utils'
import type { PageProps, ClassRoom, Student } from '@/types'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface AttendanceStudent extends Omit<Student, 'user'> {
  user: { name: string; avatar: string | null }
  today_status?: AttendanceStatus
}

interface TeacherAttendanceProps extends PageProps {
  classes: ClassRoom[]
  students: AttendanceStudent[]
  selectedClass: string
  selectedDate: string
  alreadyMarked: boolean
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  present: { label: 'Present', icon: <CheckCircle2 size={16} />, color: 'text-success-700', bg: 'bg-success-50', border: 'border-success-300' },
  absent:  { label: 'Absent',  icon: <XCircle size={16} />,     color: 'text-danger-700',  bg: 'bg-danger-50',  border: 'border-danger-300' },
  late:    { label: 'Late',    icon: <Clock size={16} />,        color: 'text-warning-700', bg: 'bg-warning-50', border: 'border-warning-300' },
  excused: { label: 'Excused', icon: <MinusCircle size={16} />,  color: 'text-surface-600', bg: 'bg-surface-100', border: 'border-surface-300' },
}

export default function TeacherAttendance({ classes, students, selectedClass, selectedDate, alreadyMarked }: TeacherAttendanceProps) {
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>(() => {
    const init: Record<number, AttendanceStatus> = {}
    students.forEach(s => { init[s.id] = s.today_status ?? 'present' })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length
  const lateCount    = Object.values(attendance).filter(s => s === 'late').length

  function markAll(status: AttendanceStatus) {
    const updated: Record<number, AttendanceStatus> = {}
    students.forEach(s => { updated[s.id] = status })
    setAttendance(updated)
  }

  function handleSubmit() {
    setSaving(true)
    router.post('/lecturer/attendance', {
      class_room_id: selectedClass,
      date: selectedDate,
      attendance,
    }, {
      onSuccess: () => { setSaved(true); setSaving(false) },
      onError: () => setSaving(false),
    })
  }

  return (
    <AppLayout title="Mark Attendance">
      <Head title="Mark Attendance" />
      <PageHeader title="Mark Attendance" subtitle={formatDate(selectedDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        breadcrumbs={[{ label: 'Teacher' }, { label: 'Attendance' }]} />

      {/* Filters */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Class" value={selectedClass} options={classes.map(c => ({ value: c.id, label: c.name }))}
            onChange={e => router.get('/lecturer/attendance', { class_room_id: e.target.value, date: selectedDate }, { preserveState: true })}
            placeholder="Select class…" />
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={selectedDate} max={new Date().toISOString().split('T')[0]}
              onChange={e => router.get('/lecturer/attendance', { class_room_id: selectedClass, date: e.target.value }, { preserveState: true })} />
          </div>
        </div>
      </Card>

      {students.length > 0 ? (
        <>
          {/* Summary + bulk actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-success-500" /><span className="text-surface-600">{presentCount} Present</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-danger-500" /><span className="text-surface-600">{absentCount} Absent</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-warning-500" /><span className="text-surface-600">{lateCount} Late</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="hover:text-danger-600 hover:border-danger-300">Mark All Absent</Button>
            </div>
          </div>

          {alreadyMarked && !saved && (
            <div className="mb-4 p-3.5 bg-warning-50 border border-warning-200 rounded-xl text-sm text-warning-700">
              ⚠ Attendance was already marked for this class today. Submitting will update the existing records.
            </div>
          )}

          {/* Student list */}
          <Card padding="none" className="overflow-hidden mb-5">
            <div className="divide-y divide-surface-100">
              {students.map((student, i) => {
                const status = attendance[student.id] ?? 'present'
                const cfg = statusConfig[status]
                return (
                  <motion.div key={student.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                    className="flex items-center gap-4 px-5 py-4">
                    <Avatar name={student.user.name} src={student.user.avatar} size="sm" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{student.user.name}</p>
                      <p className="text-xs text-surface-500">{student.admission_number}</p>
                    </div>
                    {/* Status toggle buttons */}
                    <div className="flex gap-1.5">
                      {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([s, c]) => (
                        <motion.button key={s} whileTap={{ scale: 0.92 }}
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: s }))}
                          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150',
                            status === s ? `${c.bg} ${c.border} ${c.color}` : 'border-surface-200 text-surface-400 hover:border-surface-300 hover:text-surface-600'
                          )}>
                          {c.icon}
                          <span className="hidden sm:inline">{c.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">{students.length} students · {presentCount} present</p>
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.div key="saved" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-success-600 text-sm font-medium">
                  <CheckCircle2 size={18} /> Attendance saved!
                </motion.div>
              ) : (
                <Button key="save" variant="primary" loading={saving} icon={<Save size={16} />} onClick={handleSubmit}>
                  Save Attendance
                </Button>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Users size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">Select a class to mark attendance.</p>
          </div>
        </Card>
      )}
    </AppLayout>
  )
}
