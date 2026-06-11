import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Button, Card, Badge } from '@/Components/UI'
import { Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Roles({ roles, groupedPermissions }: any) {
  const [editingRole, setEditingRole] = useState<any>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<number[]>([])

  const coreRoles = ['super_admin', 'school_admin', 'teacher', 'lecturer', 'student', 'registrar', 'bursar', 'admissions_officer', 'exam_officer', 'hod', 'dean', 'accountant']

  const togglePerm = (id: number) => {
    setSelectedPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleSave = () => {
    if (editingRole && editingRole.id) {
      router.put(`/admin/roles/${editingRole.id}`, { name: newRoleName, permissions: selectedPerms }, {
        onSuccess: () => { setEditingRole(null); toast.success('Role updated') }
      })
    } else {
      router.post('/admin/roles', { name: newRoleName, permissions: selectedPerms }, {
        onSuccess: () => { setEditingRole(null); toast.success('Custom role created') }
      })
    }
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to completely delete this custom role? This will revoke access for attached users!')) {
      router.delete(`/admin/roles/${id}`, {
        onSuccess: () => toast.success('Role deleted')
      })
    }
  }

  const handleSelectAll = (perms: any[], state: boolean) => {
    const ids = perms.map((p: any) => p.id)
    if (state) {
        setSelectedPerms(prev => Array.from(new Set([...prev, ...ids])))
    } else {
        setSelectedPerms(prev => prev.filter(p => !ids.includes(p)))
    }
  }

  return (
    <AppLayout title="Roles & Permissions">
      <Head title="Roles & Permissions" />
      <div className="mb-6 flex justify-between items-center bg-gradient-to-r from-brand-50 to-white p-6 rounded-2xl border border-surface-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-display text-surface-900 tracking-tight">Security & Access Control</h1>
          <p className="text-surface-500 mt-1 max-w-xl text-sm">Create custom roles (like Receptionist or Assistant) and assign granular module permissions.</p>
        </div>
        {!editingRole && (
          <Button onClick={() => { setEditingRole({}); setSelectedPerms([]); setNewRoleName('') }} iconLeft={<Plus size={16}/>}>
            New Custom Role
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roles Sidebar */}
        <div className={`space-y-4 ${editingRole !== null ? 'lg:col-span-4' : 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:space-y-0'}`}>
          {roles.map((role: any) => (
            <Card key={role.id} className="p-5 flex flex-col gap-4 border border-surface-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold capitalize text-surface-900 flex items-center gap-2 text-lg">
                    {role.name.replace('_', ' ')}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    {coreRoles.includes(role.name) 
                        ? <Badge variant="brand">System Core</Badge> 
                        : <Badge variant="success">Custom Role</Badge>}
                    <span className="text-xs text-surface-500 font-medium">
                        {role.permissions?.length || 0} Permissions
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 bg-surface-50 p-1 rounded-lg border border-surface-100">
                  <button onClick={() => {
                    setEditingRole(role)
                    setNewRoleName(role.name)
                    setSelectedPerms(role.permissions?.map((p: any) => p.id) || [])
                  }} className="text-surface-500 hover:text-brand-600 p-1.5 transition-colors" title="Edit Permissions">
                      <Edit2 size={16}/>
                  </button>
                  {!coreRoles.includes(role.name) && (
                    <button onClick={() => handleDelete(role.id)} className="text-surface-500 hover:text-danger-600 p-1.5 transition-colors" title="Delete Role">
                        <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Editor Area */}
        {editingRole !== null && (
          <div className="lg:col-span-8">
            <Card className="shadow-lg border-surface-200">
              <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-brand-500" />
                    {editingRole.id ? `Edit ${editingRole.name.replace('_', ' ')}` : 'Define New Custom Role'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setEditingRole(null)}>Close</Button>
              </div>
              
              <div className="p-6">
                  <div className="mb-8 max-w-sm">
                    <label className="text-sm font-semibold text-surface-800 mb-2 block">Role Label</label>
                    <input 
                      type="text" 
                      value={newRoleName} 
                      onChange={e => setNewRoleName(e.target.value)}
                      disabled={editingRole.id && coreRoles.includes(editingRole.name)}
                      className="w-full border-surface-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 shadow-sm"
                      placeholder="e.g., Guidance Counselor"
                    />
                    {editingRole.id && coreRoles.includes(editingRole.name) && (
                        <p className="text-xs text-brand-600 mt-2 font-medium">You cannot rename core system roles.</p>
                    )}
                  </div>

                  <div className="space-y-8">
                    <h3 className="font-bold text-surface-900 border-b border-surface-100 pb-3 text-lg">Permission Mapping Matrix</h3>
                    
                    {Object.entries(groupedPermissions).map(([entity, perms]: any) => {
                        const allSelected = perms.every((p: any) => selectedPerms.includes(p.id));
                        return (
                          <div key={entity} className="bg-surface-50 rounded-xl p-5 border border-surface-200 hover:border-surface-300 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-md text-surface-800 capitalize">{entity.replace('_', ' ')}</h4>
                                <button 
                                    onClick={() => handleSelectAll(perms, !allSelected)}
                                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 px-2 py-1 rounded-md"
                                >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {perms.map((p: any) => (
                                <label 
                                    key={p.id} 
                                    className={`flex items-center gap-2.5 cursor-pointer px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm
                                        ${selectedPerms.includes(p.id) 
                                            ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' 
                                            : 'bg-white border-surface-200 hover:border-brand-200'
                                        }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={selectedPerms.includes(p.id)}
                                    onChange={() => togglePerm(p.id)}
                                    className="text-brand-600 rounded focus:ring-brand-500 border-surface-300 w-4 h-4 cursor-pointer"
                                  />
                                  <span className={`text-sm tracking-wide capitalize ${selectedPerms.includes(p.id) ? 'font-semibold text-brand-900' : 'font-medium text-surface-700'}`}>
                                      {p.action}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                      )
                    })}
                  </div>

                  <div className="mt-8 pt-6 border-t border-surface-100 flex gap-3 justify-end items-center bg-surface-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <p className="text-xs text-surface-500 mr-auto font-medium">Changes apply immediately to all assigned users.</p>
                    <Button variant="outline" onClick={() => setEditingRole(null)}>Discard</Button>
                    <Button onClick={handleSave} className="shadow-md">Save Permissions</Button>
                  </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
