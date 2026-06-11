import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, User, BookOpen, Users, CheckCircle2 } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Avatar } from '@/Components/UI'
import { Input, Select, Textarea } from '@/Components/UI/Advanced'
import { PageHeader } from '@/Components/UI/Advanced'
import type { PageProps, ClassRoom } from '@/types'

interface CreateStudentProps extends PageProps {
  classrooms: ClassRoom[]
}

const steps = [
  { id: 1, label: 'Personal Info',    icon: <User size={16} /> },
  { id: 2, label: 'Academic Info',    icon: <BookOpen size={16} /> },
  { id: 3, label: 'Guardian',         icon: <Users size={16} /> },
  { id: 4, label: 'Review & Submit',  icon: <CheckCircle2 size={16} /> },
]

export default function CreateStudent({ classrooms }: CreateStudentProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const { data, setData, post, processing, errors } = useForm({
    // Step 1
    name:        '',
    email:       '',
    phone:       '',
    date_of_birth: '',
    gender:      '',
    blood_group: '',
    address:     '',
    // Step 2
    class_room_id:   '',
    admission_date:  new Date().toISOString().split('T')[0],
    // Step 3
    guardian_name:         '',
    guardian_email:        '',
    guardian_phone:        '',
    guardian_relationship: 'father',
    guardian_occupation:   '',
  })

  function next() { if (currentStep < 4) setCurrentStep(s => s + 1) }
  function prev() { if (currentStep > 1) setCurrentStep(s => s - 1) }

  function submit() {
    post('/admin/students', {
      onSuccess: () => {},
    })
  }

  const selectedClass = classrooms.find(c => c.id === Number(data.class_room_id))

  return (
    <AppLayout title="Add Student">
      <Head title="Add Student" />
      <PageHeader title="Add New Student"
        breadcrumbs={[{ label: 'Students', href: '/admin/students' }, { label: 'New Student' }]} />

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <button
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentStep === step.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : step.id < currentStep
                    ? 'bg-success-100 text-success-700 cursor-pointer hover:bg-success-200'
                    : 'bg-surface-100 text-surface-400 cursor-not-allowed'
              }`}
            >
              {step.id < currentStep ? <CheckCircle2 size={15} /> : step.icon}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.id}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${step.id < currentStep ? 'bg-success-300' : 'bg-surface-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name *" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} placeholder="Amara Obi" />
                <Input label="Email Address *" type="email" value={data.email} onChange={e => setData('email', e.target.value)} error={errors.email} placeholder="student@school.com" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone Number" type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+234 800 000 0000" />
                <Input label="Date of Birth *" type="date" value={data.date_of_birth} onChange={e => setData('date_of_birth', e.target.value)} error={errors.date_of_birth} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Gender *" value={data.gender} onChange={e => setData('gender', e.target.value)} error={errors.gender}
                  options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                  placeholder="Select gender" />
                <Select label="Blood Group" value={data.blood_group} onChange={e => setData('blood_group', e.target.value)}
                  options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))}
                  placeholder="Select blood group" />
              </div>
              <Textarea label="Home Address" value={data.address} onChange={e => setData('address', e.target.value)} rows={2} />
            </motion.div>
          )}

          {/* Step 2: Academic Info */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Academic Information</h2>
              <Select label="Assign to Class *" value={data.class_room_id} onChange={e => setData('class_room_id', e.target.value)} error={errors.class_room_id}
                options={classrooms.map(c => ({ value: c.id, label: `${c.name} (${c.academic_year})` }))}
                placeholder="Choose a class…" />
              <Input label="Admission Date" type="date" value={data.admission_date} onChange={e => setData('admission_date', e.target.value)} />
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                <p className="text-sm text-brand-700"><span className="font-semibold">Note:</span> The admission number will be auto-generated based on your school's prefix and sequence.</p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Guardian */}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 mb-4">Parent / Guardian Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Guardian Name" value={data.guardian_name} onChange={e => setData('guardian_name', e.target.value)} placeholder="Mr. John Obi" />
                <Input label="Guardian Email" type="email" value={data.guardian_email} onChange={e => setData('guardian_email', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone Number" type="tel" value={data.guardian_phone} onChange={e => setData('guardian_phone', e.target.value)} />
                <Select label="Relationship" value={data.guardian_relationship} onChange={e => setData('guardian_relationship', e.target.value)}
                  options={[{ value: 'father', label: 'Father' }, { value: 'mother', label: 'Mother' }, { value: 'guardian', label: 'Guardian' }, { value: 'sibling', label: 'Sibling' }]} />
              </div>
              <Input label="Occupation" value={data.guardian_occupation} onChange={e => setData('guardian_occupation', e.target.value)} placeholder="Engineer, Teacher, Business owner…" />
              <p className="text-xs text-surface-400">A portal account will be created for the guardian using this email.</p>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h2 className="text-lg font-semibold text-surface-900 mb-5">Review & Confirm</h2>
              <div className="space-y-4">
                {[
                  { title: 'Personal Information', rows: [
                    { label: 'Full Name', value: data.name },
                    { label: 'Email', value: data.email },
                    { label: 'Date of Birth', value: data.date_of_birth },
                    { label: 'Gender', value: data.gender },
                  ]},
                  { title: 'Academic Information', rows: [
                    { label: 'Class', value: selectedClass?.name ?? '—' },
                    { label: 'Admission Date', value: data.admission_date },
                  ]},
                  { title: 'Guardian', rows: [
                    { label: 'Name', value: data.guardian_name || '—' },
                    { label: 'Email', value: data.guardian_email || '—' },
                    { label: 'Relationship', value: data.guardian_relationship },
                  ]},
                ].map(section => (
                  <div key={section.title} className="rounded-xl border border-surface-200 overflow-hidden">
                    <div className="bg-surface-50 px-4 py-2.5 border-b border-surface-200">
                      <p className="text-sm font-semibold text-surface-700">{section.title}</p>
                    </div>
                    <div className="divide-y divide-surface-100">
                      {section.rows.map(row => (
                        <div key={row.label} className="flex items-center gap-4 px-4 py-2.5">
                          <span className="text-xs text-surface-400 w-32 flex-shrink-0">{row.label}</span>
                          <span className="text-sm text-surface-800 font-medium">{row.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-surface-100">
          <Button variant="outline" onClick={prev} disabled={currentStep === 1} icon={<ChevronLeft size={15} />}>
            Back
          </Button>
          {currentStep < 4 ? (
            <Button variant="primary" onClick={next} iconRight={<ChevronRight size={15} />}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" loading={processing} icon={<CheckCircle2 size={15} />} onClick={submit}>
              Register Student
            </Button>
          )}
        </div>
      </Card>
    </AppLayout>
  )
}
