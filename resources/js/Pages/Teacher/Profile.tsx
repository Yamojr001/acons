import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Input } from '@/Components/UI'
import { User, Phone, Book, Save, AlertCircle } from 'lucide-react'
import { FormEventHandler } from 'react'
import type { PageProps, User as UserType } from '@/types'

type TeacherProfile = {
  id: number;
  user_id: number;
  qualification: string | null;
}

interface Props extends PageProps {
  user: UserType & { teacher?: TeacherProfile }
  success?: string
}

export default function Profile({ user, success }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name || '',
    phone: user.phone || '',
    qualification: user.teacher?.qualification || '',
  })

  // Since we don't have direct access to a toast library in this scope,
  // we can use standard alert or display inline flash messages.
  // Assuming a global flash message component is available in AppLayout or we display here.

  const submit: FormEventHandler = (e) => {
    e.preventDefault()
    put('/lecturer/profile', {
      preserveScroll: true,
      onSuccess: () => {
        // success message is handled via props usually
      }
    })
  }

  return (
    <AppLayout title="My Profile">
      <Head title="My Profile" />

      <div className="mb-6">
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-surface-500 mt-1">
          Manage your personal information and teaching credentials.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {success && (
          <div className="p-4 bg-success-50 text-success-800 rounded-xl flex items-center gap-3 border border-success-200">
            <AlertCircle size={20} className="text-success-600" />
            <span className="font-medium text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <Card className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-3 mb-4">
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-surface-400" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      className="pl-10 w-full"
                      value={data.name}
                      onChange={e => setData('name', e.target.value)}
                      required
                    />
                  </div>
                  {errors.name && <p className="text-sm text-danger-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-surface-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-surface-400" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10 w-full"
                      value={data.phone}
                      onChange={e => setData('phone', e.target.value)}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-danger-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6">
              <h2 className="text-lg font-semibold text-surface-900 border-b border-surface-100 pb-3 mb-4">
                Teaching Credentials
              </h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="qualification" className="block text-sm font-medium text-surface-700 mb-1">
                    Degrees / Qualifications
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex flex-col pt-3 pointer-events-none">
                      <Book size={18} className="text-surface-400" />
                    </div>
                    <textarea
                      id="qualification"
                      className="pl-10 w-full rounded-xl border-surface-200 focus:border-brand-500 focus:ring-brand-500 min-h-[100px] text-sm py-3"
                      placeholder="e.g. Master of Education (M.Ed.), B.Sc. Mathematics..."
                      value={data.qualification}
                      onChange={e => setData('qualification', e.target.value)}
                    ></textarea>
                  </div>
                  {errors.qualification && <p className="text-sm text-danger-500 mt-1">{errors.qualification}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={processing}
                className="min-w-[140px]"
              >
                {processing ? 'Saving...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}
