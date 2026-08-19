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
  updateProfile as firebaseUpdateAuthProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebaseConfig';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  /** Id of a built-in avatar character, e.g. "milo". Beats avatarUrl when set. */
  avatarPreset?: string;
  role?: string;
  usn?: string;
  sem?: string;
  branch?: string;
  studyStreak?: number;
  createdAt?: string;
  auth_uid?: string;
}

export type AuthUser = {
  uid: string;
  id: string;
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
    return email.split('@')[0].replace(/[\/\#\$\[\]\.]/g, '_');
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

  // Fetch or initialize user profile document in Firestore (stored under User Name document ID)
  const fetchOrInitFirestoreProfile = async (
    userId: string,
    userEmail?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    extraMeta?: { usn?: string; branch?: string }
  ): Promise<UserProfile> => {
    const userDocId = getCleanUserName(displayName, userEmail, userId);

    try {
      // 1. Check document named by User's Name
      const userDocRef = doc(db, 'users', userDocId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          id: userDocId,
          auth_uid: userId,
          fullName: data.fullName || data.full_name || displayName || 'Scholar Student',
          email: data.email || userEmail || '',
          avatarUrl: data.avatarUrl || data.avatar_url || photoURL || '',
          avatarPreset: data.avatarPreset || '',
          role: data.role || 'Academic Scholar',
          usn: data.usn || extraMeta?.usn || '1FA23CS042',
          sem: data.sem || '6th Semester',
          branch: data.branch || extraMeta?.branch || 'Computer Science & Engineering',
          studyStreak: data.studyStreak !== undefined ? data.studyStreak : 15,
          createdAt: data.createdAt || data.created_at || new Date().toISOString()
        };
      }

      // 2. Also check if old document existed with raw uid
      if (userDocId !== userId) {
        const oldDocRef = doc(db, 'users', userId);
        const oldSnap = await getDoc(oldDocRef);
        if (oldSnap.exists()) {
          const oldData = oldSnap.data();
          const migratedProfile: UserProfile = {
            id: userDocId,
            auth_uid: userId,
            fullName: oldData.fullName || oldData.full_name || displayName || 'Scholar Student',
            email: oldData.email || userEmail || '',
            avatarUrl: oldData.avatarUrl || oldData.avatar_url || photoURL || '',
            role: oldData.role || 'Academic Scholar',
            usn: oldData.usn || extraMeta?.usn || '1FA23CS042',
            sem: oldData.sem || '6th Semester',
            branch: oldData.branch || extraMeta?.branch || 'Computer Science & Engineering',
            studyStreak: oldData.studyStreak !== undefined ? oldData.studyStreak : 15,
            createdAt: oldData.createdAt || oldData.created_at || new Date().toISOString()
          };
          // Save with clean user name document ID
          await setDoc(userDocRef, migratedProfile, { merge: true });
          return migratedProfile;
        }
      }

      // 3. Create new profile record in Firestore under User's Name
      const fallbackName = displayName || (userEmail ? userEmail.split('@')[0] : 'Scholar Student');
      const newFirestoreProfile: UserProfile = {
        id: userDocId,
        auth_uid: userId,
        fullName: fallbackName,
        email: userEmail || '',
        avatarUrl: photoURL || '',
        role: 'Academic Scholar',
        usn: extraMeta?.usn || '1FA23CS042',
        sem: '6th Semester',
        branch: extraMeta?.branch || 'Computer Science & Engineering',
        studyStreak: 15,
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, newFirestoreProfile, { merge: true });
      return newFirestoreProfile;
    } catch (e) {
      console.warn('Firestore profile fetch/init error:', e);
      const fallbackName = displayName || (userEmail ? userEmail.split('@')[0] : 'Scholar Student');
      return {
        id: userDocId,
        auth_uid: userId,
        fullName: fallbackName,
        email: userEmail || '',
        avatarUrl: photoURL || '',
        role: 'Academic Scholar',
        usn: extraMeta?.usn || '1FA23CS042',
        sem: '6th Semester',
        branch: extraMeta?.branch || 'Computer Science & Engineering',
        studyStreak: 15,
        createdAt: new Date().toISOString()
      };
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const p = await fetchOrInitFirestoreProfile(
        auth.currentUser.uid,
        auth.currentUser.email,
        auth.currentUser.displayName,
        auth.currentUser.photoURL
      );
      setProfile(p);
    }
  };

  useEffect(() => {
    // Listen directly to Firebase Auth lifecycle
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const cleanName = getCleanUserName(firebaseUser.displayName, firebaseUser.email, firebaseUser.uid);
        const authUserObj: AuthUser = {
          uid: firebaseUser.uid,
          id: cleanName,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          user_metadata: {
            full_name: firebaseUser.displayName || undefined,
            avatar_url: firebaseUser.photoURL || undefined
          }
        };

        setUser(authUserObj);
        setSession({ user: authUserObj });
        const p = await fetchOrInitFirestoreProfile(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
          firebaseUser.photoURL
        );
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdUser = userCredential.user;

      if (fullName) {
        await firebaseUpdateAuthProfile(createdUser, { displayName: fullName });
      }

      const cleanName = getCleanUserName(fullName, email, createdUser.uid);

      const newFirestoreProfile: UserProfile = {
        id: cleanName,
        auth_uid: createdUser.uid,
        fullName: fullName.trim() || email.split('@')[0],
        email: createdUser.email || email,
        avatarUrl: '',
        role: 'Academic Scholar',
        usn: usn?.trim() || '1FA23CS042',
        sem: sem?.trim() || '1st Semester',
        branch: branch?.trim() || 'Computer Science & Engineering',
        studyStreak: 15,
        createdAt: new Date().toISOString()
      };

      // Persist profile in Firestore database under the User's Name document ID
      await setDoc(doc(db, 'users', cleanName), newFirestoreProfile, { merge: true });

      const authUserObj: AuthUser = {
        uid: createdUser.uid,
        id: cleanName,
        email: createdUser.email,
        displayName: fullName,
        photoURL: null,
        user_metadata: { full_name: fullName, usn, branch }
      };

      setUser(authUserObj);
      setSession({ user: authUserObj });
      setProfile(newFirestoreProfile);

      return { error: null, needsEmailVerification: false };
    } catch (err: any) {
      console.error('Firebase signUp error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const signedInUser = credential.user;

      const p = await fetchOrInitFirestoreProfile(
        signedInUser.uid,
        signedInUser.email,
        signedInUser.displayName,
        signedInUser.photoURL
      );

      const cleanName = getCleanUserName(signedInUser.displayName || p.fullName, signedInUser.email, signedInUser.uid);

      const authUserObj: AuthUser = {
        uid: signedInUser.uid,
        id: cleanName,
        email: signedInUser.email,
        displayName: signedInUser.displayName || p.fullName,
        photoURL: signedInUser.photoURL || p.avatarUrl || null,
        user_metadata: { full_name: p.fullName }
      };

      setUser(authUserObj);
      setSession({ user: authUserObj });
      setProfile(p);

      return { error: null };
    } catch (err: any) {
      console.error('Firebase signIn error:', err);
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      const cleanName = getCleanUserName(googleUser.displayName, googleUser.email, googleUser.uid);

      const googleProfile: UserProfile = {
        id: cleanName,
        auth_uid: googleUser.uid,
        fullName: googleUser.displayName || 'Google Scholar',
        email: googleUser.email || '',
        avatarUrl: googleUser.photoURL || '',
        role: 'Google Verified Scholar',
        usn: '1FA23CS099',
        sem: '6th Semester',
        branch: 'Computer Science & Engineering',
        studyStreak: 15,
        createdAt: new Date().toISOString()
      };

      // Persist profile in Firestore database under the User's Name document ID
      await setDoc(doc(db, 'users', cleanName), googleProfile, { merge: true });

      const authUserObj: AuthUser = {
        uid: googleUser.uid,
        id: cleanName,
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoURL: googleUser.photoURL,
        user_metadata: { full_name: googleUser.displayName || undefined, avatar_url: googleUser.photoURL || undefined }
      };

      setUser(authUserObj);
      setSession({ user: authUserObj });
      setProfile(googleProfile);

      return { error: null };
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
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
    try {
      await sendPasswordResetEmail(auth, email);
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
    if (!auth.currentUser) return { error: new Error('User not logged in') };

    try {
      const userDocId = getCleanUserName(
        updates.fullName || profile?.fullName || auth.currentUser.displayName,
        auth.currentUser.email,
        auth.currentUser.uid
      );
      
      const userRef = doc(db, 'users', userDocId);
      
      const firestoreUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

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
      console.error('Firebase updateProfile in Firestore error:', err);
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
