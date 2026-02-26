import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Building2,
  User as UserIcon,
  Calendar,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api';
import { formatDate, formatCurrency, getStatusColor, getPriorityColor } from '../lib/utils';
import type { ZendeskTicket as ZendeskTicketType, TransferComparison, User } from '../types';

export default function ZendeskTicket() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ZendeskTicketType | null>(null);
  const [comparison, setComparison] = useState<TransferComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comparison'>('details');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationSummary, setEscalationSummary] = useState('');
  const [escalationDescription, setEscalationDescription] = useState('');
  const [escalationPriority, setEscalationPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  // Checklist state
  const [checklist, setChecklist] = useState({
    accountNumber: false,
    accountType: false,
    transferAmount: false,
    transferType: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('transfer_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchData();
  }, [ticketId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ticketRes = await api.get<ZendeskTicketType>(`/zendesk/tickets/${ticketId}`);
      setTicket(ticketRes.data);

      // If ticket has a transfer linked, fetch comparison data
      if (ticketRes.data.transfer_id) {
        const comparisonRes = await api.get<TransferComparison>(
          `/atlas/transfers/${ticketRes.data.transfer_id}/comparison`
        );
        setComparison(comparisonRes.data);

        // Pre-populate escalation fields
        const transfer = comparisonRes.data.transfer;
        setEscalationSummary(
          `Transfer Escalation: ${transfer.reference_number} - ${transfer.customer_name}`
        );
        setEscalationDescription(
          `Transfer Reference: ${transfer.reference_number}\n` +
            `Customer: ${transfer.customer_name}\n` +
            `From: ${transfer.from_institution}\n` +
            `To: ${transfer.to_institution}\n` +
            `Account Type: ${transfer.account_type}\n` +
            `Transfer Type: ${transfer.transfer_type}\n` +
            `Amount: ${formatCurrency(transfer.transfer_amount)}\n` +
            `Status: ${transfer.status}\n\n` +
            `Zendesk Ticket: ${ticketRes.data.ticket_number}\n\n` +
            `Notes: All documentation verified, no discrepancies found. Escalating for transfers team review.`
        );
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await api.post(`/zendesk/tickets/${ticketId}/assign`);
      fetchData();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const handleEscalate = async () => {
    if (!ticket?.transfer_id) return;

    try {
      setSubmitting(true);
      await api.post('/jira/tickets', {
        zendesk_ticket_id: ticket.id,
        transfer_id: ticket.transfer_id,
        summary: escalationSummary,
        description: escalationDescription,
        priority: escalationPriority,
      });

      setShowEscalateModal(false);
      navigate('/jira');
    } catch (error) {
      console.error('Failed to create JIRA ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const allChecked = Object.values(checklist).every(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/zendesk')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {ticket.ticket_number} - {ticket.subject}
              </h1>
              <p className="text-sm text-gray-600">
                {ticket.customer_name} ({ticket.customer_email})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded text-white text-sm ${getStatusColor(ticket.status)}`}
            >
              {ticket.status.replace('_', ' ')}
            </span>
            <span
              className={`px-3 py-1 rounded text-white text-sm ${getPriorityColor(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>
            {!ticket.assigned_agent_id && (
              <button
                onClick={handleAssignToMe}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Assign to me
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Ticket Details */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Customer Inquiry</h2>
              <div className="prose text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {formatDate(ticket.created_at)}
                </p>
                <p className="text-xs text-gray-500">
                  Transfer Reference: {ticket.transfer_reference || 'Not linked'}
                </p>
              </div>
            </div>

            {/* Verification Checklist */}
            {comparison && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Verification Checklist</h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.accountNumber}
                      onChange={(e) =>
                        setChecklist({ ...checklist, accountNumber: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm">Account number verified</span>
                    {comparison.mismatches.some((m) => m.field === 'account_number') && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.accountType}
                      onChange={(e) =>
                        setChecklist({ ...checklist, accountType: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm">Account type correct</span>
                    {comparison.mismatches.some((m) => m.field === 'account_type') && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.transferAmount}
                      onChange={(e) =>
                        setChecklist({ ...checklist, transferAmount: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm">Transfer amount matches</span>
                    {comparison.mismatches.some((m) => m.field === 'transfer_amount') && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.transferType}
                      onChange={(e) =>
                        setChecklist({ ...checklist, transferType: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm">Transfer type correct</span>
                    {comparison.mismatches.some((m) => m.field === 'transfer_type') && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </label>
                </div>

                {comparison.mismatches.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-700 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">
                        {comparison.mismatches.length} issue(s) detected
                      </span>
                    </div>
                    <p className="text-sm text-red-600">
                      Review the mismatches in the comparison view before proceeding.
                    </p>
                  </div>
                )}

                {comparison.mismatches.length === 0 && allChecked && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">All verifications passed</span>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    disabled={!allChecked || comparison.mismatches.length > 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Escalate to JIRA</span>
                  </button>
                  {comparison.mismatches.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Resolve mismatches before escalating
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Atlas & T2220 Comparison */}
          <div className="col-span-2">
            {!comparison ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transfer linked to this ticket</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'details'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Atlas Transfer Details
                      </button>
                      <button
                        onClick={() => setActiveTab('comparison')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'comparison'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        T2220 Form Comparison
                        {comparison.mismatches.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                            {comparison.mismatches.length}
                          </span>
                        )}
                      </button>
                    </nav>
                  </div>

                  {activeTab === 'details' && (
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-4">
                            Transfer Information
                          </h3>
                          <dl className="space-y-3">
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Reference</dt>
                              <dd className="text-sm font-medium">
                                {comparison.transfer.reference_number}
                              </dd>
                            </div>
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Customer</dt>
                              <dd className="text-sm">{comparison.transfer.customer_name}</dd>
                            </div>
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Status</dt>
                              <dd>
                                <span
                                  className={`px-2 py-1 text-xs rounded text-white ${getStatusColor(
                                    comparison.transfer.status
                                  )}`}
                                >
                                  {comparison.transfer.status}
                                </span>
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-4">
                            Account Details
                          </h3>
                          <dl className="space-y-3">
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Account #</dt>
                              <dd className="text-sm font-mono">
                                {comparison.transfer.account_number}
                              </dd>
                            </div>
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Account Type</dt>
                              <dd className="text-sm">{comparison.transfer.account_type}</dd>
                            </div>
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Transfer Type</dt>
                              <dd className="text-sm capitalize">
                                {comparison.transfer.transfer_type}
                              </dd>
                            </div>
                            <div className="flex items-start">
                              <dt className="w-32 text-sm text-gray-500">Amount</dt>
                              <dd className="text-sm font-medium">
                                {formatCurrency(comparison.transfer.transfer_amount)}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div className="col-span-2">
                          <h3 className="text-sm font-medium text-gray-500 mb-4">
                            Institution Transfer
                          </h3>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-500">From</span>
                              </div>
                              <p className="font-medium">
                                {comparison.transfer.from_institution}
                              </p>
                            </div>
                            <RefreshCw className="w-6 h-6 text-gray-400" />
                            <div className="flex-1 p-4 bg-emerald-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-emerald-600">To</span>
                              </div>
                              <p className="font-medium text-emerald-700">
                                {comparison.transfer.to_institution}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'comparison' && (
                    <div className="p-6">
                      {!comparison.t2220_form ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No T2220 form linked to this transfer</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <span className="text-sm text-gray-500">Form Number: </span>
                            <span className="font-medium">
                              {comparison.t2220_form.form_number}
                            </span>
                          </div>

                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="py-3 text-left text-sm font-medium text-gray-500">
                                  Field
                                </th>
                                <th className="py-3 text-left text-sm font-medium text-gray-500">
                                  Atlas Value
                                </th>
                                <th className="py-3 text-left text-sm font-medium text-gray-500">
                                  T2220 Form Value
                                </th>
                                <th className="py-3 text-left text-sm font-medium text-gray-500">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="py-3 text-sm">Account Number</td>
                                <td className="py-3 text-sm font-mono">
                                  {comparison.transfer.account_number}
                                </td>
                                <td className="py-3 text-sm font-mono">
                                  {comparison.t2220_form.account_number_on_form}
                                </td>
                                <td className="py-3">
                                  {comparison.transfer.account_number ===
                                  comparison.t2220_form.account_number_on_form ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3 text-sm">Account Type</td>
                                <td className="py-3 text-sm">
                                  {comparison.transfer.account_type}
                                </td>
                                <td className="py-3 text-sm">
                                  {comparison.t2220_form.account_type_on_form}
                                </td>
                                <td className="py-3">
                                  {comparison.transfer.account_type ===
                                  comparison.t2220_form.account_type_on_form ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3 text-sm">Transfer Amount</td>
                                <td className="py-3 text-sm">
                                  {formatCurrency(comparison.transfer.transfer_amount)}
                                </td>
                                <td className="py-3 text-sm">
                                  {formatCurrency(comparison.t2220_form.transfer_amount_on_form)}
                                </td>
                                <td className="py-3">
                                  {comparison.transfer.transfer_amount ===
                                  comparison.t2220_form.transfer_amount_on_form ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3 text-sm">Transfer Type</td>
                                <td className="py-3 text-sm capitalize">
                                  {comparison.transfer.transfer_type}
                                </td>
                                <td className="py-3 text-sm capitalize">
                                  {comparison.t2220_form.transfer_type_on_form}
                                </td>
                                <td className="py-3">
                                  {comparison.transfer.transfer_type ===
                                  comparison.t2220_form.transfer_type_on_form ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {comparison.mismatches.length > 0 && (
                            <div className="mt-6 p-4 bg-red-50 rounded-lg">
                              <h4 className="font-medium text-red-700 mb-2">
                                Detected Mismatches
                              </h4>
                              <ul className="space-y-2">
                                {comparison.mismatches.map((mismatch, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-red-600 flex items-start space-x-2"
                                  >
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                      <strong className="capitalize">
                                        {mismatch.field.replace('_', ' ')}
                                      </strong>
                                      : Atlas shows "{String(mismatch.atlas_value)}" but T2220
                                      form shows "{String(mismatch.form_value)}"
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Escalate to JIRA</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  value={escalationSummary}
                  onChange={(e) => setEscalationSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={escalationDescription}
                  onChange={(e) => setEscalationDescription(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={escalationPriority}
                  onChange={(e) => setEscalationPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create JIRA Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
