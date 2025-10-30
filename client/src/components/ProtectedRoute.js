import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { loadingProfile } = useProfile(); // We still need this
  const location = useLocation();

  // 1. If not logged in, always redirect to the login page.
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. While we are fetching the profile, show a robust, full-screen loading state.
  //    This prevents the app from flashing or trying to load data before
  //    the user profile is available.
  if (loadingProfile) {
    return (
      <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Initializing...</p>
      </div>
    );
  }
  
  // 3. --- ONBOARDING LOGIC REMOVED ---
  // We no longer check for onboardingComplete.
  // As long as you are logged in and your profile has loaded,
  // we will show the main app content.

  // 4. Show the main app content (e.g., Dashboard, Questionnaire, etc.)
  return children;

  // This is a fallback and should not normally be reached.
  // return <Navigate to="/login" replace />;
}
