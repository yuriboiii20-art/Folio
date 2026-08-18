import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { auth, db, storage } from './firebaseConfig';

export interface DbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  subject_name?: string;
  parent_folder_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFile {
  id: string;
  user_id: string;
  folder_id?: string | null;
  file_name: string;
  original_file_name?: string;
  storage_path: string;
  data_url?: string;
  file_type?: string;
  mime_type?: string;
  file_size?: number;
  is_starred?: boolean;
  trashed?: boolean;
  trashed_at?: string | null;
  extracted_text?: string;
  created_at: string;
  updated_at: string;
}

export interface DbDeadline {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  subject_color?: string;
  date_str: string;
  created_at: string;
}

const getEffectiveUserId = (): string | null => {
  return auth.currentUser ? auth.currentUser.uid : null;
};

// ============================================================================
// 1. FOLDERS SERVICE (Cloud Firestore Database)
// ============================================================================

export const fetchFolders = async (): Promise<DbFolder[]> => {
  const userId = getEffectiveUserId();
  if (!userId) return [];

  try {
    const foldersRef = collection(db, 'folders');
    const q = query(foldersRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);

    const folders: DbFolder[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      folders.push({
        id: docSnap.id,
        user_id: data.user_id,
        name: data.name || 'Untitled Folder',
        description: data.description || '',
        subject_name: data.subject_name || data.name || '',
        parent_folder_id: data.parent_folder_id || null,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    folders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return folders;
  } catch (error) {
    console.error('Firestore fetchFolders error:', error);
    return [];
  }
};

export const createFolder = async (
  name: string,
  description?: string,
  subjectName?: string,
  parentFolderId?: string | null
): Promise<DbFolder | null> => {
  const userId = getEffectiveUserId();
  if (!userId) throw new Error('User must be authenticated to create a folder');

  const newFolderData = {
    user_id: userId,
    name: name.trim(),
    description: description?.trim() || '',
    subject_name: subjectName?.trim() || name.trim(),
    parent_folder_id: parentFolderId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const foldersRef = collection(db, 'folders');
    const docRef = await addDoc(foldersRef, newFolderData);
    return {
      id: docRef.id,
      ...newFolderData
    };
  } catch (error) {
    console.error('Error creating folder in Firestore:', error);
    throw error;
  }
};

export const updateFolder = async (
  folderId: string,
  updates: Partial<DbFolder>
): Promise<DbFolder | null> => {
  try {
    const folderRef = doc(db, 'folders', folderId);
    const updatePayload: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    await updateDoc(folderRef, updatePayload);
    const updatedSnap = await getDoc(folderRef);
    if (updatedSnap.exists()) {
      return { id: updatedSnap.id, ...updatedSnap.data() } as DbFolder;
    }
    return null;
  } catch (error) {
    console.error('Error updating folder in Firestore:', error);
    throw error;
  }
};

export const deleteFolder = async (folderId: string): Promise<boolean> => {
  const userId = getEffectiveUserId();
  if (!userId) throw new Error('User must be authenticated');

  try {
    // 1. Find and delete contained files & storage objects in Firebase
    const filesRef = collection(db, 'files');
    const q = query(filesRef, where('folder_id', '==', folderId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    for (const docSnap of snapshot.docs) {
      const fileData = docSnap.data();
      if (fileData.storage_path) {
        try {
          const fileStorageRef = ref(storage, fileData.storage_path);
          await deleteObject(fileStorageRef);
        } catch (e) {
          console.warn('Storage file removal note:', e);
        }
      }
      batch.delete(docSnap.ref);
    }
    await batch.commit();

    // 2. Delete the folder doc in Firestore
    await deleteDoc(doc(db, 'folders', folderId));
    return true;
  } catch (error) {
    console.error('Error deleting folder in Firestore:', error);
    throw error;
  }
};

// ============================================================================
// 2. FILES & STORAGE SERVICE (Cloud Firestore Database + Firebase Storage)
// ============================================================================

export const fetchFiles = async (folderId?: string): Promise<DbFile[]> => {
  const userId = getEffectiveUserId();
  if (!userId) return [];

  try {
    const filesRef = collection(db, 'files');
    let q = query(
      filesRef,
      where('user_id', '==', userId),
      where('trashed', '==', false)
    );

    if (folderId) {
      q = query(
        filesRef,
        where('user_id', '==', userId),
        where('folder_id', '==', folderId),
        where('trashed', '==', false)
      );
    }

    const snapshot = await getDocs(q);
    const files: DbFile[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      files.push({
        id: docSnap.id,
        user_id: data.user_id,
        folder_id: data.folder_id || null,
        file_name: data.file_name,
        original_file_name: data.original_file_name || data.file_name,
        storage_path: data.storage_path || '',
        data_url: data.data_url || '',
        file_type: data.file_type || 'doc',
        mime_type: data.mime_type || 'application/octet-stream',
        file_size: data.file_size || 0,
        is_starred: Boolean(data.is_starred),
        trashed: Boolean(data.trashed),
        trashed_at: data.trashed_at || null,
        extracted_text: data.extracted_text || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return files;
  } catch (error) {
    console.error('Firestore fetchFiles error:', error);
    return [];
  }
};

export const fetchTrashedFiles = async (): Promise<DbFile[]> => {
  const userId = getEffectiveUserId();
  if (!userId) return [];

  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef,
      where('user_id', '==', userId),
      where('trashed', '==', true)
    );

    const snapshot = await getDocs(q);
    const trashedFiles: DbFile[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      trashedFiles.push({
        id: docSnap.id,
        user_id: data.user_id,
        folder_id: data.folder_id || null,
        file_name: data.file_name,
        original_file_name: data.original_file_name || data.file_name,
        storage_path: data.storage_path || '',
        data_url: data.data_url || '',
        file_type: data.file_type || 'doc',
        mime_type: data.mime_type || 'application/octet-stream',
        file_size: data.file_size || 0,
        is_starred: Boolean(data.is_starred),
        trashed: true,
        trashed_at: data.trashed_at || new Date().toISOString(),
        extracted_text: data.extracted_text || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      });
    });

    trashedFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return trashedFiles;
  } catch (error) {
    console.error('Firestore fetchTrashedFiles error:', error);
    return [];
  }
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadFile = async (
  file: File,
  folderId?: string | null,
  extractedSnippet?: string
): Promise<DbFile | null> => {
  const userId = getEffectiveUserId();
  if (!userId) throw new Error('User must be authenticated to upload files');

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniquePrefix = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const targetFolder = folderId || 'general';
  const storagePath = `users/${userId}/folders/${targetFolder}/${uniquePrefix}_${sanitizedFileName}`;

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileType = fileExt === 'pdf' ? 'pdf' : (fileExt === 'txt' || fileExt === 'md' ? 'text' : 'doc');

  let fileDataUrl: string | undefined = undefined;
  // If file is reasonable size (< 800KB), convert to Data URL for Firestore persistence
  if (file.size < 800 * 1024) {
    try {
      fileDataUrl = await fileToDataUrl(file);
    } catch (e) { }
  }

  const newFileRecord: any = {
    user_id: userId,
    folder_id: folderId || null,
    file_name: file.name,
    original_file_name: file.name,
    storage_path: storagePath,
    file_type: fileType,
    mime_type: file.type || 'application/octet-stream',
    file_size: file.size,
    is_starred: false,
    trashed: false,
    trashed_at: null,
    extracted_text: extractedSnippet || `File: ${file.name} (Uploaded to ${folderId || 'Root'})`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (fileDataUrl) {
    newFileRecord.data_url = fileDataUrl;
  }

  // 1. Try uploading to Firebase Storage if active
  try {
    const storageReference = ref(storage, storagePath);
    await uploadBytes(storageReference, file);
  } catch (storageErr) {
    console.warn('Firebase Cloud Storage note (using Cloud Firestore database persistence):', storageErr);
  }

  // 2. Save document record in Cloud Firestore database
  try {
    const filesRef = collection(db, 'files');
    const docRef = await addDoc(filesRef, newFileRecord);

    return {
      id: docRef.id,
      ...newFileRecord
    };
  } catch (error) {
    console.error('Firestore save document error:', error);
    throw error;
  }
};

export const getFileDownloadUrl = async (storagePath: string, fileDataUrl?: string): Promise<string | null> => {
  if (fileDataUrl) return fileDataUrl;
  if (!storagePath) return null;
  try {
    const storageReference = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(storageReference);
    return downloadUrl;
  } catch (e) {
    return null;
  }
};

export const trashFile = async (fileId: string): Promise<boolean> => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      trashed: true,
      trashed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error trashing file in Firestore:', error);
    throw error;
  }
};

export const restoreFile = async (fileId: string): Promise<boolean> => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      trashed: false,
      trashed_at: null,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error restoring file in Firestore:', error);
    throw error;
  }
};

export const permanentlyDeleteFile = async (fileId: string, storagePath?: string): Promise<boolean> => {
  // 1. Delete from Firebase Cloud Storage
  if (storagePath) {
    try {
      const storageReference = ref(storage, storagePath);
      await deleteObject(storageReference);
    } catch (e) {
      console.warn('Firebase Storage delete notice:', e);
    }
  }

  // 2. Delete document from Firestore database
  try {
    const fileRef = doc(db, 'files', fileId);
    await deleteDoc(fileRef);
    return true;
  } catch (error) {
    console.error('Error permanently deleting file in Firestore:', error);
    throw error;
  }
};

export const emptyTrash = async (): Promise<boolean> => {
  const userId = getEffectiveUserId();
  if (!userId) return false;

  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef,
      where('user_id', '==', userId),
      where('trashed', '==', true)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    for (const docSnap of snapshot.docs) {
      const fileData = docSnap.data();
      if (fileData.storage_path) {
        try {
          const fileStorageRef = ref(storage, fileData.storage_path);
          await deleteObject(fileStorageRef);
        } catch (e) { }
      }
      batch.delete(docSnap.ref);
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error emptying trash in Firestore:', error);
    return false;
  }
};

export const toggleFileStarred = async (fileId: string, currentStarred: boolean): Promise<boolean> => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      is_starred: !currentStarred,
      updated_at: new Date().toISOString(),
    });
    return !currentStarred;
  } catch (error) {
    console.error('Error toggling starred in Firestore:', error);
    throw error;
  }
};

