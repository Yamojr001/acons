import { useState } from 'react'
import { Head, Link, router, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader, DataTable, Modal } from '@/Components/UI/Advanced'
import { SearchInput, Badge, Button, Avatar, Input } from '@/Components/UI'
import { Plus, Building, UserCheck, DollarSign } from 'lucide-react'

export default function Schools({ schools, filters }: any) {
  const [search, setSearch] = useState(filters.search || '')

  function handleSearch(q: string) {
    setSearch(q)
    router.get('/superadmin/schools', { search: q, plan: filters.plan }, { preserveState: true, replace: true })
  }

  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  
  const { data, setData, post, processing, reset, errors } = useForm({
    session: '',
    term: '1st Term',
    amount: ''
  })

  function handleSuspend(id: number) {
    if (confirm('Are you sure you want to suspend this school? They will lose access.')) {
      router.delete(`/superadmin/schools/${id}`)
    }
  }

  function handlePortalPayment(e: React.FormEvent) {
    e.preventDefault()
    post(`/superadmin/schools/${selectedSchool.id}/portal-payment`, {
      onSuccess: () => {
        setSelectedSchool(null)
        reset()
      }
    })
  }

  return (
    <AppLayout title="Tenant Institutions">
      <Head title="Manage Institutions" />
      
      <PageHeader 
        title="Managed Institutions" 
        subtitle="View and manage all tenant institutions subscribed to the platform."
        actions={
          <Link href="/superadmin/schools/create">
            <Button variant="primary" className="flex items-center gap-2">
               <Plus size={16} /> Onboard Institution
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
        <div className="p-4 border-b border-surface-200 flex items-center justify-between gap-4">
          <div className="w-full max-w-sm">
            <SearchInput value={search} onChange={handleSearch} placeholder="Search institutions or subdomains..." />
          </div>
        </div>

        <DataTable 
          columns={[
            { key: 'name', label: 'Institution', render: (row: any) => (
              <div className="flex items-center gap-3">
                <Avatar name={row.name} src={row.logo_path} size="md" />
                <div>
                  <div className="font-semibold text-surface-900">{row.name}</div>
                  <div className="text-xs text-surface-500 font-mono mt-0.5">{row.subdomain}.localhost</div>
                </div>
              </div>
            )},
            { key: 'subscription_plan', label: 'Plan', render: (row: any) => (
              <Badge variant="brand" className="uppercase text-[10px] tracking-wider">{row.subscription_plan}</Badge>
            )},
            { key: 'students_count', label: 'Students', render: (row: any) => (
              <div className="flex items-center gap-1.5 text-surface-600">
                <UserCheck size={14} /> {row.students_count?.toLocaleString() || 0}
              </div>
            )},
            { key: 'is_active', label: 'Status', render: (row: any) => (
              <Badge variant={row.is_active ? 'success' : 'danger'}>{row.is_active ? 'Active' : 'Suspended'}</Badge>
            )},
            { key: 'actions', label: '', render: (row: any) => (
              <div className="flex justify-end gap-3 pr-4">
                <button 
                  onClick={() => setSelectedSchool(row)} 
                  className="text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors"
                >
                  Record Payment
                </button>
                {row.is_active && (
                  <button onClick={() => handleSuspend(row.id)} className="text-sm text-danger-600 hover:text-danger-800 font-medium transition-colors">
                    Suspend
                  </button>
                )}
              </div>
            )}
          ]}
          data={schools.data}
          rowKey="id"
          emptyTitle="No institutions found"
        />
        
        {/* Pagination placeholder if needed */}
      </div>

      <Modal 
        isOpen={!!selectedSchool} 
        onClose={() => setSelectedSchool(null)} 
        title={`Record Portal Fee - ${selectedSchool?.name}`}
      >
        <form onSubmit={handlePortalPayment} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Academic Session *</label>
            <Input 
              value={data.session} 
              onChange={e => setData('session', e.target.value)} 
              required
              placeholder="e.g. 2024/2025"
            />
            {errors.session && <p className="text-red-500 text-xs mt-1">{errors.session}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Term *</label>
            <select 
              className="input-select bg-white w-full"
              value={data.term}
              onChange={e => setData('term', e.target.value as any)}
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Amount Paid (₦) *</label>
            <Input 
              type="number"
              value={data.amount} 
              onChange={e => setData('amount', e.target.value)} 
              required
              placeholder="e.g. 50000"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setSelectedSchool(null)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={processing} icon={<DollarSign size={16} />}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
