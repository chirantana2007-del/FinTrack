import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Transactions from './pages/Transactions';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import Report from './pages/Report';
import ProtectedRoute from './ProtectedRoute';

function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('darkMode') === 'true' || false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Toggle Dark Mode"
      >
        <span className="material-symbols-outlined text-[24px]">
          {darkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </>
  );
}

export default App;
