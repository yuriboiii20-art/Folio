import React from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import DesktopWebApp from './components/ui/dashboard-sidebar';
import LoginPage, { UserSessionProfile } from './components/ui/login-page';
import { GraduationCap } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100">
        <div className="size-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/25 animate-pulse">
          <GraduationCap className="size-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-blue-500 animate-ping" />
          <span className="text-xs text-slate-400 font-medium">Connecting to FOLIO Academic OS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const sessionProfile: UserSessionProfile = {
    name: profile?.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Academic Scholar',
    role: profile?.role || 'Academic Scholar',
    usn: profile?.usn || '1FA23CS042',
    sem: profile?.sem || '6th Semester',
    branch: profile?.branch || 'Computer Science & Engineering',
    email: profile?.email || user.email || '',
    studyStreak: profile?.studyStreak || 12,
    avatarUrl: profile?.avatarUrl || ''
  };

  return (
    <DesktopWebApp
      currentUser={sessionProfile}
      onLogout={signOut}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
