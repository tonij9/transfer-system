import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ZendeskQueue from './pages/ZendeskQueue';
import ZendeskTicket from './pages/ZendeskTicket';
import JiraQueue from './pages/JiraQueue';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('transfer_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zendesk"
          element={
            <ProtectedRoute>
              <ZendeskQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zendesk/:ticketId"
          element={
            <ProtectedRoute>
              <ZendeskTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jira"
          element={
            <ProtectedRoute>
              <JiraQueue />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
