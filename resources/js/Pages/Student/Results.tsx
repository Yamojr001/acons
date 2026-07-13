import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  Trophy, BookOpen, Printer, ChevronRight, 
  Search, Filter, Award, Star, GraduationCap
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState, Avatar } from '@/Components/UI'
import type { PageProps } from '@/types'

interface ResultGroup {
  session_name: string
  semester_load: number
  grades: Array<{
    course_code: string
    course_name: string
    units: number
    score: number
    grade: string
    points: number
  }>
  semester_gpa: number
}

interface Props extends PageProps {
  groupedResults: Record<string, ResultGroup>
  studentDetails: {
    name: string
    matric_number: string
    level: string
    department: string
    avatar_url: string
    cgpa: number
    total_load: number
    academic_status: string
    reseat_courses: string[]
  }
}

export default function StudentResults({ groupedResults, studentDetails }: Props) {
  const groups = Object.values(groupedResults)
  
  // By default select the most recent session/semester
  const [selectedSession, setSelectedSession] = useState<string>(groups[0]?.session_name || '')

  const currentGroup = groups.find(g => g.session_name === selectedSession)

  const handlePrint = () => {
    window.print()
  }

  return (
    <AppLayout title="Academic Transcript">
      <Head title="Academic Results" />

      {/* Hide controls when printing */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Academic Transcript</h1>
          <p className="text-sm text-surface-500 mt-1">View your official semester-by-semester performance history.</p>
        </div>
        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <select 
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 outline-none"
            >
              {groups.map(g => (
                <option key={g.session_name} value={g.session_name}>
                  {g.session_name}
                </option>
              ))}
            </select>
          )}
          <Button variant="brand" onClick={handlePrint} iconLeft={<Printer size={16} />}>
            Print Result
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="py-20 text-center print:hidden">
          <EmptyState
            title="No Results Yet"
            description="Your academic records will appear here as soon as they are approved by the Senate."
            icon={<Award size={48} className="text-surface-200" />}
          />
        </Card>
      ) : (
        /* Print Container */
        <div className="bg-white p-8 md:p-12 print:p-0 print:border-none print:shadow-none w-full max-w-4xl mx-auto mb-10 shadow-sm border border-surface-150 font-sans text-black relative">
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 print:opacity-[0.03] opacity-5">
             <img src="/logo.png" className="w-[500px] h-[500px] object-contain" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between border-b-4 border-gray-200 pb-2 mb-4">
              <div className="flex items-start gap-4 w-full">
                <img src="/logo.png" alt="Logo" className="w-[100px] h-[100px] object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <div className="flex-1 text-center pt-2 relative">
                  <h1 className="text-[18px] md:text-[22px] font-black text-[#1a237e] tracking-tight leading-tight">COLLEGE OF NURSING SCIENCES, BABURA, JIGAWA STATE</h1>
                  <h2 className="text-[15px] md:text-[17px] font-bold text-[#5c6bc0] leading-tight mt-1">SCHOOL OF NURSING, BABURA</h2>
                  <h3 className="text-[14px] md:text-[15px] font-bold text-[#3949ab] italic leading-tight mt-0.5">Result Slip</h3>
                  
                  <div className="md:absolute right-0 top-8 text-right text-xs font-bold text-[#1976d2] space-y-1 mt-2 md:mt-0 flex flex-col items-center md:items-end">
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                      <span>www.consbabura.edu.ng</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <span>son@consbabura.edu.ng</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center font-bold text-sm md:text-md mb-6">
              {currentGroup?.session_name || '2023/2024 Academic Session'}
            </div>

            {/* Student Info */}
            <div className="flex justify-between items-start mb-6 border-b-4 border-gray-100 pb-6">
              <div className="space-y-1.5 text-sm md:text-base">
                <h3 className="font-extrabold text-lg mb-2">Student's Information</h3>
                <div className="flex"><span className="w-32 md:w-40 inline-block">Registration No.:</span> <span className="font-bold">{studentDetails.matric_number}</span></div>
                <div className="flex"><span className="w-32 md:w-40 inline-block">Name:</span> <span className="font-bold uppercase">{studentDetails.name}</span></div>
                <div className="flex"><span className="w-32 md:w-40 inline-block">Gender:</span> <span className="font-bold">{(studentDetails as any).gender || 'Male'}</span></div>
              </div>
              <div>
                <img src={studentDetails.avatar_url || '/default-avatar.png'} alt="Student" className="w-24 h-28 md:w-32 md:h-36 object-cover bg-red-600 border-none" />
              </div>
            </div>

            {/* Academic Info */}
            <div className="mb-6 border-b-4 border-gray-100 pb-6 text-sm md:text-base">
              <h3 className="font-extrabold text-lg mb-2">Academic's Information</h3>
              <div className="flex"><span className="w-32 md:w-40 inline-block">Current Level:</span> <span className="font-bold">{studentDetails.level}</span></div>
              <div className="flex"><span className="w-32 md:w-40 inline-block">Programme:</span> <span className="font-bold">{studentDetails.department}</span></div>
            </div>

            {/* Courses */}
            {currentGroup && (
              <div>
                <h3 className="font-extrabold text-lg mb-2">Courses</h3>
                <table className="w-full text-left text-sm md:text-base mb-6">
                  <thead>
                    <tr className="font-bold">
                      <th className="py-2 w-16">S/No.</th>
                      <th className="py-2 w-24">Code</th>
                      <th className="py-2">Course Title</th>
                      <th className="py-2 text-center w-20">Score</th>
                      <th className="py-2 text-left w-24">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGroup.grades.map((g, i) => (
                      <tr key={i} className="font-semibold">
                        <td className="py-1.5">{i + 1}.</td>
                        <td className="py-1.5">{g.course_code}</td>
                        <td className="py-1.5">{g.course_name}</td>
                        <td className="py-1.5 text-center">{g.score}</td>
                        <td className="py-1.5 text-left uppercase">{g.grade === 'F' || g.grade === 'ABS' ? 'FAIL' : 'PASS'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t-2 border-dashed border-gray-800 pt-4 mb-16 font-bold text-sm md:text-base">
                  <div className="flex justify-between max-w-2xl">
                    <div>
                      <p className="mb-1">Total Score : {currentGroup.grades.reduce((sum, g) => sum + g.score, 0)}</p>
                      <p>CANDIDATE STATUS : <span className="uppercase">{studentDetails.academic_status === 'normal' ? 'PASSED' : studentDetails.academic_status === 'reseat' ? 'RESIT' : studentDetails.academic_status === 'repeat' ? 'REPEAT' : studentDetails.academic_status === 'withdrawn' ? 'WITHDRAWN' : 'PASSED'}</span></p>
                    </div>
                    <div>
                      <p>Course Spread : {currentGroup.grades.length}</p>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end mb-8 text-sm md:text-base font-bold">
                  <div className="text-center w-56 md:w-64">
                    <div className="border-t border-dashed border-gray-800 pt-1">
                      Exams Officer, Signature & Date
                    </div>
                  </div>
                  <div className="text-center w-56 md:w-64">
                    <div className="border-t border-dashed border-gray-800 pt-1">
                      Director SON, Signature & Date
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-xs font-bold border-t-2 border-gray-800 pt-2 pb-2">
                  <p className="mb-2">Printed on : {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })} - {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()}</p>
                  <p className="text-[9px] md:text-[10px] text-center w-full block uppercase font-normal tracking-widest border-t-2 border-gray-400 pt-2 mt-2">
                    THIS IS AN ONLINE SLIP. IT IS FOR REFERENCE ONLY.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
