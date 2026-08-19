import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged,
  updateProfile as firebaseUpdateAuthProfile,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebaseConfig';
import {
  normalizeEmail,
  findOrCreateCanonicalUser,
  reconcileAndMergeDuplicateAccounts,
  isOAuthEmailVerified,
  CanonicalUser
} from './authLinkingService';

export interface UserProfile {
  id: string; // Canonical user ID
  fullName: string;
  email: string;
  email_normalized?: string;
  avatarUrl?: string;
  avatarPreset?: string;
  role?: string;
  usn?: string;
  sem?: string;
  branch?: string;
  studyStreak?: number;
  primaryProvider?: string;
  linkedProviders?: string[];
  createdAt?: string;
  auth_uid?: string;
}

export type AuthUser = {
  uid: string;
  id: string; // Canonical user ID
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    usn?: string;
    branch?: string;
  };
};

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string, fullName: string, usn?: string, branch?: string, sem?: string) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export const getCleanUserName = (fullName?: string | null, email?: string | null, uid?: string | null): string => {
  if (fullName && fullName.trim()) {
    return fullName.trim().replace(/[\/\#\$\[\]\.]/g, '_').replace(/\s+/g, '_');
  }
  if (email && email.includes('@')) {
    return normalizeEmail(email).split('@')[0].replace(/[\/\#\$\[\]\.]/g, '_');
  }
  return uid || `user_${Date.now()}`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  // Fetch or initialize canonical user profile in Firestore
  const fetchOrInitFirestoreProfile = async (
    firebaseUser: FirebaseUser,
    provider: string = 'password',
    extraMeta?: { fullName?: string; usn?: string; branch?: string; sem?: string }
  ): Promise<UserProfile> => {
    try {
      const canonicalUser = await findOrCreateCanonicalUser(firebaseUser, provider, extraMeta);

      const userProfile: UserProfile = {
        id: canonicalUser.id,
        auth_uid: firebaseUser.uid,
        fullName: canonicalUser.fullName,
        email: canonicalUser.email,
        email_normalized: canonicalUser.email_normalized,
        avatarUrl: canonicalUser.avatarUrl || '',
        avatarPreset: canonicalUser.avatarPreset || '',
        role: canonicalUser.role,
        usn: canonicalUser.usn,
        sem: canonicalUser.sem,
        branch: canonicalUser.branch,
        studyStreak: canonicalUser.studyStreak,
        primaryProvider: canonicalUser.primaryProvider,
        linkedProviders: canonicalUser.linkedProviders,
        createdAt: canonicalUser.createdAt
      };

      // Trigger asynchronous duplicate reconciliation to merge any duplicate accounts
      if (canonicalUser.email_normalized) {
        reconcileAndMergeDuplicateAccounts(canonicalUser.email_normalized).catch(err => {
          console.warn('Duplicate reconciliation note:', err);
        });
      }

      return userProfile;
    } catch (e) {
      console.warn('Firestore profile resolution note:', e);
      const normEmail = normalizeEmail(firebaseUser.email);
      const fallbackId = firebaseUser.uid;
      return {
        id: fallbackId,
        auth_uid: firebaseUser.uid,
        fullName: extraMeta?.fullName || firebaseUser.displayName || (normEmail.includes('@') ? normEmail.split('@')[0] : 'Academic Scholar'),
        email: firebaseUser.email || '',
        email_normalized: normEmail,
        avatarUrl: firebaseUser.photoURL || '',
        role: 'Academic Scholar',
        usn: extraMeta?.usn || '',
        sem: extraMeta?.sem || '',
        branch: extraMeta?.branch || '',
        studyStreak: 0,
        createdAt: new Date().toISOString()
      };
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const p = await fetchOrInitFirestoreProfile(auth.currentUser);
      setProfile(p);
    }
  };

  useEffect(() => {
    // Listen directly to Firebase Auth lifecycle
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const provider = firebaseUser.providerData?.[0]?.providerId || 'password';
        const p = await fetchOrInitFirestoreProfile(firebaseUser, provider);

        const authUserObj: AuthUser = {
          uid: firebaseUser.uid,
          id: p.id,
          email: firebaseUser.email,
          displayName: p.fullName || firebaseUser.displayName,
          photoURL: p.avatarUrl || firebaseUser.photoURL,
          user_metadata: {
            full_name: p.fullName,
            avatar_url: p.avatarUrl,
            usn: p.usn,
            branch: p.branch
          }
        };

        setUser(authUserObj);
        setSession({ user: authUserObj });
        setProfile(p);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    usn?: string,
    branch?: string,
    sem?: string
  ) => {
    const normEmail = normalizeEmail(email);
    if (!normEmail) return { error: new Error('Email address is required') };

    try {
      let createdUser: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, normEmail, password);
        createdUser = userCredential.user;
      } catch (createErr: any) {
        // If email already in use (e.g. registered earlier via Google OAuth)
        if (createErr?.code === 'auth/email-already-in-use') {
          // Check existing sign-in methods
          const methods = await fetchSignInMethodsForEmail(auth, normEmail);
          if (methods.includes('google.com') && !methods.includes('password')) {
            return {
              error: new Error(
                'An account with this email already exists via Google. Please click "Continue with Google" to sign in and link your account.'
              )
            };
          }
          // If password method exists, attempt sign in
          const signinRes = await signInWithEmailAndPassword(auth, normEmail, password);
          createdUser = signinRes.user;
        } else {
          throw createErr;
        }
      }

      if (fullName) {
        await firebaseUpdateAuthProfile(createdUser, { displayName: fullName.trim() });
      }

      const p = await fetchOrInitFirestoreProfile(createdUser, 'password', {
        fullName: fullName.trim(),
        usn: usn?.trim(),
        branch: branch?.trim(),
        sem: sem?.trim()
      });

      const authUserObj: AuthUser = {
        uid: createdUser.uid,
        id: p.id,
        email: createdUser.email,
        displayName: fullName.trim(),
        photoURL: null,
        user_metadata: { full_name: fullName.trim(), usn, branch }
      };

      setUser(authUserObj);
      setSession({ user: authUserObj });
      setProfile(p);

      return { error: null, needsEmailVerification: false };
    } catch (err: any) {
      console.error('Firebase signUp error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    const normEmail = normalizeEmail(email);
    if (!normEmail) return { error: new Error('Email address is required') };

    try {
      const credential = await signInWithEmailAndPassword(auth, normEmail, password);
      const signedInUser = credential.user;

      const p = await fetchOrInitFirestoreProfile(signedInUser, 'password');

      const authUserObj: AuthUser = {
        uid: signedInUser.uid,
        id: p.id,
        email: signedInUser.email,
        displayName: p.fullName || signedInUser.displayName,
        photoURL: p.avatarUrl || signedInUser.photoURL || null,
        user_metadata: { full_name: p.fullName }
      };

      setUser(authUserObj);
      setSession({ user: authUserObj });
      setProfile(p);

      return { error: null };
    } catch (err: any) {
      console.warn('Firebase signIn error:', err);

      // Check if user was registered with Google OAuth
      try {
        const methods = await fetchSignInMethodsForEmail(auth, normEmail);
        if (methods.includes('google.com') && !methods.includes('password')) {
          return {
            error: new Error(
              'This account was created with Google. Please click "Continue with Google" above to sign in.'
            )
          };
        }
        if (methods.length === 0) {
          return {
            error: new Error(
              'No account found with this email. Please click "Create Account" tab or use "Continue with Google".'
            )
          };
        }
      } catch (methodsErr) {
        console.warn('fetchSignInMethodsForEmail inspection note:', methodsErr);
      }

      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // Verify that OAuth email is verified before linking
      if (!isOAuthEmailVerified(googleUser)) {
        await firebaseSignOut(auth);
        return {
          error: new Error('Unverified Google email. Please verify your Google account email before signing in.')
        };
      }

      const p = await fetchOrInitFirestoreProfile(googleUser, 'google.com');

      const authUserObj: AuthUser = {
        uid: googleUser.uid,
        id: p.id,
        email: googleUser.email,
        displayName: p.fullName || googleUser.displayName,
        photoURL: p.avatarUrl || googleUser.photoURL,
        user_metadata: { full_name: p.fullName, avatar_url: p.avatarUrl }
      };

      setUser(authUserObj);
      setSession({ user: authUserObj });
      setProfile(p);

      return { error: null };
    } catch (err: any) {
      // Handle Firebase account-exists-with-different-credential linking
      if (err?.code === 'auth/account-exists-with-different-credential') {
        try {
          const pendingCred = GoogleAuthProvider.credentialFromError(err);
          const email = err.customData?.email || err.email;
          if (email && pendingCred) {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.includes('password')) {
              return {
                error: new Error(
                  `An account already exists for ${email} using Password. Please sign in with your email & password first to link Google.`
                )
              };
            }
          }
        } catch (linkErr) {
          console.warn('Account linking credential inspection note:', linkErr);
        }
      }

      const code = err?.code || err?.message || '';
      if (!code.includes('cancelled-popup-request') && !code.includes('popup-closed-by-user')) {
        console.error('Google Sign-in error:', err);
      }
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    const normEmail = normalizeEmail(email);
    try {
      await sendPasswordResetEmail(auth, normEmail);
      return { error: null };
    } catch (err: any) {
      console.error('Firebase sendPasswordResetEmail error:', err);
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      if (auth.currentUser) {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
      } else {
        throw new Error('No user is currently authenticated.');
      }
      setIsPasswordRecovery(false);
      return { error: null };
    } catch (err: any) {
      console.error('Firebase updatePassword error:', err);
      return { error: err };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!auth.currentUser || !profile) return { error: new Error('User not logged in') };

    try {
      const canonicalUserId = profile.id || auth.currentUser.uid;
      const userRef = doc(db, 'users', canonicalUserId);

      const firestoreUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (updates.email) {
        firestoreUpdates.email_normalized = normalizeEmail(updates.email);
      }

      await setDoc(userRef, firestoreUpdates, { merge: true });

      if (updates.fullName || updates.avatarUrl) {
        await firebaseUpdateAuthProfile(auth.currentUser, {
          displayName: updates.fullName || auth.currentUser.displayName,
          photoURL: updates.avatarUrl || auth.currentUser.photoURL
        });
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (err: any) {
      console.error('Firebase updateProfile error:', err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isPasswordRecovery,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
