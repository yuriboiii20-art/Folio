import React, { useState, useEffect } from 'react';
import DesktopWebApp from './components/ui/dashboard-sidebar';
import LoginPage, { UserSessionProfile } from './components/ui/login-page';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSessionProfile | null>(() => {
    try {
      const stored = localStorage.getItem('folio_user_profile');
      if (stored) {
        return JSON.parse(stored);
      }
      // Default to Alex Johnson for convenient first launch if already authenticated
      const isAuth = localStorage.getItem('folio_is_authenticated');
      if (isAuth === 'true') {
        return {
          name: 'Alex Johnson',
          role: 'Computer Science Scholar',
          usn: '1FA21CS042',
          sem: '6th Semester',
          branch: 'Computer Science & Engineering',
          email: 'alex.johnson@folio.edu',
          studyStreak: 12,
          avatarUrl: ''
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('folio_is_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleLogin = (profile: UserSessionProfile) => {
    setCurrentUser(profile);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('folio_user_profile', JSON.stringify(profile));
      localStorage.setItem('folio_is_authenticated', 'true');
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('folio_user_profile');
      localStorage.setItem('folio_is_authenticated', 'false');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <DesktopWebApp
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}
