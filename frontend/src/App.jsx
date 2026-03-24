import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DestinationSelection from './components/DestinationSelection';
import ApplicationForm from './components/ApplicationForm';
import DocumentUpload from './components/DocumentUpload';
import PaymentStep from './components/PaymentStep';
import ApplicationStatus from './components/ApplicationStatus';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/destinations" element={<DestinationSelection />} />
        <Route path="/apply/:destination" element={<ApplicationForm />} />
        <Route path="/upload" element={<DocumentUpload />} />
        <Route path="/payment" element={<PaymentStep />} />
        <Route path="/status" element={<ApplicationStatus />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}
