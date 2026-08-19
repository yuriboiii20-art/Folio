import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeEmail,
  isOAuthEmailVerified,
  getOrSetEmailIndex,
  recordAuthIdentity,
  findOrCreateCanonicalUser,
  reconcileAndMergeDuplicateAccounts
} from '../authLinkingService';

// In-Memory Mock Database for Firestore Operations
const mockFirestore: {
  users: Record<string, any>;
  email_index: Record<string, any>;
  auth_identities: Record<string, any>;
  folders: Record<string, any>;
  files: Record<string, any>;
  users_archived: Record<string, any>;
} = {
  users: {},
  email_index: {},
  auth_identities: {},
  folders: {},
  files: {},
  users_archived: {}
};

// Mock Firebase Firestore SDK
vi.mock('firebase/firestore', () => {
  return {
    getFirestore: () => ({}),
    doc: (_db: any, collectionName: string, docId: string) => ({
      collection: collectionName,
      id: docId,
      path: `${collectionName}/${docId}`
    }),
    collection: (_db: any, collectionName: string) => ({
      name: collectionName
    }),
    getDoc: async (docRef: any) => {
      const data = mockFirestore[docRef.collection as keyof typeof mockFirestore]?.[docRef.id];
      return {
        exists: () => Boolean(data),
        data: () => data || null,
        id: docRef.id
      };
    },
    setDoc: async (docRef: any, data: any, options?: { merge?: boolean }) => {
      if (!mockFirestore[docRef.collection as keyof typeof mockFirestore]) {
        mockFirestore[docRef.collection as keyof typeof mockFirestore] = {};
      }
      const existing = mockFirestore[docRef.collection as keyof typeof mockFirestore][docRef.id] || {};
      mockFirestore[docRef.collection as keyof typeof mockFirestore][docRef.id] = options?.merge
        ? { ...existing, ...data }
        : data;
    },
    updateDoc: async (docRef: any, updates: any) => {
      const existing = mockFirestore[docRef.collection as keyof typeof mockFirestore]?.[docRef.id] || {};
      mockFirestore[docRef.collection as keyof typeof mockFirestore][docRef.id] = { ...existing, ...updates };
    },
    deleteDoc: async (docRef: any) => {
      delete mockFirestore[docRef.collection as keyof typeof mockFirestore]?.[docRef.id];
    },
    getDocs: async (q: any) => {
      const collName = q.collName || q.name;
      const coll = mockFirestore[collName as keyof typeof mockFirestore] || {};
      let items = Object.entries(coll).map(([id, val]) => ({ id, data: () => val, ref: { collection: collName, id } }));
      if (q.filterField && q.filterValue !== undefined) {
        items = items.filter(item => item.data()[q.filterField] === q.filterValue);
      }
      return {
        empty: items.length === 0,
        docs: items,
        forEach: (cb: (doc: any) => void) => items.forEach(cb)
      };
    },
    query: (collRef: any, ...constraints: any[]) => {
      const q: any = { collName: collRef.name };
      constraints.forEach(c => {
        if (c && c.type === 'where') {
          q.filterField = c.field;
          q.filterValue = c.value;
        }
      });
      return q;
    },
    where: (field: string, _op: string, value: any) => ({
      type: 'where',
      field,
      value
    }),
    writeBatch: () => {
      const operations: (() => void)[] = [];
      return {
        set: (docRef: any, data: any, options?: any) => {
          operations.push(() => {
            if (!mockFirestore[docRef.collection as keyof typeof mockFirestore]) {
              mockFirestore[docRef.collection as keyof typeof mockFirestore] = {};
            }
            const existing = mockFirestore[docRef.collection as keyof typeof mockFirestore][docRef.id] || {};
            mockFirestore[docRef.collection as keyof typeof mockFirestore][docRef.id] = options?.merge
              ? { ...existing, ...data }
              : data;
          });
        },
        update: (docRef: any, updates: any) => {
          operations.push(() => {
            const existing = mockFirestore[docRef.collection as keyof typeof mockFirestore]?.[docRef.id] || {};
            mockFirestore[docRef.collection as keyof typeof mockFirestore][docRef.id] = { ...existing, ...updates };
          });
        },
        delete: (docRef: any) => {
          operations.push(() => {
            delete mockFirestore[docRef.collection as keyof typeof mockFirestore]?.[docRef.id];
          });
        },
        commit: async () => {
          operations.forEach(op => op());
        }
      };
    }
  };
});

