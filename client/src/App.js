import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ReorderingProvider } from './context/ReorderingContext';
import AuthProvider from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// --- Page Imports Updated ---
import Dashboard from './pages/Dashboard';
import AllQuotes from './pages/AllApplicants'; // Renamed import (file is still AllApplicants.js for now)
import QuoteProfile from './pages/ApplicantProfile'; // Renamed import (file is still ApplicantProfile.js for now)
import ProductManager from './pages/QuestionnaireBuilder'; // Renamed import (file is still QuestionnaireBuilder.js for now)
import QuoteCalculator from './pages/ApplicantForm'; // Renamed import (file is still ApplicantForm.js for now)
import ConfigPreview from './pages/QuestionnairePreview'; // Renamed import (file is still QuestionnairePreview.js for now)
import Login from './pages/Login';
import SignUp from './pages/SignUp';
// --- Removed Old Imports ---
// import Onboarding from './pages/Onboarding';
// import ApplicationSubmitted from './pages/ApplicationSubmitted';
// import ScheduleInterview from './pages/ScheduleInterview';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <ReorderingProvider>
            <Routes>
              {/* --- Public Routes Updated --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              {/* This is the new "Dynamic Link" for the tinkering client */}
              <Route path="/quote/:quoteId" element={<QuoteCalculator />} /> 
              {/* <Route path="/application-submitted" element={<ApplicationSubmitted />} /> */}
              {/* <Route path="/schedule-interview" element={<ScheduleInterview />} /> */}
              
              {/* --- Protected Admin Routes --- */}
              {/* Removed /onboarding route, as it's handled by ProtectedRoute now */}
              <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
            </Routes>
          </ReorderingProvider>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // isReordering prop is passed to Sidebar to control animation
  const isReordering = location.pathname === '/config'; 

  const handleLinkClick = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex bg-gray-100 min-h-screen"> 
      {/* --- Pass isReordering prop --- */}
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        onLinkClick={handleLinkClick} 
        isReordering={isReordering} // This prop is crucial for your sidebar animation logic
      />
      <div className="flex-1 flex flex-col">
        {/* Using the original dark Header */}
        <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} /> 
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* --- Admin Routes Updated --- */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/quotes" element={<AllQuotes />} /> 
              <Route path="/quote-profile/:id" element={<QuoteProfile />} /> 
              <Route path="/config" element={<ProductManager />} />
              <Route path="/config/preview" element={<ConfigPreview />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
