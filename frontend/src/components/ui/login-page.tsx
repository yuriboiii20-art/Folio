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
import { FolioMark } from './logo';
import AnimatedGradientBackground from './animated-gradient-background';
import { GlassCard } from './glass-card';
import { GlassSelect } from './glass-select';
import { useAuth } from '../../lib/authContext';
import { normalizeEmail } from '../../lib/authLinkingService';

export interface UserSessionProfile {
  name: string;
  role: string;
  usn: string;
  sem: string;
  branch: string;
  email: string;
  studyStreak: number;
  avatarUrl?: string;
  avatarPreset?: string;
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

const BRANCH_OPTIONS = [
  { value: 'Computer Science & Engineering', label: 'Computer Science & Engineering' },
  { value: 'Artificial Intelligence & Machine Learning', label: 'Artificial Intelligence & ML' },
  { value: 'Information Science & Engineering', label: 'Information Science & Engineering' },
  { value: 'Electronics & Communication', label: 'Electronics & Communication' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
];

const SEMESTER_OPTIONS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester',
].map(sem => ({ value: sem, label: sem }));

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
  const [signInUsn, setSignInUsn] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsn, setSignUpUsn] = useState('');
  const [signUpBranch, setSignUpBranch] = useState('Computer Science & Engineering');
  const [signUpSem, setSignUpSem] = useState('1st Semester');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const formatAuthError = (err: any): string => {
    const msg = err?.message || err?.code || '';
    if (
      msg.includes('auth/popup-closed-by-user') ||
      msg.includes('auth/cancelled-popup-request') ||
      msg.includes('popup-closed-by-user') ||
      msg.includes('cancelled-popup-request')
    ) {
      return '';
    }
    if (msg.includes('auth/unauthorized-domain') || msg.includes('unauthorized-domain')) {
      return 'This domain is not authorized in Firebase. Go to Firebase Console > Authentication > Settings > Authorized domains > Click "Add domain" and add your Vercel domain.';
    }
    if (msg.includes('auth/operation-not-allowed') || msg.includes('operation-not-allowed')) {
      return 'Email/Password Sign-In is not enabled yet in Firebase Console. Go to Firebase Console > Authentication > Sign-in method > Click "Email/Password" > Toggle "Enable" and click "Save".';
    }
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

    const email = normalizeEmail(
      signInEmail.includes('@')
        ? signInEmail
        : `${signInEmail}@folio.edu`
    );

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
        usn: signInUsn.trim().toUpperCase() || '1FA22CS099',
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

    const normSignUpEmail = normalizeEmail(signUpEmail);

    const { error } = await signUp(
      normSignUpEmail,
      signUpPassword,
      signUpName.trim(),
      signUpUsn.trim(),
      signUpBranch,
      signUpSem
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
        usn: signUpUsn.trim() || '',
        sem: signUpSem,
        branch: signUpBranch,
        email: normSignUpEmail,
        studyStreak: 0
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const handleWindowFocus = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    };
    window.addEventListener('focus', handleWindowFocus, { once: true });

    try {
      const { error } = await signInWithGoogle();
      window.removeEventListener('focus', handleWindowFocus);
      setIsLoading(false);

      if (error) {
        const formattedErr = formatAuthError(error);
        if (formattedErr) {
          setErrorMessage(formattedErr);
        }
        return;
      }
    } catch {
      window.removeEventListener('focus', handleWindowFocus);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    const normForgotEmail = normalizeEmail(forgotEmail);
    if (!normForgotEmail) {
      setErrorMessage('Please enter your university email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPasswordForEmail(normForgotEmail);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Unable to send recovery email.');
    } else {
      setSuccessMessage(`Password recovery instructions dispatched to ${normForgotEmail}`);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden select-none relative">
      {/* Animated Radial Gradient Backdrop */}
      <AnimatedGradientBackground Breathing />

      {/* Background Animated Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-[70%] -translate-y-1/2 w-[26rem] h-[26rem] bg-blue-500/30 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-[30%] translate-y-1/2 w-[26rem] h-[26rem] bg-fuchsia-500/25 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22rem] h-[22rem] bg-cyan-400/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <GlassCard className="w-full max-w-md rounded-3xl p-4 sm:p-5 relative z-10 overflow-hidden border-white/25 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_70px_-20px_rgba(2,6,23,0.75)] ring-1 ring-inset ring-white/10">

        {/* Specular highlights: a lit top edge and a soft corner catch */}
        <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <span className="pointer-events-none absolute -top-24 -left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        
        {/* ======================= AUTH FORM (Glassmorphism + Google Login) ======================= */}
        <div className="relative z-10 flex flex-col w-full min-h-0 px-1 sm:px-2 pt-0.5 pb-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Brand Header */}
          <div className="flex justify-center items-center mb-3 w-full">
            <FolioMark size={76} fillColor="#ffffff" className="shrink-0 drop-shadow-xl" />
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
                <Label htmlFor="signin-email" className="text-xs">Email</Label>
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
                <Label htmlFor="signin-usn" className="text-xs">Student USN Identifier</Label>
                <div className="relative">
                  <Input
                    id="signin-usn"
                    type="text"
                    placeholder="e.g. 1FA22CS099"
                    value={signInUsn}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSignInUsn(e.target.value)}
                    className="pl-9 h-9.5 text-xs sm:text-sm uppercase tracking-wider"
                  />
                  <GraduationCap className="absolute left-3 top-2.5 size-4 text-slate-400 pointer-events-none" />
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
                  <Label htmlFor="signup-usn" className="text-xs">Student USN</Label>
                  <div className="relative">
                    <Input
                      id="signup-usn"
                      type="text"
                      placeholder="1FA22CS099"
                      value={signUpUsn}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpUsn(e.target.value)}
                      className="pl-8 h-9 text-xs uppercase tracking-wider"
                    />
                    <GraduationCap className="absolute left-2.5 top-2.5 size-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs">Email</Label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="signup-branch" className="text-xs">Department / Branch</Label>
                  <GlassSelect
                    id="signup-branch"
                    value={signUpBranch}
                    options={BRANCH_OPTIONS}
                    onChange={setSignUpBranch}
                    aria-label="Department or branch"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-sem" className="text-xs">Semester</Label>
                  <GlassSelect
                    id="signup-sem"
                    value={signUpSem}
                    options={SEMESTER_OPTIONS}
                    onChange={setSignUpSem}
                    aria-label="Semester"
                  />
                </div>
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

        </div>
      </GlassCard>

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
              <Label htmlFor="forgot-email" className="text-xs">Email</Label>
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
