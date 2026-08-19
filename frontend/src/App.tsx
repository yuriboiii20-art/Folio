import React from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import DesktopWebApp from './components/ui/dashboard-sidebar';
import LoginPage, { UserSessionProfile } from './components/ui/login-page';
import { FolioMark } from './components/ui/logo';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100">
        <FolioMark size={72} className="drop-shadow-2xl animate-pulse" />
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

  return <MainWorkspace user={user} profile={profile} signOut={signOut} />;
}

function MainWorkspace({ user, profile, signOut }: { user: any; profile: any; signOut: () => void }) {
  const sessionProfile: UserSessionProfile = React.useMemo(() => ({
    name: profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Academic Scholar',
    role: profile?.role || 'Academic Scholar',
    usn: profile?.usn || '1FA23CS042',
    sem: profile?.sem || '6th Semester',
    branch: profile?.branch || 'Computer Science & Engineering',
    email: profile?.email || user?.email || '',
    studyStreak: profile?.studyStreak || 12,
    avatarUrl: profile?.avatarUrl || '',
    avatarPreset: profile?.avatarPreset || ''
  }), [profile, user]);

  React.useEffect(() => {
    try {
      localStorage.setItem('folio_user_profile', JSON.stringify(sessionProfile));
    } catch {}
  }, [sessionProfile]);

  return (
    <DesktopWebApp
      currentUser={sessionProfile}
      onLogout={() => {
        try {
          localStorage.removeItem('folio_user_profile');
          localStorage.removeItem('folio_last_path');
        } catch {}
        signOut();
      }}
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
