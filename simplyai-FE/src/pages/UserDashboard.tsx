import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import UserDashboardComponent from '@/components/UserDashboard';
import AdvancedReportGenerator from '@/components/chatgpt/AdvancedReportGenerator';

const UserDashboard = () => {
  return (
    <Routes>
      <Route index element={<UserDashboardComponent />} />
      <Route path="report-generator/:responseId" element={<AdvancedReportGenerator />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default UserDashboard;