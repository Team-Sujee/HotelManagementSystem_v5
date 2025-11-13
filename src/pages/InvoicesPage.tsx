import React, { useState, useMemo } from 'react'
import { MOCK_INVOICES, MOCK_ADDITIONAL_BILLINGS, MOCK_REFUNDS, MOCK_CREDIT_NOTES, MOCK_RESERVATIONS } from '../constants'
import { Invoice, AdditionalBilling, Refund, CreditNote, InvoiceType, InvoiceStatus, PaymentMethod, MealPlanCode } from '../types'
import { useMealPlansStore } from '../store/mealPlansStore'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import DashboardWidget from '../components/organisms/DashboardWidget'
import Dropdown, { DropdownItem } from '../components/molecules/Dropdown'
import { 
  Plus, Search, Eye, Download, DollarSign, Receipt,
  FileText, TrendingUp, Filter, Calendar, CreditCard
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES)
  const [additionalBillings, setAdditionalBillings] = useState<AdditionalBilling[]>(MOCK_ADDITIONAL_BILLINGS)
  const [refunds, setRefunds] = useState<Refund[]>(MOCK_REFUNDS)
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(MOCK_CREDIT_NOTES)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All')
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isAdditionalBillingModalOpen, setIsAdditionalBillingModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<'invoices' | 'additional' | 'refunds' | 'creditNotes'>('invoices')
  const mealPlans = useMealPlansStore((state) => state.mealPlans)

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalPayments = invoices
      .filter(i => i.status === InvoiceStatus.Paid)
      .reduce((sum, i) => sum + i.paidAmount, 0)
    const pendingPayments = invoices
      .filter(i => i.status === InvoiceStatus.Pending)
      .reduce((sum, i) => sum + i.dueAmount, 0)
    const totalRefunds = refunds
      .filter(r => r.status === InvoiceStatus.Processed)
      .reduce((sum, r) => sum + r.amount, 0)
    const totalCreditNotes = creditNotes
      .filter(cn => cn.status === InvoiceStatus.Applied)
      .reduce((sum, cn) => sum + cn.amount, 0)

    return {
      totalPayments,
      pendingPayments,
      totalRefunds,
      totalCreditNotes,
    }
  }, [invoices, refunds, creditNotes])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.guestEmail.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'All' || invoice.type === typeFilter
      const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [invoices, searchTerm, typeFilter, statusFilter])

  // Chart data for monthly revenue
  const monthlyRevenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    return months.map(month => ({
      name: month,
      revenue: Math.floor(Math.random() * 50000) + 20000,
      refunds: Math.floor(Math.random() * 5000),
    }))
  }, [])

  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Paid:
      case InvoiceStatus.Processed:
      case InvoiceStatus.Applied:
        return 'success'
      case InvoiceStatus.Pending:
        return 'secondary'
      case InvoiceStatus.Rejected:
        return 'error'
      default:
        return 'outline'
    }
  }

  const getMealPlanLabel = (code?: MealPlanCode) => {
    const resolvedCode = code || MealPlanCode.RO
    const plan = mealPlans.find(p => p.code === resolvedCode)
    return plan ? `${plan.code} – ${plan.name}` : resolvedCode
  }

  const invoiceColumns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (invoice: Invoice) => (
        <span className="font-medium text-primary">{invoice.invoiceNumber}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (invoice: Invoice) => <Badge variant="outline">{invoice.type}</Badge>,
    },
    {
      key: 'guestName',
      header: 'Guest',
      render: (invoice: Invoice) => (
        <div>
          <div className="font-medium">{invoice.guestName}</div>
          <div className="text-sm text-textSecondary">{invoice.guestEmail}</div>
        </div>
      ),
    },
    {
      key: 'mealPlanCode',
      header: 'Meal Plan',
      render: (invoice: Invoice) => (
        <Badge variant="outline">{getMealPlanLabel(invoice.mealPlanCode)}</Badge>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (invoice: Invoice) => (
        <div>
          <div className="font-semibold">${invoice.totalAmount.toFixed(2)}</div>
          {invoice.dueAmount > 0 && (
            <div className="text-sm text-error">Due: ${invoice.dueAmount.toFixed(2)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice: Invoice) => (
        <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      render: (invoice: Invoice) => (
        <span className="text-sm">{new Date(invoice.issueDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedInvoice(invoice)
              setIsInvoiceModalOpen(true)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" icon={Download}>
            PDF
          </Button>
        </div>
      ),
    },
  ]

  const additionalBillingColumns = [
    {
      key: 'serviceName',
      header: 'Service',
      render: (billing: AdditionalBilling) => <span className="font-medium">{billing.serviceName}</span>,
    },
    {
      key: 'reservationId',
      header: 'Reservation ID',
      render: (billing: AdditionalBilling) => <span className="text-sm">{billing.reservationId}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (billing: AdditionalBilling) => (
        <span className="text-sm">{new Date(billing.date).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (billing: AdditionalBilling) => (
        <span className="font-semibold text-primary">${billing.totalAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (billing: AdditionalBilling) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={Eye}>View</Button>
          <Button variant="ghost" size="sm" icon={Download}>PDF</Button>
        </div>
      ),
    },
  ]

  const refundColumns = [
    {
      key: 'refundNumber',
      header: 'Refund #',
      render: (refund: Refund) => (
        <span className="font-medium text-primary">{refund.refundNumber}</span>
      ),
    },
    {
      key: 'guestName',
      header: 'Guest',
      render: (refund: Refund) => <span className="font-medium">{refund.guestName}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (refund: Refund) => (
        <span className="font-semibold text-error">${refund.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (refund: Refund) => <span className="text-sm">{refund.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (refund: Refund) => (
        <Badge variant={getStatusBadgeVariant(refund.status)}>{refund.status}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (refund: Refund) => (
        <span className="text-sm">{new Date(refund.createdAt).toLocaleDateString()}</span>
      ),
    },
  ]

  const creditNoteColumns = [
    {
      key: 'creditNoteNumber',
      header: 'Credit Note #',
      render: (note: CreditNote) => (
        <span className="font-medium text-primary">{note.creditNoteNumber}</span>
      ),
    },
    {
      key: 'invoiceId',
      header: 'Invoice ID',
      render: (note: CreditNote) => <span className="text-sm">{note.invoiceId}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (note: CreditNote) => (
        <span className="font-semibold text-success">${note.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (note: CreditNote) => <span className="text-sm">{note.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (note: CreditNote) => (
        <Badge variant={getStatusBadgeVariant(note.status)}>{note.status}</Badge>
      ),
    },
    {
      key: 'issuedDate',
      header: 'Issued Date',
      render: (note: CreditNote) => (
        <span className="text-sm">{new Date(note.issuedDate).toLocaleDateString()}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Invoice & Financial Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download}>
            Export Report
          </Button>
          {activeTab === 'invoices' && (
            <Button variant="primary" icon={Plus}>
              Create Invoice
            </Button>
          )}
          {activeTab === 'additional' && (
            <Button variant="primary" icon={Plus} onClick={() => setIsAdditionalBillingModalOpen(true)}>
              Add Billing
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget 
          metric={{
            title: 'Total Payments',
            value: `$${kpis.totalPayments.toLocaleString()}`,
            icon: DollarSign,
            colorClass: 'text-success',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Pending Payments',
            value: `$${kpis.pendingPayments.toLocaleString()}`,
            icon: CreditCard,
            colorClass: 'text-error',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Total Refunds',
            value: `$${kpis.totalRefunds.toLocaleString()}`,
            icon: TrendingUp,
            colorClass: 'text-error',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Credit Notes',
            value: `$${kpis.totalCreditNotes.toLocaleString()}`,
            icon: FileText,
            colorClass: 'text-secondary',
          }}
        />
      </div>

      {/* Revenue Chart */}
      <Card title="Monthly Revenue & Refunds">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
            <XAxis dataKey="name" stroke="#A3A3A3" />
            <YAxis stroke="#A3A3A3" />
            <Tooltip
              contentStyle={{ backgroundColor: '#262626', border: '1px solid #2F2F2F', borderRadius: '8px' }}
              itemStyle={{ color: '#FFFFFF' }}
              labelStyle={{ color: '#9E7FFF' }}
            />
            <Legend wrapperStyle={{ color: '#A3A3A3' }} />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
            <Line type="monotone" dataKey="refunds" stroke="#ef4444" strokeWidth={2} name="Refunds" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('additional')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'additional'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Additional Billing ({additionalBillings.length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'refunds'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Refunds ({refunds.length})
        </button>
        <button
          onClick={() => setActiveTab('creditNotes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'creditNotes'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Credit Notes ({creditNotes.length})
        </button>
      </div>

      {/* Filters for Invoices */}
      {activeTab === 'invoices' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by invoice #, guest name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <Dropdown
            trigger={
              <Button variant="outline" icon={Filter}>
                Type: {typeFilter}
              </Button>
            }
          >
            <DropdownItem onClick={() => setTypeFilter('All')}>All Types</DropdownItem>
            {Object.values(InvoiceType).map(type => (
              <DropdownItem key={type} onClick={() => setTypeFilter(type)}>
                {type}
              </DropdownItem>
            ))}
          </Dropdown>
          <Dropdown
            trigger={
              <Button variant="outline" icon={Filter}>
                Status: {statusFilter}
              </Button>
            }
          >
            <DropdownItem onClick={() => setStatusFilter('All')}>All Status</DropdownItem>
            {Object.values(InvoiceStatus).map(status => (
              <DropdownItem key={status} onClick={() => setStatusFilter(status)}>
                {status}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      )}

      {/* Invoices Table */}
      {activeTab === 'invoices' && (
        <Table<Invoice>
          data={filteredInvoices}
          columns={invoiceColumns}
          emptyMessage="No invoices found."
        />
      )}

      {/* Additional Billing Table */}
      {activeTab === 'additional' && (
        <Table<AdditionalBilling>
          data={additionalBillings}
          columns={additionalBillingColumns}
          emptyMessage="No additional billings found."
        />
      )}

      {/* Refunds Table */}
      {activeTab === 'refunds' && (
        <Table<Refund>
          data={refunds}
          columns={refundColumns}
          emptyMessage="No refunds found."
        />
      )}

      {/* Credit Notes Table */}
      {activeTab === 'creditNotes' && (
        <Table<CreditNote>
          data={creditNotes}
          columns={creditNoteColumns}
          emptyMessage="No credit notes found."
        />
      )}

      {/* Invoice Details Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice Details'}
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-textSecondary">Invoice Type</p>
                <Badge variant="outline">{selectedInvoice.type}</Badge>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Status</p>
                <Badge variant={getStatusBadgeVariant(selectedInvoice.status)}>
                  {selectedInvoice.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Guest Name</p>
                <p className="font-medium">{selectedInvoice.guestName}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Email</p>
                <p className="font-medium">{selectedInvoice.guestEmail}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Meal Plan</p>
                <Badge variant="outline">{getMealPlanLabel(selectedInvoice.mealPlanCode)}</Badge>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Issue Date</p>
                <p className="font-medium">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
              </div>
              {selectedInvoice.dueDate && (
                <div>
                  <p className="text-sm text-textSecondary">Due Date</p>
                  <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-text mb-3">Invoice Items</h4>
              <div className="space-y-2">
                {selectedInvoice.items.map(item => (
                  <div key={item.id} className="flex justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-textSecondary">
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Subtotal:</span>
                  <span className="text-text">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Tax:</span>
                  <span className="text-text">${selectedInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold text-text">Total Amount:</span>
                  <span className="font-bold text-primary">${selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Paid:</span>
                  <span className="text-success">${selectedInvoice.paidAmount.toFixed(2)}</span>
                </div>
                {selectedInvoice.dueAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Due:</span>
                    <span className="text-error">${selectedInvoice.dueAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button variant="outline" icon={Download}>Download PDF</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default InvoicesPage


