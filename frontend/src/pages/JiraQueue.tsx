import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowRightLeft, FileText, LogOut, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { formatDate, getStatusColor, getPriorityColor } from '../lib/utils';
import type { JiraTicket, User } from '../types';

export default function JiraQueue() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('transfer_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;

      const response = await api.get<JiraTicket[]>('/jira/tickets', { params });
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await api.put(`/jira/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('transfer_token');
    localStorage.removeItem('transfer_user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-900 text-white">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-emerald-900 font-bold">W</span>
            </div>
            <div>
              <div className="font-semibold">Transfer Workflow</div>
              <div className="text-xs text-emerald-300">Wealthsimple CS</div>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-emerald-800 text-emerald-100"
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/zendesk')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-emerald-800 text-emerald-100"
            >
              <Ticket className="w-5 h-5" />
              <span>Zendesk Queue</span>
            </button>

            <button
              onClick={() => navigate('/jira')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-emerald-800 text-white"
            >
              <FileText className="w-5 h-5" />
              <span>JIRA Escalations</span>
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{user?.full_name}</div>
              <div className="text-xs text-emerald-300">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-emerald-800 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">JIRA Escalations</h1>
          <p className="text-gray-600">Tickets escalated to the transfers team</p>
        </header>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>No JIRA escalations yet</p>
                <p className="text-sm mt-2">
                  Escalations will appear here after you create them from Zendesk tickets
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ticket Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-blue-600">{ticket.ticket_key}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {ticket.summary}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded text-white ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded text-white ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.status !== 'Done' && (
                          <div className="flex items-center space-x-2">
                            {ticket.status === 'To Do' && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'In Progress')}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Start Progress
                              </button>
                            )}
                            {ticket.status === 'In Progress' && (
                              <button
                                onClick={() => handleUpdateStatus(ticket.id, 'Done')}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Mark Done</span>
                              </button>
                            )}
                          </div>
                        )}
                        {ticket.status === 'Done' && (
                          <span className="text-xs text-gray-500">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Stats */}
          {tickets.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {tickets.filter((t) => t.status === 'To Do').length}
                </div>
                <div className="text-sm text-gray-500">To Do</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {tickets.filter((t) => t.status === 'In Progress').length}
                </div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600">
                  {tickets.filter((t) => t.status === 'Done').length}
                </div>
                <div className="text-sm text-gray-500">Done</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
