import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { profile, loadingProfile } = useProfile();
  const location = useLocation();

  // 1. If not logged in, always redirect to the login page.
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. While we are fetching the profile, show a robust, full-screen loading state.
  //    This is the critical step that prevents the "flash".
  if (loadingProfile) {
    return (
      <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Initializing...</p>
      </div>
    );
  }
  
  // After loading is complete, we can check the user's status.
  const onboardingComplete = profile?.onboardingComplete;
  const isOnboardingPage = location.pathname === '/onboarding';

  // 3. If onboarding is NOT complete:
  if (!onboardingComplete) {
    // If they are on the correct onboarding page, show it.
    if (isOnboardingPage) {
      return children; 
    }
    // If they are anywhere else, force them to the onboarding page.
    return <Navigate to="/onboarding" replace />;
  }

  // 4. If onboarding IS complete:
  if (onboardingComplete) {
    // If they are trying to go back to the onboarding page, redirect them to the dashboard.
    if (isOnboardingPage) {
      return <Navigate to="/" replace />;
    }
    // Otherwise, they are where they should be. Show the main app content.
    return children;
  }

  // This is a fallback and should not normally be reached.
  return <Navigate to="/login" replace />;
}

