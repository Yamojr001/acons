import { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, UserPlus, AlertCircle, GraduationCap } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  departments: any[]
  programs: any[]
}

export default function StudentCreate({ departments, programs }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    phone_number: '',
    gender: 'female', // Rebranded default for nursing
    date_of_birth: '',
    department_id: '',
    program_id: '',
    current_level: 'Basic Nursing Level 1',
    matriculation_number: '',
  })

  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])

  useEffect(() => {
    if (data.department_id) {
      const filtered = programs.filter(
        (p) => String(p.department_id) === String(data.department_id)
      )
      setFilteredPrograms(filtered)
      // Reset selected program if not in the new filtered list
      if (!filtered.some((p) => String(p.id) === String(data.program_id))) {
        setData('program_id', '')
      }
    } else {
      setFilteredPrograms([])
      setData('program_id', '')
    }
  }, [data.department_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/registrar/students')
  }

  return (
    <AppLayout title="Enroll Student">
      <Head title="Enroll Student" />

      <div className="mb-6 flex items-center gap-3">
        <Link href="/registrar/students" className="p-2 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Enroll New Student</h1>
          <p className="text-sm text-surface-500">Create a new student profile and system account.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <UserPlus size={16} />
              </div>
              <h3 className="text-md font-bold text-surface-800">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.name && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. email@example.com"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.email && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input 
                  type="text"
                  placeholder="e.g. +2348012345678"
                  value={data.phone_number}
                  onChange={(e) => setData('phone_number', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.phone_number && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone_number}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Gender</label>
                <select 
                  required
                  value={data.gender}
                  onChange={(e) => setData('gender', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.gender}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  required
                  value={data.date_of_birth}
                  onChange={(e) => setData('date_of_birth', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.date_of_birth && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.date_of_birth}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 pb-4 border-b border-surface-100">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
              <h3 className="text-md font-bold text-surface-800">Academic Assignment</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Department</label>
                <select 
                  required
                  value={data.department_id}
                  onChange={(e) => setData('department_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.department_id && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.department_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Program</label>
                <select 
                  required
                  disabled={!data.department_id}
                  value={data.program_id}
                  onChange={(e) => setData('program_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all disabled:opacity-50 disabled:bg-surface-50"
                >
                  <option value="">Select Program</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.program_id && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.program_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Current Level</label>
                <select 
                  required
                  value={data.current_level}
                  onChange={(e) => setData('current_level', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                >
                  {['Basic Nursing Level 1', 'Basic Nursing Level 2', 'Basic Nursing Level 3', 'ND1', 'ND2', 'HND1', 'HND2'].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                {errors.current_level && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.current_level}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Matric Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Leave blank to auto-generate"
                  value={data.matriculation_number}
                  onChange={(e) => setData('matriculation_number', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.matriculation_number && <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.matriculation_number}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-surface-100">
              <Link href="/registrar/students">
                <Button type="button" variant="outline" size="sm">Cancel</Button>
              </Link>
              <Button type="submit" variant="brand" size="sm" iconLeft={<Save size={16} />} loading={processing}>
                Save & Enroll
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}
