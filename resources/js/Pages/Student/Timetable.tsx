import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, EmptyState, Badge } from '@/Components/UI'
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
import type { PageProps, ClassRoom } from '@/types'

interface Props extends PageProps {
  timetable: any[]
  class: ClassRoom
}

export default function Timetable({ timetable, class: classroom }: Props) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  return (
    <AppLayout title="Class Timetable">
      <Head title="Class Timetable" />

      <div className="mb-6">
        <h1 className="page-title">Class Timetable</h1>
        <p className="text-sm text-surface-500 mt-1 flex items-center gap-2">
          Your weekly schedule for <Badge variant="outline">{classroom?.name || 'Level'}</Badge>
        </p>
      </div>

      <Card padding="none" className="overflow-hidden">
        {timetable && timetable.length > 0 ? (
          <div className="overflow-x-auto">
             {/* Render structure similarly to Teacher Timetable */}
             <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="p-4 font-semibold text-surface-900 w-32 border-r border-surface-200">Time</th>
                  {days.map(day => (
                    <th key={day} className="p-4 font-semibold text-surface-900 text-center min-w-[150px] border-r border-surface-200">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                <tr>
                  <td colSpan={6} className="p-12 text-center text-surface-500">
                    Timetable structure layout required based on data format.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16">
            <EmptyState
              title="Schedule Not Published"
              description="Your timetable has not been uploaded yet. Please check back later."
              icon={<CalendarIcon size={48} className="text-surface-300" />}
            />
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
