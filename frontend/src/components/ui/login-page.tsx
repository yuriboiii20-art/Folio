'use client';
import React, { useState, ChangeEvent, FormEvent } from 'react';
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
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  Ripple,
  TechOrbitDisplay,
  BoxReveal,
  Input,
  Label,
  BottomGradient,
} from './modern-animated-sign-in';

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

const iconsArray = [
  {
    component: () => (
      <img
        width={30}
        height={30}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg"
        alt="React"
        className="size-[30px]"
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 22,
    delay: 0,
    radius: 110,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={30}
        height={30}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg"
        alt="TypeScript"
        className="size-[30px]"
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 22,
    delay: 11,
    radius: 110,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={32}
        height={32}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg"
        alt="Python"
        className="size-[32px]"
      />
    ),
    className: 'size-[35px] border-none bg-transparent',
    duration: 26,
    delay: 5,
    radius: 170,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={32}
        height={32}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg"
        alt="TailwindCSS"
        className="size-[32px]"
      />
    ),
    className: 'size-[35px] border-none bg-transparent',
    duration: 26,
    delay: 18,
    radius: 170,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={36}
        height={36}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg"
        alt="Java"
        className="size-[36px]"
      />
    ),
    className: 'size-[44px] border-none bg-transparent',
    radius: 240,
    duration: 30,
    delay: 0,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={36}
        height={36}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg"
        alt="PostgreSQL"
        className="size-[36px]"
      />
    ),
    className: 'size-[44px] border-none bg-transparent',
    radius: 240,
    duration: 30,
    delay: 15,
    path: false,
    reverse: false,
  },
];

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
        name: 'Guest Scholar',
        role: 'Academic Explorer',
        usn: 'DEMO-2026',
        sem: 'General Access',
        branch: 'Autonomous Engineering',
        email: 'scholar@folio.demo',
        studyStreak: 5,
        avatarUrl: ''
      }
    }
  ];

  const handleDemoSelect = (profile: UserSessionProfile) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      onLogin(profile);
    }, 400);
  };

  const handleSignInSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signInIdentifier || !signInPassword) {
      setErrorMessage('Please enter both your identifier/email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const matchedDemo = demoProfiles.find(
        (d) =>
          d.profile.email.toLowerCase() === signInIdentifier.toLowerCase() ||
          d.profile.usn.toLowerCase() === signInIdentifier.toLowerCase()
      );

      if (matchedDemo) {
        onLogin(matchedDemo.profile);
      } else {
        const usernamePart = signInIdentifier.split('@')[0];
        const formattedName = usernamePart
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        onLogin({
          name: formattedName || 'Scholar User',
          role: 'Academic Scholar',
          usn: '1FA23CS' + Math.floor(100 + Math.random() * 900),
          sem: '6th Semester',
          branch: 'Computer Science & Engineering',
          email: signInIdentifier.includes('@') ? signInIdentifier : `${signInIdentifier}@folio.edu`,
          studyStreak: 1,
          avatarUrl: ''
        });
      }
    }, 600);
  };

  const handleSignUpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signUpName || !signUpEmail || !signUpPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: signUpName,
        role: 'Registered Scholar',
        usn: signUpUsn || '1FA24CS' + Math.floor(100 + Math.random() * 900),
        sem: '1st Semester',
        branch: signUpBranch,
        email: signUpEmail,
        studyStreak: 1,
        avatarUrl: ''
      });
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: 'Alex Johnson',
        role: 'Verified Google Scholar',
        usn: '1FA21CS042',
        sem: '6th Semester',
        branch: 'Computer Science & Engineering',
        email: 'alex.johnson@folio.edu',
        studyStreak: 14,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

      {/* LEFT PANEL: Orbiting Tech Animation & Brand Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900/60 to-slate-950 overflow-hidden">
        <Ripple mainCircleSize={120} mainCircleOpacity={0.18} />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <GraduationCap className="size-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                FOLIO
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Academic Intelligence & Workspace Portal</p>
          </div>
        </div>

        {/* Center: Tech Orbit Animation */}
        <div className="relative z-10 my-auto h-[420px] flex items-center justify-center">
          <TechOrbitDisplay iconsArray={iconsArray} text="FOLIO" />
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Bot className="size-4" />
                <span className="text-xs font-semibold">Gemini 2.5 AI</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Instant subject tutoring & context search</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <BarChart2 className="size-4" />
                <span className="text-xs font-semibold">Live Analytics</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Attendance & syllabus track in real-time</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <FolderClosed className="size-4" />
                <span className="text-xs font-semibold">VTU Scheme</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Pre-indexed 2022/2026 syllabus repositories</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-2 border-t border-slate-800/40">
            <span>&copy; {new Date().getFullYear()} FOLIO Academic OS</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              API Services Operational
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Container & Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-10 z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Brand */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="size-5 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">FOLIO</span>
          </div>

          {/* Title and Subtitle with BoxReveal */}
          <div className="text-left space-y-1">
            <BoxReveal boxColor="#3b82f6" duration={0.3}>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Scholar Account'}
              </h2>
            </BoxReveal>
            <BoxReveal boxColor="#3b82f6" duration={0.35}>
              <p className="text-sm text-slate-400">
                {authMode === 'signin'
                  ? 'Sign in to access your curriculum, analytics, and AI tutor.'
                  : 'Join Folio to streamline syllabus tracking and academic mastery.'}
              </p>
            </BoxReveal>
          </div>

          {/* Quick Demo Profile One-Click Launcher */}
          {authMode === 'signin' && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Zap className="size-3.5 text-amber-400" />
                  Quick Demo Access:
                </span>
                <span className="text-[11px] text-slate-500">1-click login</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoProfiles.map((demo) => (
                  <button
                    key={demo.title}
                    type="button"
                    onClick={() => handleDemoSelect(demo.profile)}
                    disabled={isLoading}
                    className="flex flex-col items-start p-2 rounded-lg bg-slate-950/60 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-base">{demo.icon}</span>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 truncate">
                        {demo.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                      {demo.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-slate-900/90 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                authMode === 'signin'
                  ? 'bg-blue-600 text-white shadow-md'
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
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                authMode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign In Option */}
          <BoxReveal boxColor="#3b82f6" duration={0.3} width="100%">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="g-button group/btn relative w-full h-11 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/60 rounded-lg flex items-center justify-center gap-3 text-sm font-medium text-slate-200 transition-all hover:border-slate-600 cursor-pointer shadow-sm"
            >
              <img
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                alt="Google"
                className="size-5 object-contain"
              />
              <span>Continue with Google</span>
              <BottomGradient />
            </button>
          </BoxReveal>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs uppercase text-slate-500 tracking-wider font-medium">Or continue with credentials</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">University Email or USN</Label>
                <div className="relative">
                  <Input
                    id="signin-email"
                    type="text"
                    placeholder="alex.johnson@folio.edu or 1FA21CS042"
                    value={signInIdentifier}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignInIdentifier(e.target.value)}
                    required
                  />
                  <Mail className="absolute right-3.5 top-2.5 size-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignInPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <BoxReveal width="100%" boxColor="#3b82f6" duration={0.3}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group/btn relative w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Folio</span>
                      <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                  <BottomGradient />
                </button>
              </BoxReveal>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Alex Johnson"
                    value={signUpName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-usn">USN (Optional)</Label>
                  <Input
                    id="signup-usn"
                    type="text"
                    placeholder="1FA22CS099"
                    value={signUpUsn}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpUsn(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email">University Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="student@institution.edu"
                  value={signUpEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-branch">Department / Branch</Label>
                <select
                  id="signup-branch"
                  value={signUpBranch}
                  onChange={(e) => setSignUpBranch(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-zinc-800/90 text-sm text-slate-100 border border-slate-700/80 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & ML</option>
                  <option value="Information Science & Engineering">Information Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpConfirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <BoxReveal width="100%" boxColor="#3b82f6" duration={0.3}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group/btn relative w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                  <BottomGradient />
                </button>
              </BoxReveal>
            </form>
          )}

          {/* Footer note */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              By accessing FOLIO, you agree to academic compliance and institutional privacy terms.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Lock className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Reset Scholar Password</h3>
                <p className="text-xs text-slate-400">Enter your university email to receive a recovery token</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-email">University Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="scholar@folio.edu"
                value={forgotEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (forgotEmail) {
                    setSuccessMessage(`Password reset link dispatched to ${forgotEmail}`);
                    setIsForgotModalOpen(false);
                    setForgotEmail('');
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
