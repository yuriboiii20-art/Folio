import { supabase } from './supabaseClient';

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

const STORAGE_BUCKET = 'user-files';

// ============================================================================
// 1. FOLDERS SERVICE
// ============================================================================

export const fetchFolders = async (): Promise<DbFolder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
  return data || [];
};

export const createFolder = async (
  name: string,
  description?: string,
  subjectName?: string,
  parentFolderId?: string | null
): Promise<DbFolder | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to create a folder');

  const newFolder = {
    user_id: user.id,
    name: name.trim(),
    description: description?.trim() || '',
    subject_name: subjectName?.trim() || name.trim(),
    parent_folder_id: parentFolderId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('folders')
    .insert(newFolder)
    .select()
    .single();

  if (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
  return data;
};

export const updateFolder = async (
  folderId: string,
  updates: Partial<DbFolder>
): Promise<DbFolder | null> => {
  const { data, error } = await supabase
    .from('folders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
  return data;
};

export const deleteFolder = async (folderId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in');

  // 1. Find all files inside this folder
  const { data: folderFiles } = await supabase
    .from('files')
    .select('id, storage_path')
    .eq('folder_id', folderId);

  // 2. Remove storage objects for contained files
  if (folderFiles && folderFiles.length > 0) {
    const paths = folderFiles.map(f => f.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    }
    // Delete files rows
    await supabase.from('files').delete().eq('folder_id', folderId);
  }

  // 3. Delete folder record
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
  return true;
};

// ============================================================================
// 2. FILES SERVICE
// ============================================================================

export const fetchFiles = async (folderId?: string): Promise<DbFile[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('files')
    .select('*')
    .eq('trashed', false)
    .order('created_at', { ascending: false });

  if (folderId) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching files:', error);
    return [];
  }
  return data || [];
};

export const fetchTrashedFiles = async (): Promise<DbFile[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('trashed', true)
    .order('trashed_at', { ascending: false });

  if (error) {
    console.error('Error fetching trashed files:', error);
    return [];
  }
  return data || [];
};

export const uploadFile = async (
  file: File,
  folderId?: string | null,
  extractedSnippet?: string
): Promise<DbFile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to upload files');

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniquePrefix = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const targetFolder = folderId || 'general';
  const storagePath = `${user.id}/${targetFolder}/${uniquePrefix}_${sanitizedFileName}`;

  // 1. Upload file to Supabase Private Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    // If bucket doesn't exist yet, retry with standard fallback or notify
    throw new Error(uploadError.message || 'Storage upload failed');
  }

  // 2. Insert metadata into files table
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileType = fileExt === 'pdf' ? 'pdf' : (fileExt === 'txt' || fileExt === 'md' ? 'text' : 'doc');

  const newFileRecord = {
    user_id: user.id,
    folder_id: folderId || null,
    file_name: file.name,
    original_file_name: file.name,
    storage_path: storagePath,
    file_type: fileType,
    mime_type: file.type || 'application/octet-stream',
    file_size: file.size,
    is_starred: false,
    trashed: false,
    extracted_text: extractedSnippet || `File: ${file.name} (Uploaded to ${folderId || 'Root'})`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error: dbError } = await supabase
    .from('files')
    .insert(newFileRecord)
    .select()
    .single();

  if (dbError) {
    console.error('Error inserting file record:', dbError);
    // Cleanup orphaned storage object
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw dbError;
  }

  return data;
};

export const getFileDownloadUrl = async (storagePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600); // 1-hour signed URL

    if (error || !data?.signedUrl) {
      console.error('Signed URL creation error:', error);
      return null;
    }
    return data.signedUrl;
  } catch (e) {
    console.error('Error getting download URL:', e);
    return null;
  }
};

export const trashFile = async (fileId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('files')
    .update({
      trashed: true,
      trashed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  if (error) {
    console.error('Error moving file to trash:', error);
    throw error;
  }
  return true;
};

export const restoreFile = async (fileId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('files')
    .update({
      trashed: false,
      trashed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  if (error) {
    console.error('Error restoring file:', error);
    throw error;
  }
  return true;
};

export const permanentlyDeleteFile = async (fileId: string, storagePath?: string): Promise<boolean> => {
  // 1. If storage path provided, delete from Supabase storage
  if (storagePath) {
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    } catch (e) {
      console.warn('Storage delete warning:', e);
    }
  }

  // 2. Delete row from files table
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId);

  if (error) {
    console.error('Error permanently deleting file:', error);
    throw error;
  }
  return true;
};

export const emptyTrash = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: trashedList } = await supabase
    .from('files')
    .select('id, storage_path')
    .eq('trashed', true);

  if (trashedList && trashedList.length > 0) {
    const paths = trashedList.map(t => t.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    }
    await supabase.from('files').delete().eq('trashed', true);
  }

  return true;
};

export const toggleFileStarred = async (fileId: string, currentStarred: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('files')
    .update({
      is_starred: !currentStarred,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  if (error) {
    console.error('Error toggling starred:', error);
    throw error;
  }
  return !currentStarred;
};

export const renameFile = async (fileId: string, newFileName: string): Promise<boolean> => {
  const { error } = await supabase
    .from('files')
    .update({
      file_name: newFileName.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  if (error) {
    console.error('Error renaming file:', error);
    throw error;
  }
  return true;
};
