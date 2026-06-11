import { Head } from '@inertiajs/react'
import { BookOpen, CheckCircle, FileText, Download, Award, Layers } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Course {
  id: number
  code: string
  name: string
  credit_units: number
  type: 'core' | 'elective'
}

interface Registration {
  id: number
  course_id: number
  status: 'pending' | 'approved' | 'rejected'
  course: Course
}

interface CourseRegistrationProps extends PageProps {
  availableCourses: Course[]
  registeredCourses: Registration[]
  currentSemester: { name: string; academicSession: { name: string } }
  maxCreditUnitsPerYear: number
  minCreditUnitsPerYear: number
  unitsRegisteredThisYear: number
  eligibleLevels: string[]
  selectedLevel: string
}

export default function CourseRegistration({ 
  availableCourses = [], 
  registeredCourses = [], 
  currentSemester, 
  maxCreditUnitsPerYear, 
  minCreditUnitsPerYear, 
  unitsRegisteredThisYear, 
  selectedLevel 
}: CourseRegistrationProps) {
  
  // Total assigned credits for the current semester
  const totalCredits = registeredCourses.reduce((sum, r) => sum + (r.course?.credit_units ?? 0), 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <AppLayout>
      <Head title="My Assigned Courses" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">My Assigned Courses</h1>
          <p className="text-sm text-surface-500 mt-1">First Semester, Academic Session {currentSemester?.academicSession?.name}</p>
        </div>
        <div>
          <Button 
            variant="outline" 
            className="text-xs font-bold uppercase rounded-xl h-10 px-4 flex items-center gap-1.5 shadow-sm border-surface-200"
            onClick={handlePrint}
          >
            <Download size={15} />
            Download Course Form (PDF)
          </Button>
        </div>
      </div>

      {/* Curriculum policy notification */}
      <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-150 rounded-2xl flex gap-4 text-emerald-800 text-xs shadow-sm">
        <CheckCircle size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-700">ACONS Curriculum & Automatic Enrollment Policy</p>
          <p className="mt-1 font-medium leading-relaxed">
            In compliance with the **Ameenatu College of Nursing Sciences (ACONS)** regulatory directives, students are not required to manually register or pick courses. The Academic Board and Head of Department (HOD) automatically assign the complete core syllabus required for your current level (<span className="font-bold">{selectedLevel}</span>). You are fully cleared and registered for all listed courses below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand: Course Schedule List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-surface-150 shadow-sm">
            <div className="border-b border-surface-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-surface-900 text-sm uppercase tracking-wider">Assigned Syllabus</h2>
                <p className="text-xs text-surface-500 mt-0.5">Approved course curriculum for {selectedLevel}</p>
              </div>
              <Badge variant="success" className="px-3 py-1 font-bold uppercase text-[9px] tracking-widest">
                Enrolled & Approved
              </Badge>
            </div>

            <div className="divide-y divide-surface-100">
              {registeredCourses.length > 0 ? (
                registeredCourses.map(({ id, course }) => (
                  <div key={id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-brand-600 uppercase tracking-wider">{course?.code}</span>
                        <Badge variant="neutral" className="text-[9px] uppercase tracking-wider px-1.5 py-0.5">
                          {course?.type === 'core' ? 'Core Curriculum' : 'Elective'}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-surface-800 leading-snug">{course?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-surface-800">{course?.credit_units}</p>
                      <p className="text-[10px] text-surface-450 uppercase font-bold tracking-wider">Credits</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-surface-400">
                  <BookOpen size={40} className="mx-auto mb-2 opacity-30 text-surface-400" />
                  <p className="text-sm">No assigned courses found for your academic track.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Hand: Profile & Credits Analytics */}
        <div>
          <Card className="border border-surface-150 shadow-sm sticky top-6 space-y-6">
            <div>
              <h2 className="font-bold text-surface-900 text-sm uppercase tracking-wider">Academic Profile</h2>
              <p className="text-xs text-surface-500 mt-0.5">Registration status & summary statistics</p>
            </div>

            {/* Micro stats indicators */}
            <div className="space-y-3.5 bg-surface-50 p-4 rounded-2xl border border-surface-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">Academic Level:</span>
                <span className="font-bold text-surface-800">{selectedLevel}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-surface-100 pt-3">
                <span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">Total Courses:</span>
                <span className="font-bold text-surface-800">{registeredCourses.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-surface-100 pt-3">
                <span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">Current Semester Load:</span>
                <span className="font-bold text-brand-600">{totalCredits} Credit Units</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-surface-100 pt-3">
                <span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">Max Credit Limit (Year):</span>
                <span className="font-bold text-surface-700">{maxCreditUnitsPerYear} Units</span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="space-y-2">
              <Button 
                variant="primary" 
                className="w-full text-xs font-bold uppercase tracking-wider py-2.5 h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                onClick={handlePrint}
              >
                <FileText size={16} />
                Print Official Course Form
              </Button>
            </div>

            {/* Curriculum guidelines notice */}
            <div className="p-4 bg-surface-50 border border-surface-150 rounded-2xl space-y-2 text-surface-500 text-[11px] leading-relaxed">
              <div className="flex items-center gap-1.5 text-surface-700 font-bold uppercase tracking-wider text-[9px]">
                <Layers size={13} className="text-surface-500" />
                <span>Progression Guidelines</span>
              </div>
              <p>
                To maintain normal academic status, students must attain a passing grade in all core courses. Failure to meet progression thresholds will require a reseat or level repeat.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
