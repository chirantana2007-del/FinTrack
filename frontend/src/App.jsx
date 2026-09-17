import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Transactions from './pages/Transactions';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import Report from './pages/Report';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
