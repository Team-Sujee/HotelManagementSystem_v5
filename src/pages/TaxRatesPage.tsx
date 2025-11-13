import React, { useMemo, useState } from 'react'
import Card from '../components/atoms/Card'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import Badge from '../components/atoms/Badge'
import { Plus, Filter, Edit, Trash2 } from 'lucide-react'
import { TaxRate, TaxScope, UserRole } from '../types'
import { useTaxStore } from '../store/taxStore'
import { useAuthStore } from '../store/authStore'

const TaxRatesPage: React.FC = () => {
  const { list, create, update, remove } = useTaxStore()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<TaxScope | 'All'>('All')
  const [active, setActive] = useState<boolean | 'All'>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTax, setEditTax] = useState<TaxRate | null>(null)
  const { user } = useAuthStore()

  const taxes = list({ search, scope, active })

  const [form, setForm] = useState({
    name: '',
    percentage: 0,
    code: '',
    scope: TaxScope.Global as TaxScope,
    effectiveFrom: '',
    effectiveTo: '',
  })

  const canModify = user?.role === UserRole.Admin

  const openCreate = () => {
    setEditTax(null)
    setForm({
      name: '',
      percentage: 0,
      code: '',
      scope: TaxScope.Global,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
    })
    setIsModalOpen(true)
  }

  const openEdit = (tax: TaxRate) => {
    setEditTax(tax)
    setForm({
      name: tax.name,
      percentage: tax.percentage,
      code: tax.code || '',
      scope: tax.scope,
      effectiveFrom: tax.effectiveFrom.split('T')[0],
      effectiveTo: tax.effectiveTo ? tax.effectiveTo.split('T')[0] : '',
    })
    setIsModalOpen(true)
  }

  const submit = () => {
    if (!form.name || form.percentage < 0) {
      alert('Please provide a valid name and percentage')
      return
    }
    if (editTax) {
      update(editTax.id, {
        ...form,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        effectiveTo: form.effectiveTo ? new Date(form.effectiveTo).toISOString() : undefined,
      })
    } else {
      create({
        ...form,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        effectiveTo: form.effectiveTo ? new Date(form.effectiveTo).toISOString() : undefined,
        createdBy: user?.name || 'Admin',
      } as any)
    }
    setIsModalOpen(false)
  }

  const columns = useMemo(() => [
    { key: 'name', header: 'Tax Name' },
    { key: 'percentage', header: 'Rate (%)', render: (t: TaxRate) => <span>{t.percentage.toFixed(2)}</span> },
    { key: 'code', header: 'Code' },
    { key: 'scope', header: 'Scope' },
    { key: 'effective', header: 'Effective', render: (t: TaxRate) => (
      <div className="text-sm">
        <div>From: {new Date(t.effectiveFrom).toLocaleDateString()}</div>
        <div className="text-textSecondary">To: {t.effectiveTo ? new Date(t.effectiveTo).toLocaleDateString() : '—'}</div>
      </div>
    ) },
    { key: 'active', header: 'Status', render: (t: TaxRate) => <Badge variant={t.active ? 'success' : 'outline'}>{t.active ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (t: TaxRate) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(t)} aria-label="Edit"><Edit className="h-4 w-4" /></Button>
          {canModify && (
            <Button variant="ghost" size="sm" onClick={() => remove(t.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-error" /></Button>
          )}
        </div>
      ),
    },
  ], [canModify])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Tax Management</h2>
        {canModify && (
          <Button variant="primary" icon={Plus} onClick={openCreate}>Add Tax</Button>
        )}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search tax name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Scope</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={scope} onChange={(e) => setScope(e.target.value as any)}>
              <option value="All">All</option>
              {Object.values(TaxScope).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={active} onChange={(e) => setActive(e.target.value === 'All' ? 'All' : e.target.value === 'true')}>
              <option value="All">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      <Table<TaxRate> data={taxes} columns={columns} emptyMessage="No tax records found." />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTax ? 'Edit Tax' : 'Add Tax'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Tax Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormField label="Tax Percentage" type="number" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: parseFloat(e.target.value) || 0 })} min={0} required />
          <FormField label="Tax Code (optional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Scope</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as TaxScope })}>
              {Object.values(TaxScope).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <FormField label="Effective From" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} required />
          <FormField label="Effective To" type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{editTax ? 'Save' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  )
}

export default TaxRatesPage


