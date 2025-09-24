import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ReorderingProvider } from './context/ReorderingContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AllApplicants from './pages/AllApplicants';
import ApplicantProfile from './pages/ApplicantProfile';
import QuestionnaireBuilder from './pages/QuestionnaireBuilder';
import ApplicantForm from './pages/ApplicantForm';
import QuestionnairePreview from './pages/QuestionnairePreview';


function App() {
  if (window.location.pathname.startsWith('/apply')) {
    return (
      <Router>
        <Routes>
          <Route path="/apply/:questionnaireId" element={<ApplicantForm />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <ReorderingProvider>
        <AppContent />
      </ReorderingProvider>
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        onLinkClick={handleLinkClick}
      />
      <div className="flex-1 flex flex-col">
        <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/applicants" element={<AllApplicants />} />
              <Route path="/applicant/:id" element={<ApplicantProfile />} />
              <Route 
                path="/questionnaire" 
                element={<QuestionnaireBuilder />} 
              />
              <Route path="/questionnaire/preview" element={<QuestionnairePreview />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
