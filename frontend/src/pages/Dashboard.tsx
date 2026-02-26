import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowRightLeft, FileText, AlertCircle, LogOut } from 'lucide-react';
import api from '../lib/api';
import type { ZendeskTicket, JiraTicket, User } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [zendeskTickets, setZendeskTickets] = useState<ZendeskTicket[]>([]);
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('transfer_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [zendeskRes, jiraRes] = await Promise.all([
        api.get<ZendeskTicket[]>('/zendesk/tickets'),
        api.get<JiraTicket[]>('/jira/tickets'),
      ]);
      setZendeskTickets(zendeskRes.data);
      setJiraTickets(jiraRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('transfer_token');
    localStorage.removeItem('transfer_user');
    navigate('/login');
  };

  const openTickets = zendeskTickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = zendeskTickets.filter((t) => t.status === 'in_progress').length;
  const pendingEscalations = jiraTickets.filter((t) => t.status === 'To Do').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

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
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-emerald-800 text-white"
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
              {openTickets > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {openTickets}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/jira')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-emerald-800 text-emerald-100"
            >
              <FileText className="w-5 h-5" />
              <span>JIRA Escalations</span>
              {pendingEscalations > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingEscalations}
                </span>
              )}
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
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Transfer Status Workflow Overview</p>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                  <p className="text-3xl font-bold text-red-600">{openTickets}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600">{inProgressTickets}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Zendesk</p>
                  <p className="text-3xl font-bold text-gray-900">{zendeskTickets.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">JIRA Escalations</p>
                  <p className="text-3xl font-bold text-blue-600">{jiraTickets.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Transfer Status Workflow</h2>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-emerald-600 font-bold">1</span>
                </div>
                <p className="text-sm font-medium">Customer Ticket</p>
                <p className="text-xs text-gray-500">Zendesk inquiry</p>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-emerald-600 font-bold">2</span>
                </div>
                <p className="text-sm font-medium">Atlas Review</p>
                <p className="text-xs text-gray-500">Check transfer status</p>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-emerald-600 font-bold">3</span>
                </div>
                <p className="text-sm font-medium">T2220 Verify</p>
                <p className="text-xs text-gray-500">Cross-reference form</p>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-emerald-600 font-bold">4</span>
                </div>
                <p className="text-sm font-medium">Resolution</p>
                <p className="text-xs text-gray-500">Fix or escalate</p>
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold">Recent Zendesk Tickets</h3>
                <button
                  onClick={() => navigate('/zendesk')}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {zendeskTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/zendesk/${ticket.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {ticket.ticket_number}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded text-white ${
                          ticket.priority === 'urgent'
                            ? 'bg-red-500'
                            : ticket.priority === 'high'
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.customer_name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold">Recent JIRA Escalations</h3>
                <button
                  onClick={() => navigate('/jira')}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {jiraTickets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No escalations yet
                  </div>
                ) : (
                  jiraTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {ticket.ticket_key}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded text-white ${
                            ticket.status === 'Done'
                              ? 'bg-green-500'
                              : ticket.status === 'In Progress'
                              ? 'bg-blue-500'
                              : 'bg-gray-500'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{ticket.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
