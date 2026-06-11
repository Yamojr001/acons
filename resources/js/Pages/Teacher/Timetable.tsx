import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, EmptyState, Badge } from '@/Components/UI'
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react'
import type { PageProps, ClassRoom } from '@/types'

interface Props extends PageProps {
  timetable: any[] // Depends on actual structure
  classes: ClassRoom[]
}

export default function Timetable({ timetable, classes }: Props) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  
  return (
    <AppLayout title="My Timetable">
      <Head title="My Timetable" />

      <div className="mb-6">
        <h1 className="page-title">My Timetable</h1>
        <p className="text-sm text-surface-500 mt-1">
          View your weekly teaching schedule.
        </p>
      </div>

      <Card padding="none" className="overflow-hidden">
        {timetable && timetable.length > 0 ? (
          <div className="overflow-x-auto">
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
                {/* Temporary empty state visualization since timetable is often complex to render without known data structure */}
                <tr>
                  <td colSpan={6} className="p-12 text-center text-surface-500">
                    Timetable structure is set up but needs data format coordination.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12">
            <EmptyState
              title="No Timetable Available"
              description="Your weekly teaching schedule has not been generated or assigned yet. Please check back later or contact administration."
              icon={<CalendarIcon size={48} className="text-surface-300" />}
            />
          </div>
        )}
      </Card>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Assigned Classes Overview</h3>
        <div className="flex flex-wrap gap-3">
          {classes.length > 0 ? classes.map(cls => (
            <Badge key={cls.id} variant="secondary" className="px-3 py-1.5 text-sm">
              {cls.name}
            </Badge>
          )) : (
             <p className="text-sm text-surface-500">No classes assigned.</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
