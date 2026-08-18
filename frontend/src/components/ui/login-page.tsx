'use client';
import React, { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import {
  FileText,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  FolderClosed,
  ShieldCheck,
  Zap,
  Layers,
  Database
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export interface UserSessionProfile {
  name: string;
  role: string;
  usn: string;
  sem: string;
  branch: string;
  email: string;
  studyStreak: number;
  avatarUrl?: string;
  token?: string;
}

interface LoginPageProps {
  onLogin?: (profile: UserSessionProfile) => void;
}

// Glassmorphic Input Component
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative group/input">
        <input
          type={type}
          className={`flex h-10 w-full border border-white/10 bg-slate-800/60 backdrop-blur-md text-white shadow-input rounded-xl px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition duration-200 ${className || ''}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

// Glassmorphic Label Component
const Label = ({ children, className, htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className={`text-xs font-semibold text-slate-300 select-none ${className || ''}`}>
    {children}
  </label>
);

// Bottom Gradient Accent Component
const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { signIn, signUp, signInWithGoogle, resetPasswordForEmail, updatePassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsn, setSignUpUsn] = useState('');
  const [signUpBranch, setSignUpBranch] = useState('Computer Science & Engineering');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const formatAuthError = (err: any): string => {
    const msg = err?.message || '';
    if (msg.includes('auth/configuration-not-found') || msg.includes('configuration-not-found')) {
      return 'Firebase Authentication is not enabled yet in your Firebase Console. Please go to Firebase Console > Authentication > Click "Get Started" and Enable Email/Password.';
    }
    if (msg.includes('auth/api-key-not-valid') || msg.includes('api-key-not-valid')) {
      return 'Firebase API Key is missing or invalid. Please check VITE_FIREBASE_API_KEY in Vercel Environment Variables and redeploy.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'This email is already registered. Please switch to Sign In.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    return msg || 'Authentication error. Please try again.';
  };

  const handleSignInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signInEmail.trim() || !signInPassword) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    const email = signInEmail.includes('@')
      ? signInEmail.trim()
      : `${signInEmail.trim()}@folio.edu`;

    const { error } = await signIn(email, signInPassword);

    setIsLoading(false);

    if (error) {
      setErrorMessage(formatAuthError(error));
      return;
    }

    if (onLogin) {
      onLogin({
        name: email.split('@')[0],
        role: 'Academic Scholar',
        usn: '1FA23CS042',
        sem: '6th Semester',
        branch: 'Computer Science & Engineering',
        email: email,
        studyStreak: 12
      });
    }
  };

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      signUpEmail.trim(),
      signUpPassword,
      signUpName.trim(),
      signUpUsn.trim(),
      signUpBranch
    );

    setIsLoading(false);

    if (error) {
      setErrorMessage(formatAuthError(error));
      return;
    }

    setSuccessMessage('Account created successfully! Redirecting...');
    if (onLogin) {
      onLogin({
        name: signUpName.trim(),
        role: 'Registered Scholar',
        usn: signUpUsn.trim() || '1FA24CS042',
        sem: '1st Semester',
        branch: signUpBranch,
        email: signUpEmail.trim(),
        studyStreak: 1
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      setErrorMessage(formatAuthError(error));
      return;
    }

    if (onLogin) {
      onLogin({
        name: 'Scholar Student',
        role: 'Academic Scholar',
        usn: '1FA23CS099',
        sem: '6th Semester',
        branch: 'Computer Science & Engineering',
        email: 'scholar.google@folio.edu',
        studyStreak: 15
      });
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your university email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(forgotEmail.trim());
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Unable to send recovery email.');
    } else {
      setSuccessMessage(`Password recovery instructions dispatched to ${forgotEmail.trim()}`);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none relative">
      {/* Background Animated Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-5xl h-full max-h-[640px] grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 bg-slate-900/40 border border-white/15 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl shadow-blue-950/40 overflow-hidden relative z-10 items-center">
        
        {/* ======================= LEFT HERO SECTION (Clean Glassmorphism, Zero Overlap) ======================= */}
        <div className="hidden lg:flex flex-col justify-between h-full bg-gradient-to-br from-blue-950/30 via-slate-900/30 to-indigo-950/30 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
          
          {/* Top Brand Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5 text-blue-400" />
              <span>FOLIO • Academic OS</span>
            </div>
            
            <div className="flex items-center gap-3 pt-1">
              <div className="size-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
                <GraduationCap className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-tight">FOLIO</h1>
                <p className="text-xs font-medium text-slate-300">Smart File Management for Students</p>
              </div>
            </div>
          </div>

          {/* Clean Distinct Feature Cards (Zero visual collision) */}
          <div className="space-y-3 my-auto">
            {/* Feature 1 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-slate-800/60 transition-all">
              <div className="size-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <FolderClosed className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Subject Folders & Notes</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Organize lecture PDFs, assignments, and study materials into structured subject folders.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-slate-800/60 transition-all">
              <div className="size-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <ShieldCheck className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Firebase Cloud Security Rules</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  100% strict user data isolation. Only you can view, upload, and access your private files.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-slate-800/60 transition-all">
              <div className="size-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <Zap className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">AI Study Studio & Search</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Instant full-text indexing, quick previews, and intelligent academic query assistants.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Status Tag */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Database Active</span>
            </div>
            <span className="text-blue-400 font-medium">PostgreSQL 15 Protected</span>
          </div>
        </div>

        {/* ======================= RIGHT AUTH FORM SECTION (Glassmorphism + Google Login) ======================= */}
        <div className="flex flex-col justify-center h-full px-2 sm:px-6 py-2 overflow-y-auto">
          
          {/* Top Mobile Brand Header */}
          <div className="lg:hidden flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="size-4.5" />
              </div>
              <span className="font-bold text-base text-white">FOLIO</span>
            </div>
            <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Academic Cloud
            </span>
          </div>

          {/* Tabs for Sign In vs Create Account */}
          <div className="flex p-1 bg-slate-800/60 border border-white/10 rounded-xl mb-3 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Prominent Login Through Google Button */}
          <div className="mb-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-white/15 hover:border-white/30 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99] backdrop-blur-md"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2.5 my-2.5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-2.5 p-2 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="size-3.5 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-2.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="signin-email" className="text-xs">University Email / Username</Label>
                <div className="relative">
                  <Input
                    id="signin-email"
                    type="text"
                    placeholder="student@institution.edu"
                    value={signInEmail}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignInEmail(e.target.value)}
                    required
                    className="pl-9 h-9.5 text-xs sm:text-sm"
                  />
                  <Mail className="absolute left-3 top-2.5 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-xs">Password</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignInPassword(e.target.value)}
                    required
                    className="pl-9 pr-9 h-9.5 text-xs sm:text-sm"
                  />
                  <Lock className="absolute left-3 top-2.5 size-4 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group/btn relative w-full h-9.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 mt-1 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Folio</span>
                    <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
                <BottomGradient />
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-xs">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Alex Johnson"
                    value={signUpName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-usn" className="text-xs">USN (Optional)</Label>
                  <Input
                    id="signup-usn"
                    type="text"
                    placeholder="1FA22CS099"
                    value={signUpUsn}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpUsn(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs">University Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="student@institution.edu"
                  value={signUpEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpEmail(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-branch" className="text-xs">Department / Branch</Label>
                <select
                  id="signup-branch"
                  value={signUpBranch}
                  onChange={(e) => setSignUpBranch(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-800/80 text-xs text-slate-100 border border-white/10 focus:ring-1.5 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & ML</option>
                  <option value="Information Science & Engineering">Information Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpPassword(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-confirm-password" className="text-xs">Confirm Pass</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpConfirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpConfirmPassword(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group/btn relative w-full h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 mt-1 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
                <BottomGradient />
              </button>
            </form>
          )}

          {/* Security note footer */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              🔒 256-Bit Encrypted • Institutional Session Storage
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900/90 border border-white/15 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-blue-400">
              <div className="size-9 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center">
                <Lock className="size-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">Reset Scholar Password</h3>
                <p className="text-xs text-slate-300">Enter your university email to receive a recovery link</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-xs">University Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="scholar@folio.edu"
                value={forgotEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value)}
                className="h-9.5 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors"
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
