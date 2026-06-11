import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Button, Badge } from '@/Components/UI'
import { Users, ArrowRight, GraduationCap } from 'lucide-react'
import type { PageProps } from '@/types'

interface ClassRoom {
  id: number
  full_name: string
  section: string
  level: number
  students_count: number
}

interface IndexProps extends PageProps {
  classrooms: ClassRoom[]
}

export default function PromotionIndex({ classrooms }: IndexProps) {
  return (
    <AppLayout title="Student Promotion">
      <Head title="Promotion Management" />
      <PageHeader
        title="Session Promotion"
        subtitle="Manage end-of-session student transitions (Promote, Repeat, or Graduate)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                  {cls.full_name}
                </h3>
                <p className="text-xs text-surface-500">{cls.section}</p>
              </div>
              <Badge variant="brand">
                <Users size={12} className="mr-1" /> {cls.students_count} Students
              </Badge>
            </div>
            
            <div className="mt-4 pt-4 border-t border-surface-100 flex justify-end">
              <Link href={`/admin/promotion/${cls.id}`}>
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>
                  Manage Students
                </Button>
              </Link>
            </div>
          </Card>
        ))}
        
        {classrooms.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-surface-200">
            <GraduationCap size={48} className="mx-auto text-surface-300 mb-3" />
            <p className="text-surface-500 font-medium">No classrooms found to manage promotions.</p>
            <Link href="/admin/classrooms" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Go to Classrooms</Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
