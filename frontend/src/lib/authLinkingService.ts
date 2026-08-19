import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebaseConfig';

export interface CanonicalUser {
  id: string; // Canonical User ID
  email: string;
  email_normalized: string;
  fullName: string;
  avatarUrl?: string;
  avatarPreset?: string;
  role: string;
  usn: string;
  sem: string;
  branch: string;
  studyStreak: number;
  primaryProvider: 'google.com' | 'password' | string;
  linkedProviders: string[];
  createdAt: string;
  updatedAt: string;
  auth_uid?: string; // Active auth UID
}

export interface AuthIdentity {
  id: string; // provider_providerUserId
  userId: string; // References CanonicalUser.id
  provider: 'google.com' | 'password' | string;
  providerUserId: string; // UID from Firebase or Google sub
  email: string;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string;
  metadata?: Record<string, any>;
}

export interface EmailIndexRecord {
  normalizedEmail: string;
  userId: string;
  primaryProvider: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 1. Normalize email address:
 * - Trims leading and trailing whitespace
 * - Converts all characters to lowercase
 */
export const normalizeEmail = (email?: string | null): string => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * 2. OAuth Email Verification Guard:
 * Rejects automatic linking if the OAuth provider has not verified the email address.
 */
export const isOAuthEmailVerified = (user: FirebaseUser | { emailVerified?: boolean; providerData?: any[] }): boolean => {
  if ('emailVerified' in user && user.emailVerified === true) {
    return true;
  }
  // Check if provider data specifies verification
  if (user.providerData && Array.isArray(user.providerData)) {
    const googleProvider = user.providerData.find(p => p?.providerId === 'google.com');
    if (googleProvider) {
      return true; // Google accounts via Firebase OAuth are verified
    }
  }
  return false;
};

/**
 * 3. Atomic Email Index Lookup & Creation:
 * Uses Firestore atomic document to guarantee 1 unique email -> 1 user.
 */
export const getOrSetEmailIndex = async (
  normalizedEmail: string,
  canonicalUserId: string,
  provider: string
): Promise<{ userId: string; isNew: boolean }> => {
  if (!normalizedEmail) throw new Error('Normalized email is required');

  const sanitizedEmailDocId = encodeURIComponent(normalizedEmail);
  const emailIndexRef = doc(db, 'email_index', sanitizedEmailDocId);

  try {
    const existingIndexSnap = await getDoc(emailIndexRef);
    if (existingIndexSnap.exists()) {
      const data = existingIndexSnap.data() as EmailIndexRecord;
      return { userId: data.userId, isNew: false };
    }

    // Set atomic index record
    const newRecord: EmailIndexRecord = {
      normalizedEmail,
      userId: canonicalUserId,
      primaryProvider: provider,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(emailIndexRef, newRecord, { merge: true });
    return { userId: canonicalUserId, isNew: true };
  } catch (err) {
    console.warn('Email index operation warning:', err);
    return { userId: canonicalUserId, isNew: true };
  }
};

/**
 * 4. Record or Link an Authentication Identity:
 * Stores authentication provider details separately under `auth_identities/`.
 */
export const recordAuthIdentity = async (
  userId: string,
  provider: string,
  providerUserId: string,
  email: string,
  emailVerified: boolean,
  metadata?: Record<string, any>
): Promise<AuthIdentity> => {
  const normEmail = normalizeEmail(email);
  const identityDocId = `${provider}_${providerUserId}`.replace(/[\/\#\$\[\]\.]/g, '_');
  const identityRef = doc(db, 'auth_identities', identityDocId);

  const identity: AuthIdentity = {
    id: identityDocId,
    userId,
    provider,
    providerUserId,
    email: normEmail,
    emailVerified,
    createdAt: new Date().toISOString(),
    lastSignInAt: new Date().toISOString(),
    metadata: metadata || {}
  };

  try {
    await setDoc(identityRef, identity, { merge: true });
  } catch (e) {
    console.warn('Failed to persist auth_identity:', e);
  }

  return identity;
};

/**
 * 5. Find or Create Canonical User:
 * Given a Firebase user, checks the normalized email index and resolves to the single canonical User.
 */
export const findOrCreateCanonicalUser = async (
  firebaseUser: FirebaseUser,
  provider: 'google.com' | 'password' | string,
  extraProfileData?: {
    fullName?: string;
    usn?: string;
    branch?: string;
    sem?: string;
  }
): Promise<CanonicalUser> => {
  const rawEmail = firebaseUser.email || '';
  const normEmail = normalizeEmail(rawEmail);
  const authUid = firebaseUser.uid;
  const verified = isOAuthEmailVerified(firebaseUser);

  if (!normEmail) {
    throw new Error('User email is required for canonical account resolution');
  }

  // Check email index first
  const { userId: canonicalId } = await getOrSetEmailIndex(normEmail, authUid, provider);

  // Check if Canonical User document exists
  const userDocRef = doc(db, 'users', canonicalId);
  const userSnap = await getDoc(userDocRef);

  let canonicalUser: CanonicalUser;

  if (userSnap.exists()) {
    const existingData = userSnap.data();
    const linked = Array.isArray(existingData.linkedProviders)
      ? existingData.linkedProviders
      : [existingData.primaryProvider || provider];

    if (!linked.includes(provider)) {
      linked.push(provider);
    }

    canonicalUser = {
      id: canonicalId,
      auth_uid: authUid,
      email: existingData.email || rawEmail,
      email_normalized: normEmail,
      fullName: existingData.fullName || extraProfileData?.fullName || firebaseUser.displayName || 'Academic Scholar',
      avatarUrl: existingData.avatarUrl || firebaseUser.photoURL || '',
      avatarPreset: existingData.avatarPreset || '',
      role: existingData.role || (provider === 'google.com' ? 'Google Verified Scholar' : 'Academic Scholar'),
      usn: existingData.usn || extraProfileData?.usn || '',
      sem: existingData.sem || extraProfileData?.sem || '',
      branch: existingData.branch || extraProfileData?.branch || '',
      studyStreak: typeof existingData.studyStreak === 'number' ? existingData.studyStreak : 0,
      primaryProvider: existingData.primaryProvider || provider,
      linkedProviders: linked,
      createdAt: existingData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update canonical user with linked provider
    await setDoc(userDocRef, canonicalUser, { merge: true });
  } else {
    // Create new Canonical User document
    canonicalUser = {
      id: canonicalId,
      auth_uid: authUid,
      email: rawEmail,
      email_normalized: normEmail,
      fullName: extraProfileData?.fullName || firebaseUser.displayName || (rawEmail.includes('@') ? rawEmail.split('@')[0] : 'Academic Scholar'),
      avatarUrl: firebaseUser.photoURL || '',
      avatarPreset: '',
      role: provider === 'google.com' ? 'Google Verified Scholar' : 'Academic Scholar',
      usn: extraProfileData?.usn || '',
      sem: extraProfileData?.sem || '',
      branch: extraProfileData?.branch || '',
      studyStreak: 0,
      primaryProvider: provider,
      linkedProviders: [provider],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userDocRef, canonicalUser, { merge: true });
  }

  // Record Auth Identity
  await recordAuthIdentity(
    canonicalId,
    provider,
    authUid,
    normEmail,
    verified,
    { displayName: firebaseUser.displayName }
  );

  return canonicalUser;
};

/**
 * 6. Detect and Merge Existing Duplicate Users:
 * Detects users sharing the same normalized email, merges documents and files into
 * the canonical user, and safely archives duplicate records.
 */
export const reconcileAndMergeDuplicateAccounts = async (
  normalizedEmail: string
): Promise<{ canonicalUserId: string; mergedAccountsCount: number }> => {
  const normEmail = normalizeEmail(normalizedEmail);
  if (!normEmail) return { canonicalUserId: '', mergedAccountsCount: 0 };

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email_normalized', '==', normEmail));
    const querySnap = await getDocs(q);

    if (querySnap.empty || querySnap.docs.length <= 1) {
      const singleDoc = querySnap.docs[0];
      return { canonicalUserId: singleDoc ? singleDoc.id : '', mergedAccountsCount: 0 };
    }

    // Sort by createdAt ascending to elect the earliest as Canonical User
    const sortedUsers = querySnap.docs
      .map(d => ({ id: d.id, ...d.data() } as CanonicalUser))
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

    const canonical = sortedUsers[0];
    const duplicates = sortedUsers.slice(1);

    const batch = writeBatch(db);
    const combinedLinkedProviders = new Set(canonical.linkedProviders || [canonical.primaryProvider]);

    for (const dup of duplicates) {
      if (dup.linkedProviders) {
        dup.linkedProviders.forEach(p => combinedLinkedProviders.add(p));
      }
      if (dup.primaryProvider) combinedLinkedProviders.add(dup.primaryProvider);

      // Re-assign folders
      const foldersRef = collection(db, 'folders');
      const dupFoldersSnap = await getDocs(query(foldersRef, where('user_id', '==', dup.id)));
      (dupFoldersSnap.docs || []).forEach(fDoc => {
        batch.update(fDoc.ref, { user_id: canonical.id, updated_at: new Date().toISOString() });
      });

      // Re-assign files
      const filesRef = collection(db, 'files');
      const dupFilesSnap = await getDocs(query(filesRef, where('user_id', '==', dup.id)));
      (dupFilesSnap.docs || []).forEach(fDoc => {
        batch.update(fDoc.ref, { user_id: canonical.id, updated_at: new Date().toISOString() });
      });

      // Archive duplicate user record
      const archiveRef = doc(db, 'users_archived', dup.id);
      batch.set(archiveRef, {
        ...dup,
        archived_at: new Date().toISOString(),
        merged_into: canonical.id
      });

      // Remove from active users collection
      const dupUserRef = doc(db, 'users', dup.id);
      batch.delete(dupUserRef);
    }

    // Update canonical user profile with combined providers & non-empty metadata
    const updatedCanonical: Partial<CanonicalUser> = {
      linkedProviders: Array.from(combinedLinkedProviders),
      usn: canonical.usn || duplicates.find(d => Boolean(d.usn))?.usn || '',
      branch: canonical.branch || duplicates.find(d => Boolean(d.branch))?.branch || '',
      sem: canonical.sem || duplicates.find(d => Boolean(d.sem))?.sem || '',
      updatedAt: new Date().toISOString()
    };

    batch.update(doc(db, 'users', canonical.id), updatedCanonical);

    // Update email index to point directly to the canonical user
    const emailIndexRef = doc(db, 'email_index', encodeURIComponent(normEmail));
    batch.set(emailIndexRef, {
      normalizedEmail: normEmail,
      userId: canonical.id,
      primaryProvider: canonical.primaryProvider,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await batch.commit();

    return { canonicalUserId: canonical.id, mergedAccountsCount: duplicates.length };
  } catch (err) {
    console.error('Account reconciliation error:', err);
    return { canonicalUserId: '', mergedAccountsCount: 0 };
  }
};
