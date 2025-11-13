import React, { useMemo, useState } from 'react'
import Card from '../components/atoms/Card'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import Badge from '../components/atoms/Badge'
import { Plus, RefreshCcw, Edit, Trash2 } from 'lucide-react'
import { CurrencyRate, UserRole } from '../types'
import { useCurrencyStore } from '../store/currencyStore'
import { useAuthStore } from '../store/authStore'

const CurrencyRatesPage: React.FC = () => {
  const { list, create, update, remove, baseCurrencyCode, preferredCurrency, setPreferred, refreshRates, currencies } = useCurrencyStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'All'>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [edit, setEdit] = useState<CurrencyRate | null>(null)
  const { user } = useAuthStore()

  const rows = list({ search, status })

  const [form, setForm] = useState({
    name: '',
    code: '',
    symbol: '',
    rateToBase: 1,
    status: 'Active' as 'Active' | 'Inactive',
  })

  const canModify = user?.role === UserRole.Admin

  const openCreate = () => {
    setEdit(null)
    setForm({ name: '', code: '', symbol: '', rateToBase: 1, status: 'Active' })
    setIsModalOpen(true)
  }
  const openEdit = (c: CurrencyRate) => {
    setEdit(c)
    setForm({ name: c.name, code: c.code, symbol: c.symbol, rateToBase: c.rateToBase, status: c.status })
    setIsModalOpen(true)
  }
  const submit = () => {
    if (!form.name || !form.code || !form.symbol || form.rateToBase <= 0) {
      alert('Please fill all required fields with valid values')
      return
    }
    if (edit) {
      update(edit.code, { ...form })
    } else {
      create({ ...form, createdBy: user?.name || 'Admin', createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() } as any)
    }
    setIsModalOpen(false)
  }

  const metrics = useMemo(() => {
    return {
      total: currencies.length,
      lastSync: new Date(Math.max(...currencies.map(c => new Date(c.lastUpdated).getTime()))).toLocaleString(),
      base: baseCurrencyCode,
    }
  }, [currencies, baseCurrencyCode])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Currency Rates</h2>
        <div className="flex gap-2">
          <Button variant="outline" icon={RefreshCcw} onClick={() => refreshRates()}>Refresh Rates</Button>
          {canModify && <Button variant="primary" icon={Plus} onClick={openCreate}>Add Currency</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-sm text-textSecondary">Supported Currencies</div><div className="text-2xl font-bold text-text">{metrics.total}</div></Card>
        <Card><div className="text-sm text-textSecondary">Last Sync</div><div className="text-2xl font-bold text-text">{metrics.lastSync}</div></Card>
        <Card><div className="text-sm text-textSecondary">Base Currency</div><div className="text-2xl font-bold text-text">{metrics.base}</div></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search currency name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Preferred Currency</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={preferredCurrency} onChange={(e) => setPreferred(e.target.value)}>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Table<CurrencyRate>
        data={rows}
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'name', header: 'Name' },
          { key: 'symbol', header: 'Symbol' },
          { key: 'rateToBase', header: `Rate to ${baseCurrencyCode}`, render: (c) => <span>{c.rateToBase.toFixed(4)}</span> },
          { key: 'lastUpdated', header: 'Last Updated', render: (c) => <span>{new Date(c.lastUpdated).toLocaleString()}</span> },
          { key: 'status', header: 'Status', render: (c) => <Badge variant={c.status === 'Active' ? 'success' : 'outline'}>{c.status}</Badge> },
          {
            key: 'actions', header: 'Actions', className: 'text-right', render: (c) => (
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label="Edit"><Edit className="h-4 w-4" /></Button>
                {canModify && <Button variant="ghost" size="sm" onClick={() => remove(c.code)} aria-label="Delete"><Trash2 className="h-4 w-4 text-error" /></Button>}
              </div>
            )
          }
        ]}
        emptyMessage="No currencies found."
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={edit ? 'Edit Currency' : 'Add Currency'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <FormField label="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
          <FormField label="Rate to Base" type="number" value={form.rateToBase} onChange={(e) => setForm({ ...form, rateToBase: parseFloat(e.target.value) || 0 })} min={0.0001} step="0.0001" required />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{edit ? 'Save' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  )
}

export default CurrencyRatesPage


