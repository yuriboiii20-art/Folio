import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  Hash,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FolderClosed,
  Bot,
  BarChart2,
  Trash2,
  ShieldCheck,
  Zap
} from 'lucide-react';

export interface UserSessionProfile {
  name: string;
  role: string;
  usn: string;
  sem: string;
  branch: string;
  email: string;
  studyStreak: number;
  avatarUrl?: string;
}

interface LoginPageProps {
  onLogin: (profile: UserSessionProfile) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('alex.johnson@folio.edu');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsn, setSignUpUsn] = useState('');
  const [signUpBranch, setSignUpBranch] = useState('Computer Science & Engineering');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Predefined Quick Demo Profiles
  const demoProfiles: Array<{
    title: string;
    profile: UserSessionProfile;
    badge: string;
    icon: string;
  }> = [
    {
      title: 'Alex Johnson',
      badge: 'CS • 6th Sem',
      icon: '👨‍🎓',
      profile: {
        name: 'Alex Johnson',
        role: 'Computer Science Scholar',
        usn: '1FA21CS042',
        sem: '6th Semester',
        branch: 'Computer Science & Engineering',
        email: 'alex.johnson@folio.edu',
        studyStreak: 12,
        avatarUrl: ''
      }
    },
    {
      title: 'Elena Vance',
      badge: 'AI/ML • 4th Sem',
      icon: '👩‍🔬',
      profile: {
        name: 'Elena Vance',
        role: 'AI & Data Science Researcher',
        usn: '1FA22AI018',
        sem: '4th Semester',
        branch: 'Artificial Intelligence & Machine Learning',
        email: 'elena.vance@folio.edu',
        studyStreak: 24,
        avatarUrl: ''
      }
    },
    {
      title: 'Guest Scholar',
      badge: 'Sandbox Mode',
      icon: '⚡',
      profile: {
        name: 'Guest Student',
        role: 'Visiting Scholar',
        usn: '1FA23GEN001',
        sem: '2nd Semester',
        branch: 'Information Science & Engineering',
        email: 'guest.student@folio.edu',
        studyStreak: 3,
        avatarUrl: ''
      }
    }
  ];

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signInIdentifier.trim()) {
      setErrorMessage('Please enter your student email or USN.');
      return;
    }
    if (!signInPassword.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Check if matches known demo or custom input
      const matchedDemo = demoProfiles.find(
        (d) =>
          d.profile.email.toLowerCase() === signInIdentifier.toLowerCase() ||
          d.profile.usn.toLowerCase() === signInIdentifier.toLowerCase()
      );

      if (matchedDemo) {
        onLogin(matchedDemo.profile);
      } else {
        // Construct dynamic profile from entered identifier
        const isEmail = signInIdentifier.includes('@');
        const defaultName = isEmail
          ? signInIdentifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          : 'Enrolled Student';

        const customProfile: UserSessionProfile = {
          name: defaultName,
          role: 'Academic Scholar',
          usn: isEmail ? '1FA21CS099' : signInIdentifier.toUpperCase(),
          sem: '6th Semester',
          branch: 'Computer Science & Engineering',
          email: isEmail ? signInIdentifier : `${signInIdentifier.toLowerCase()}@folio.edu`,
          studyStreak: 5,
          avatarUrl: ''
        };

        onLogin(customProfile);
      }
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpUsn.trim() || !signUpPassword.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const newProfile: UserSessionProfile = {
        name: signUpName.trim(),
        role: `${signUpBranch} Scholar`,
        usn: signUpUsn.trim().toUpperCase(),
        sem: '1st Semester',
        branch: signUpBranch,
        email: signUpEmail.trim().toLowerCase(),
        studyStreak: 1,
        avatarUrl: ''
      };

      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        onLogin(newProfile);
      }, 500);
    }, 700);
  };

  const handleQuickLogin = (profile: UserSessionProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(profile);
    }, 400);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsForgotModalOpen(false);
    setSuccessMessage(`Password reset link sent to ${forgotEmail}`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans selection:bg-slate-700 selection:text-white">
      
      {/* Background Ambient Glow & Grid Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-slate-900/60 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl bg-[#1e293b]/95 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Side: Brand Showcase & Academic Ecosystem */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0f172a] p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
          
          {/* Subtle Decorative Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />

          {/* Top Brand Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600/80 flex items-center justify-center shadow-lg text-white">
                <GraduationCap className="w-6 h-6 text-slate-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">FOLIO</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    Studio v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Smart Student Study Studio</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Master your coursework with intelligent tools.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Single-viewport academic hub powered by 3D subject folders, visx analytics, and local Gemini & Ollama RAG study studio.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                  <FolderClosed className="w-3.5 h-3.5 text-amber-400" />
                  <span>3D Folders</span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Tactile paper physics & starred items</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  <span>AI Study Studio</span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Gemini 2.5 Flash & Ollama RAG</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Visx Analytics</span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Weekly activity & topic metrics</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Trash Recovery</span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Soft-delete & 1-click restore</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Student Selector */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Quick Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">1-Click Login</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {demoProfiles.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(demo.profile)}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-500 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-sm">{demo.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                      {demo.badge.split('•')[0].trim()}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white truncate w-full group-hover:text-slate-200">
                    {demo.title}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate w-full">
                    {demo.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Sign In / Sign Up Form Card */}
        <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-[#1e293b]">
          
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700/80">
              <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-600/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-600/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted Academic Auth</span>
              </div>
            </div>

            {/* Alert Messages */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Student Email or USN
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="e.g. alex.johnson@folio.edu or 1FA21CS042"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-slate-800 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-slate-600"
                    />
                    <span>Remember my device</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Demo pwd: <code className="text-slate-300 font-mono">password123</code></span>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Authenticating Session...</span>
                      </div>
                    ) : (
                      <>
                        <span>Enter FOLIO Studio</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      USN Identifier
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={signUpUsn}
                        onChange={(e) => setSignUpUsn(e.target.value)}
                        placeholder="e.g. 1FA21CS042"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs text-white placeholder-slate-500 font-mono outline-none uppercase"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    University Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Department / Major
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={signUpBranch}
                      onChange={(e) => setSignUpBranch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                      <option value="Information Science & Engineering">Information Science & Engineering</option>
                      <option value="Data Science & Big Data">Data Science & Big Data</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 focus:border-slate-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Creating Profile...</span>
                      </div>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 border-t border-slate-800 text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              FOLIO Academic Workspace • Secure Session Persistence
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              PostgreSQL 15 & Spring Security JWT Protected
            </p>
          </div>

        </div>

      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reset Study Password</h3>
                <p className="text-xs text-slate-400">Enter your university email address</p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-slate-400"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-950 hover:bg-white cursor-pointer shadow"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