describe('Unified Authentication & Account Linking Service', () => {
  beforeEach(() => {
    // Reset mock database before each test
    mockFirestore.users = {};
    mockFirestore.email_index = {};
    mockFirestore.auth_identities = {};
    mockFirestore.folders = {};
    mockFirestore.files = {};
    mockFirestore.users_archived = {};
  });

  describe('1. Email Normalization', () => {
    it('trims leading and trailing whitespace', () => {
      expect(normalizeEmail('   user@example.com   ')).toBe('user@example.com');
      expect(normalizeEmail('\tstudent@folio.edu\n')).toBe('student@folio.edu');
    });

    it('converts all characters to lowercase', () => {
      expect(normalizeEmail('User.Name@Example.COM')).toBe('user.name@example.com');
      expect(normalizeEmail('SCHOLAR@FOLIO.EDU')).toBe('scholar@folio.edu');
    });

    it('handles empty or null email gracefully', () => {
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail(null)).toBe('');
      expect(normalizeEmail(undefined)).toBe('');
    });
  });

  describe('2. OAuth Email Verification Guard', () => {
    it('accepts verified Google email accounts', () => {
      const verifiedGoogleUser: any = {
        email: 'scholar@gmail.com',
        emailVerified: true,
        providerData: [{ providerId: 'google.com' }]
      };
      expect(isOAuthEmailVerified(verifiedGoogleUser)).toBe(true);
    });

    it('rejects unverified OAuth accounts', () => {
      const unverifiedUser: any = {
        email: 'unverified@external.com',
        emailVerified: false,
        providerData: []
      };
      expect(isOAuthEmailVerified(unverifiedUser)).toBe(false);
    });
  });

  describe('3. Login-Order Scenario 1: Google OAuth First -> Email/Password Second', () => {
    it('resolves both sign-in methods to the exact same canonical userId', async () => {
      const googleFirebaseUser: any = {
        uid: 'google_uid_123',
        email: 'Scholar@Example.Com',
        displayName: 'Alex Johnson',
        photoURL: 'https://lh3.googleusercontent.com/a/photo.jpg',
        emailVerified: true,
        providerData: [{ providerId: 'google.com' }]
      };

      // 1. First: User signs up with Google
      const canonicalUserFromGoogle = await findOrCreateCanonicalUser(
        googleFirebaseUser,
        'google.com'
      );

      expect(canonicalUserFromGoogle.email_normalized).toBe('scholar@example.com');
      expect(canonicalUserFromGoogle.id).toBe('google_uid_123');
      expect(canonicalUserFromGoogle.linkedProviders).toContain('google.com');

      // 2. Second: User later registers/signs in with Email/Password using the same email
      const passwordFirebaseUser: any = {
        uid: 'password_uid_456',
        email: '   scholar@example.com ',
        displayName: 'Alex J.',
        emailVerified: false
      };

      const canonicalUserFromPassword = await findOrCreateCanonicalUser(
        passwordFirebaseUser,
        'password',
        { usn: '1FA23CS042', branch: 'Computer Science' }
      );

      // Must resolve to the EXACT same canonical user ID
      expect(canonicalUserFromPassword.id).toBe(canonicalUserFromGoogle.id);
      expect(canonicalUserFromPassword.email_normalized).toBe('scholar@example.com');
      // Both providers should be recorded in linkedProviders
      expect(canonicalUserFromPassword.linkedProviders).toContain('google.com');
      expect(canonicalUserFromPassword.linkedProviders).toContain('password');
    });
  });

  describe('4. Login-Order Scenario 2: Email/Password First -> Google OAuth Second', () => {
    it('links Google OAuth to the existing email/password account seamlessly', async () => {
      const passwordFirebaseUser: any = {
        uid: 'pwd_uid_999',
        email: 'scholar.alex@folio.edu',
        displayName: 'Alex Scholar',
        emailVerified: true
      };

      // 1. First: User creates email/password account
      const canonicalFromPassword = await findOrCreateCanonicalUser(
        passwordFirebaseUser,
        'password',
        { fullName: 'Alex Scholar', usn: '1FA22CS088', branch: 'Information Science' }
      );

      expect(canonicalFromPassword.id).toBe('pwd_uid_999');
      expect(canonicalFromPassword.primaryProvider).toBe('password');
      expect(canonicalFromPassword.usn).toBe('1FA22CS088');

      // 2. Second: User signs in with Google using same email
      const googleFirebaseUser: any = {
        uid: 'google_uid_888',
        email: 'SCHOLAR.ALEX@FOLIO.EDU',
        displayName: 'Alex Scholar (Google)',
        photoURL: 'https://avatar.google.com/alex.jpg',
        emailVerified: true,
        providerData: [{ providerId: 'google.com' }]
      };

      const canonicalFromGoogle = await findOrCreateCanonicalUser(
        googleFirebaseUser,
        'google.com'
      );

      // Must resolve to original user account and preserve profile details
      expect(canonicalFromGoogle.id).toBe(canonicalFromPassword.id);
      expect(canonicalFromGoogle.usn).toBe('1FA22CS088');
      expect(canonicalFromGoogle.linkedProviders).toContain('password');
      expect(canonicalFromGoogle.linkedProviders).toContain('google.com');
    });
  });

  describe('5. Unique Database Constraint & Concurrent Creation Protection', () => {
    it('guarantees single identity mapping in email_index', async () => {
      const email = 'concurrent@folio.edu';
      const normEmail = normalizeEmail(email);

      // Simulate first request
      const firstResult = await getOrSetEmailIndex(normEmail, 'user_first_1', 'password');
      expect(firstResult.isNew).toBe(true);
      expect(firstResult.userId).toBe('user_first_1');

      // Simulate concurrent second request for same email with different UID
      const secondResult = await getOrSetEmailIndex(normEmail, 'user_second_2', 'google.com');
      expect(secondResult.isNew).toBe(false);
      expect(secondResult.userId).toBe('user_first_1'); // Points to the first canonical userId
    });
  });

  describe('6. Duplicate User Account Detection & Safe Merge', () => {
    it('detects duplicate accounts, moves folders/files, and archives duplicates safely', async () => {
      const email = 'alex.student@folio.edu';
      const normEmail = normalizeEmail(email);

      // Seed duplicate account 1 (Older - Canonical)
      mockFirestore.users['user_canonical'] = {
        id: 'user_canonical',
        email: 'alex.student@folio.edu',
        email_normalized: normEmail,
        fullName: 'Alex Primary',
        primaryProvider: 'password',
        linkedProviders: ['password'],
        createdAt: '2026-01-01T00:00:00.000Z'
      };

      // Seed duplicate account 2 (Newer - Duplicate)
      mockFirestore.users['user_duplicate'] = {
        id: 'user_duplicate',
        email: 'alex.student@folio.edu',
        email_normalized: normEmail,
        fullName: 'Alex Duplicate',
        usn: '1FA24CS100',
        primaryProvider: 'google.com',
        linkedProviders: ['google.com'],
        createdAt: '2026-02-01T00:00:00.000Z'
      };

      // Seed files belonging to duplicate account
      mockFirestore.files['file_101'] = {
        id: 'file_101',
        user_id: 'user_duplicate',
        file_name: 'OS_Unit_1.pdf'
      };

      // Seed folders belonging to duplicate account
      mockFirestore.folders['folder_201'] = {
        id: 'folder_201',
        user_id: 'user_duplicate',
        name: 'Operating Systems'
      };

      // Reconcile duplicates
      const result = await reconcileAndMergeDuplicateAccounts(normEmail);

      expect(result.canonicalUserId).toBe('user_canonical');
      expect(result.mergedAccountsCount).toBe(1);

      // Verify files & folders were reassigned to canonical user
      expect(mockFirestore.files['file_101'].user_id).toBe('user_canonical');
      expect(mockFirestore.folders['folder_201'].user_id).toBe('user_canonical');

      // Verify duplicate user is archived and removed from active users
      expect(mockFirestore.users['user_duplicate']).toBeUndefined();
      expect(mockFirestore.users_archived['user_duplicate']).toBeDefined();
      expect(mockFirestore.users_archived['user_duplicate'].merged_into).toBe('user_canonical');

      // Verify canonical user received merged metadata & providers
      expect(mockFirestore.users['user_canonical'].linkedProviders).toContain('password');
      expect(mockFirestore.users['user_canonical'].linkedProviders).toContain('google.com');
      expect(mockFirestore.users['user_canonical'].usn).toBe('1FA24CS100');
    });
  });
});
