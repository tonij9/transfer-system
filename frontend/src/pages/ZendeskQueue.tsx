import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowRightLeft, FileText, LogOut, Search, Filter } from 'lucide-react';
import api from '../lib/api';
import { formatDate, getStatusColor, getPriorityColor } from '../lib/utils';
import type { ZendeskTicket, User } from '../types';

export default function ZendeskQueue() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ZendeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('transfer_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get<ZendeskTicket[]>('/zendesk/tickets', { params });
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('transfer_token');
    localStorage.removeItem('transfer_user');
    navigate('/login');
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.ticket_number.toLowerCase().includes(search) ||
      ticket.customer_name.toLowerCase().includes(search) ||
      ticket.subject.toLowerCase().includes(search) ||
      ticket.transfer_reference?.toLowerCase().includes(search)
    );
  });

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
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-emerald-800 text-white"
            >
              <Ticket className="w-5 h-5" />
              <span>Zendesk Queue</span>
            </button>

            <button
              onClick={() => navigate('/jira')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-emerald-800 text-emerald-100"
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
          <h1 className="text-2xl font-semibold text-gray-900">Zendesk Queue</h1>
          <p className="text-gray-600">Customer transfer inquiries</p>
        </header>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tickets found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transfer Ref
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/zendesk/${ticket.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-emerald-600">
                          {ticket.ticket_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{ticket.customer_name}</div>
                        <div className="text-xs text-gray-500">{ticket.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {ticket.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {ticket.transfer_reference || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded text-white ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