export const renameFile = async (fileId: string, newFileName: string): Promise<boolean> => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      file_name: newFileName.trim(),
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error renaming file in Firestore:', error);
    throw error;
  }
};

// ============================================================================
// 3. DEADLINES & USER DATA SERVICE (Cloud Firestore Database)
// ============================================================================

export const fetchDeadlines = async (): Promise<DbDeadline[]> => {
  const userId = getEffectiveUserId();
  if (!userId) return [];

  try {
    const deadlinesRef = collection(db, 'deadlines');
    const q = query(deadlinesRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);

    const deadlines: DbDeadline[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      deadlines.push({
        id: docSnap.id,
        user_id: data.user_id,
        title: data.title,
        subject: data.subject,
        subject_color: data.subject_color || 'text-blue-500',
        date_str: data.date_str,
        created_at: data.created_at || new Date().toISOString()
      });
    });

    deadlines.sort((a, b) => new Date(a.date_str).getTime() - new Date(b.date_str).getTime());
    return deadlines;
  } catch (e) {
    console.error('Error fetching deadlines from Firestore:', e);
    return [];
  }
};

export const createDeadline = async (
  title: string,
  subject: string,
  dateStr: string,
  subjectColor?: string
): Promise<DbDeadline | null> => {
  const userId = getEffectiveUserId();
  if (!userId) throw new Error('User must be authenticated');

  const newDeadline = {
    user_id: userId,
    title: title.trim(),
    subject: subject.trim(),
    subject_color: subjectColor || 'text-blue-500',
    date_str: dateStr,
    created_at: new Date().toISOString()
  };

  try {
    const deadlinesRef = collection(db, 'deadlines');
    const docRef = await addDoc(deadlinesRef, newDeadline);
    return {
      id: docRef.id,
      ...newDeadline
    };
  } catch (e) {
    console.error('Error creating deadline in Firestore:', e);
    throw e;
  }
};

export const deleteDeadline = async (deadlineId: string): Promise<boolean> => {
  try {
    const deadlineRef = doc(db, 'deadlines', deadlineId);
    await deleteDoc(deadlineRef);
    return true;
  } catch (e) {
    console.error('Error deleting deadline in Firestore:', e);
    return false;
  }
};
