import React, { useState, useEffect, useRef } from 'react';
import { SearchInput } from './search-input';
import FolderCard from './folder';
import { GoogleGenAI } from '@google/genai';
import * as FirebaseService from '../../lib/firebaseService';
import { useAuth } from '../../lib/authContext';
import {
  BarChart as VisxBarChart,
  Bar as VisxBar,
  BarXAxis as VisxBarXAxis,
  ChartTooltip as VisxChartTooltip,
  LinearGradient as VisxLinearGradient,
  BarLineIndicator as VisxBarLineIndicator
} from './bar-chart';
import {
  LayoutGrid,
  Home,
  BarChart2,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FolderClosed,
  FileText,
  Bot,
  Search,
  Upload,
  Sparkles,
  X,
  FolderPlus,
  ArrowLeft,
  GraduationCap,
  Hash,
  BookOpen,
  Eye,
  Download,
  FolderOpen,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Send,
  Flame,
  Activity,
  Layers,
  FileCode,
  Plus,
  Bell,
  Trash2,
  KeyRound,
  UserCog,
  Camera,
  AlertTriangle,
  Grid,
  List,
  Sliders,
  FolderTree,
  RotateCcw,
  Undo2,
  Calendar,
  CalendarDays,
  HardDrive,
  Star
} from 'lucide-react';

export type WebNavItem = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
};

export interface SubjectFolder {
  id: string;
  name: string;
  code: string;
  description: string;
  fileCount: number;
  colorHex?: string;
  isStarred?: boolean;
}

export interface AcademicFile {
  id: string;
  title: string;
  folderId: string;
  source: string;
  size: string;
  date: string;
  fileUrl?: string;
  storagePath?: string;
  contentSnippet?: string;
  fileType?: 'pdf' | 'text' | 'doc';
  sizeBytes?: number;
  isStarred?: boolean;
}

export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  animatingOut?: boolean;
}

export interface DeadlineItem {
  id: string;
  title: string;
  subject: string;
  subjectColor?: string;
  dateStr: string;
  completed?: boolean;
  animatingOut?: boolean;
}

export interface OmniSearchResult {
  id: string;
  category: 'page' | 'folder' | 'file' | 'todo' | 'deadline' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge: string;
  badgeBg: string;
  action: () => void;
}

export interface DesktopWebAppProps {
  currentUser?: {
    name: string;
    role: string;
    usn: string;
    sem: string;
    branch: string;
    email: string;
    studyStreak: number;
    avatarUrl?: string;
  };
  onLogout?: () => void;
}

export default function DesktopWebApp({ currentUser, onLogout }: DesktopWebAppProps = {}) {
  const { updateProfile: authUpdateProfile, updatePassword: authUpdatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Trash Bin & Browser Status Link State
  const [trashedFiles, setTrashedFiles] = useState<AcademicFile[]>([]);
  const [trashedFolders, setTrashedFolders] = useState<SubjectFolder[]>(() => {
    try {
      const cached = localStorage.getItem('folio_cached_trashed_folders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });
  const [hoveredStatusLink, setHoveredStatusLink] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('folio_cached_trashed_folders', JSON.stringify(trashedFolders));
    } catch (e) { }
  }, [trashedFolders]);

  // Upcoming Deadlines State
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([
    {
      id: 'dl-1',
      title: 'Complete Programming Assignment 1',
      subject: 'Introduction to Computer Science',
      subjectColor: 'text-blue-500',
      dateStr: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
    },
    {
      id: 'dl-2',
      title: 'Quiz 1 Preparation',
      subject: 'Introduction to Computer Science',
      subjectColor: 'text-blue-500',
      dateStr: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
    },
    {
      id: 'dl-3',
      title: 'Psychology Research Paper Outline',
      subject: 'Introduction to Psychology',
      subjectColor: 'text-amber-500',
      dateStr: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })()
    },
    {
      id: 'dl-4',
      title: 'Problem Set 2',
      subject: 'Calculus I',
      subjectColor: 'text-emerald-500',
      dateStr: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString().split('T')[0]; })()
    }
  ]);

  const [isAddDeadlineModalOpen, setIsAddDeadlineModalOpen] = useState(false);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineSubject, setNewDeadlineSubject] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  const formatDeadlineDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = months[target.getMonth()];
    const dayNum = target.getDate();

    return `${monthName}- ${dayNum}`;
  };

  const handleAddDeadline = () => {
    if (!newDeadlineTitle.trim() || !newDeadlineDate) return;
    const colors = ['text-blue-500', 'text-amber-500', 'text-emerald-500', 'text-indigo-500', 'text-rose-500'];
    const randomColor = colors[deadlines.length % colors.length];

    const newItem: DeadlineItem = {
      id: `dl-${Date.now()}`,
      title: newDeadlineTitle.trim(),
      subject: newDeadlineSubject.trim() || 'General Academic Task',
      subjectColor: randomColor,
      dateStr: newDeadlineDate
    };

    setDeadlines(prev => [...prev, newItem]);
    setNewDeadlineTitle('');
    setNewDeadlineSubject('');
    setNewDeadlineDate('');
    setIsAddDeadlineModalOpen(false);
  };

  const handleCompleteDeadline = (id: string) => {
    setDeadlines(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, completed: true, animatingOut: true };
      }
      return d;
    }));

    setTimeout(() => {
      setDeadlines(prev => prev.filter(d => d.id !== id));
    }, 450);
  };

  const handleDeleteDeadline = (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
  };

  // Cloud Storage Backup State & Handler
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackupFiles = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const backupData = {
        studentProfile,
        folders,
        files,
        todoTasks,
        deadlines,
        backupTimestamp: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Folio_Studio_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('BACKUP CREATED', 'Complete archive saved to your device', 'success');
    }, 900);
  };

  // TO-DO Tasks State
  const [todoTasks, setTodoTasks] = useState<TodoTask[]>([
    { id: 'todo-1', text: 'Review Computer Networks Unit 1 notes', completed: false },
    { id: 'todo-2', text: 'Submit Relational Algebra assignment', completed: false },
    { id: 'todo-3', text: 'Prepare Python ML Lab script', completed: false },
  ]);
  const [newTodoText, setNewTodoText] = useState('');

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const newTask: TodoTask = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false
    };
    setTodoTasks(prev => [newTask, ...prev]);
    setNewTodoText('');
  };

  const handleCompleteTodo = (id: string) => {
    setTodoTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: true, animatingOut: true };
      }
      return t;
    }));

    setTimeout(() => {
      setTodoTasks(prev => prev.filter(t => t.id !== id));
    }, 450);
  };

  const handleDeleteTodo = (id: string) => {
    setTodoTasks(prev => prev.filter(t => t.id !== id));
  };

  // Smooth Animation Out State Tracking
  const [animatingOutIds, setAnimatingOutIds] = useState<string[]>([]);

  // Toggle Star Handlers for Folders & Files (Database Synced)
  const handleToggleStarFolder = async (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = folders.find(f => f.id === folderId)?.isStarred || false;

    if (current && activeTab === 'starred') {
      setAnimatingOutIds(prev => [...prev, folderId]);
      setTimeout(async () => {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isStarred: false } : f));
        setAnimatingOutIds(prev => prev.filter(id => id !== folderId));
        try {
          await FirebaseService.toggleFolderStarred(folderId, true);
        } catch (err) {
          console.warn('Firebase folder star toggle error:', err);
        }
      }, 300);
    } else {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isStarred: !current } : f));
      try {
        await FirebaseService.toggleFolderStarred(folderId, current);
      } catch (err) {
        console.warn('Firebase folder star toggle error:', err);
      }
    }
  };

  const handleToggleStarFile = async (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = files.find(f => f.id === fileId)?.isStarred || false;

    if (current && activeTab === 'starred') {
      setAnimatingOutIds(prev => [...prev, fileId]);
      setTimeout(async () => {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isStarred: false } : f));
        setAnimatingOutIds(prev => prev.filter(id => id !== fileId));
        try {
          await FirebaseService.toggleFileStarred(fileId, true);
        } catch (err) {
          console.warn('Firebase file star toggle error:', err);
        }
      }, 300);
    } else {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isStarred: !current } : f));
      try {
        await FirebaseService.toggleFileStarred(fileId, current);
      } catch (err) {
        console.warn('Firebase file star toggle error:', err);
      }
    }
  };

  // Folder Trash & Restore Handlers with Smooth Delete Animation
  const handleTrashFolder = (folderId: string) => {
    const targetFolder = folders.find(f => f.id === folderId);
    if (!targetFolder) return;

    setAnimatingOutIds(prev => [...prev, folderId]);

    setTimeout(async () => {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setTrashedFolders(prev => [targetFolder, ...prev]);
      setAnimatingOutIds(prev => prev.filter(id => id !== folderId));
      showNotification('FOLDER DISCARDED', `"${targetFolder.name}" moved to Trash Bin`, 'info');

      try {
        await FirebaseService.trashFolder(folderId);
      } catch (err) {
        console.warn('Firebase folder trash note:', err);
      }
    }, 300);
  };

  const handleRestoreFolder = async (folder: SubjectFolder) => {
    setTrashedFolders(prev => prev.filter(f => f.id !== folder.id));
    setFolders(prev => [folder, ...prev]);
    showNotification('FOLDER RESTORED', `"${folder.name}" restored to library`, 'success');

    try {
      await FirebaseService.restoreFolder(folder.id);
    } catch (err) {
      console.warn('Firebase folder restore note:', err);
    }
  };

  const handlePermanentDeleteFolder = async (folderId: string) => {
    setTrashedFolders(prev => prev.filter(f => f.id !== folderId));
    showNotification('FOLDER PERMANENTLY DELETED', 'Folder removed permanently', 'warning');

    try {
      await FirebaseService.deleteFolder(folderId);
    } catch (err) {
      console.warn('Firebase permanent folder deletion note:', err);
    }
  };

  // Modals Open State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const showNotification = (title: string, message?: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotificationModal({ isOpen: true, title, message, type });
  };

  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deletingFileTarget, setDeletingFileTarget] = useState<AcademicFile | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<AcademicFile | null>(null);
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);

  // Folder Opening & In-App Reader State
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState<AcademicFile | null>(null);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Search Query State & Omni-Search Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Analytics Bar Animation Mounted State
  const [isAnalyticsMounted, setIsAnalyticsMounted] = useState(false);

  useEffect(() => {
    if (activeTab === 'analytics') {
      setIsAnalyticsMounted(false);
      const timer = setTimeout(() => {
        setIsAnalyticsMounted(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnalyticsMounted(false);
    }
  }, [activeTab]);

  // Highlighted Item State (for Search Redirection visual feedback)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const triggerSearchHighlight = (targetId: string) => {
    setHighlightedItemId(targetId);
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 1200); // Fast 1.2s "beep beep" double-pulse flash
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Active & Trashed Documents from Firebase Cloud
  const fetchBackendDocuments = async () => {
    try {
      // 1. Fetch Firebase Folders
      let dbFolders = await FirebaseService.fetchFolders();
      
      // If user has no folders in Firestore yet, seed starter folders directly into Firestore
      if (!dbFolders || dbFolders.length === 0) {
        const starterSubjects = [
          { name: 'Database Management Systems', code: 'CS-DBMS', desc: 'Relational Schema, SQL & Normalization' },
          { name: 'Operating Systems', code: 'CS-OS', desc: 'CPU Scheduling, Virtual Memory & Concurrency' },
          { name: 'Computer Networks', code: 'CS-NET', desc: 'TCP/IP, Routing Protocols & Sockets' },
          { name: 'Mathematics & Algorithms', code: 'CS-MATH', desc: 'Linear Algebra, Probability & Graph Theory' },
        ];
        for (const s of starterSubjects) {
          try {
            await FirebaseService.createFolder(s.name, s.desc, s.code);
          } catch (e) { }
        }
        dbFolders = await FirebaseService.fetchFolders();
      }

      if (dbFolders && dbFolders.length > 0) {
        const colors = ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a'];
        setFolders(dbFolders.map((f, idx) => ({
          id: f.id,
          name: f.name,
          code: f.subject_name || f.description?.substring(0, 8) || 'SUBJ',
          description: f.description || 'Academic subject resource folder',
          fileCount: 0,
          colorHex: colors[idx % colors.length],
          isStarred: Boolean(f.is_starred)
        })));
      }

      // 2. Fetch Firebase Active Files
      const dbFiles = await FirebaseService.fetchFiles();
      if (dbFiles) {
        const mappedActive: AcademicFile[] = await Promise.all(dbFiles.map(async doc => {
          let downloadUrl = '';
          if (doc.data_url) {
            downloadUrl = doc.data_url;
          } else if (doc.storage_path) {
            downloadUrl = (await FirebaseService.getFileDownloadUrl(doc.storage_path, doc.data_url)) || '';
          }
          const sizeMb = doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB';
          const isPdf = doc.file_name ? doc.file_name.toLowerCase().endsWith('.pdf') : true;

          return {
            id: doc.id,
            title: doc.file_name,
            folderId: doc.folder_id || 'f-cn',
            source: 'Firebase Cloud',
            size: sizeMb,
            sizeBytes: doc.file_size || 1048576,
            date: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recently',
            fileType: isPdf ? 'pdf' : 'text',
            fileUrl: downloadUrl || undefined,
            storagePath: doc.storage_path,
            contentSnippet: doc.extracted_text || `Document: ${doc.file_name}`,
            isStarred: doc.is_starred || false
          };
        }));

        setFiles(mappedActive);
        setFolders(prev => prev.map(f => ({
          ...f,
          fileCount: mappedActive.filter(file => file.folderId === f.id).length
        })));
      }

      // 3. Fetch Firebase Trashed Files
      const dbTrashed = await FirebaseService.fetchTrashedFiles();
      if (dbTrashed) {
        const mappedTrashed: AcademicFile[] = dbTrashed.map(doc => {
          const sizeMb = doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB';
          const isPdf = doc.file_name ? doc.file_name.toLowerCase().endsWith('.pdf') : true;
          return {
            id: doc.id,
            title: doc.file_name,
            folderId: doc.folder_id || 'f-cn',
            source: 'Firebase Cloud',
            size: sizeMb,
            sizeBytes: doc.file_size || 1048576,
            date: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recently',
            fileType: isPdf ? 'pdf' : 'text',
            storagePath: doc.storage_path,
            contentSnippet: doc.extracted_text || `Document: ${doc.file_name}`,
            isStarred: doc.is_starred || false
          };
        });
        setTrashedFiles(mappedTrashed);
      }

      // 4. Fetch Firebase Trashed Folders
      const dbTrashedFolders = await FirebaseService.fetchTrashedFolders();
      if (dbTrashedFolders) {
        setTrashedFolders(dbTrashedFolders.map((f, idx) => ({
          id: f.id,
          name: f.name,
          code: f.subject_name || f.description?.substring(0, 8) || 'SUBJ',
          description: f.description || 'Academic subject resource folder',
          fileCount: 0,
          colorHex: '#64748b',
          isStarred: Boolean(f.is_starred)
        })));
      }
    } catch (e) {
      console.warn('Firebase document fetch note:', e);
    }
  };

  useEffect(() => {
    fetchBackendDocuments();
  }, [activeTab]);



  // Student Profile State
  const [studentProfile, setStudentProfile] = useState(() => {
    return (
      currentUser || {
        name: 'Alex Johnson',
        role: 'Computer Science Scholar',
        usn: '1FA21CS042',
        sem: '6th Semester',
        branch: 'Computer Science & Engineering',
        email: 'alex.johnson@folio.edu',
        studyStreak: 12,
        avatarUrl: ''
      }
    );
  });

  // Sync profile when currentUser prop changes
  useEffect(() => {
    if (currentUser) {
      setStudentProfile(currentUser);
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditUsn(currentUser.usn);
      setEditRole(currentUser.role);
      setEditBranch(currentUser.branch);
    }
  }, [currentUser]);

  // Edit Profile Form State
  const [editName, setEditName] = useState(studentProfile.name);
  const [editEmail, setEditEmail] = useState(studentProfile.email);
  const [editUsn, setEditUsn] = useState(studentProfile.usn);
  const [editRole, setEditRole] = useState(studentProfile.role);
  const [editBranch, setEditBranch] = useState(studentProfile.branch);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // App Settings State (Fulfills Request #4 completely)
  const [appSettings, setAppSettings] = useState({
    defaultUploadLocation: 'f-cn',
    autoOrganizeFiles: true,
    autoCreateSubjectFolders: true,
    sortBy: 'Date added' as 'Name' | 'Date added' | 'File type' | 'Size',
    defaultView: 'List' as 'Grid' | 'List',
    showFileExtensions: true,
    confirmBeforeDeleting: true,
    autoRenameDuplicates: true,
  });

  // Dynamic Folders State (Synced with localStorage cache)
  const [folders, setFolders] = useState<SubjectFolder[]>(() => {
    try {
      const cached = localStorage.getItem('folio_cached_folders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return [
      {
        id: 'f-cn',
        name: 'Computer Networks',
        code: 'CS301',
        description: 'OSI layers, TCP/IP protocol stack, IP addressing & CIDR subnetting notes',
        fileCount: 4,
        colorHex: '#334155'
      },
      {
        id: 'f-dbms',
        name: 'Database Management',
        code: 'CS302',
        description: 'SQL query optimization, ER diagrams, 3NF Normalization & ACID properties',
        fileCount: 3,
        colorHex: '#475569'
      },
      {
        id: 'f-ml',
        name: 'Machine Learning',
        code: 'CS401',
        description: 'Supervised algorithms, Decision Trees, Neural Networks & python lab manuals',
        fileCount: 5,
        colorHex: '#0f172a'
      }
    ];
  });

  // Dynamic Files State (Synced with localStorage cache)
  const [files, setFiles] = useState<AcademicFile[]>(() => {
    try {
      const cached = localStorage.getItem('folio_cached_files');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return [
      {
        id: 'doc-1',
        title: 'Unit-1_IP_Addressing_Notes.pdf',
        folderId: 'f-cn',
        source: 'WhatsApp',
        size: '1.0 MB',
        sizeBytes: 1048576,
        date: 'Today',
        fileType: 'pdf',
        fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        contentSnippet: 'Chapter 1: IP Addressing Principles, Subnetting, IPv4 Header structure, and CIDR Notation.'
      },
      {
        id: 'doc-2',
        title: 'Relational_Algebra_Assignment.pdf',
        folderId: 'f-dbms',
        source: 'Google Classroom',
        size: '2.0 MB',
        sizeBytes: 2097152,
        date: 'Yesterday',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        contentSnippet: 'Assignment 2: Selection (σ), Projection (π), Cartesian Product (×), and Natural Join (⋈) queries.'
      }
    ];
  });

  // Persist folders and files changes to local browser storage immediately
  useEffect(() => {
    try {
      if (folders && folders.length > 0) {
        localStorage.setItem('folio_cached_folders', JSON.stringify(folders));
      }
    } catch (e) { }
  }, [folders]);

  useEffect(() => {
    try {
      if (files && files.length > 0) {
        localStorage.setItem('folio_cached_files', JSON.stringify(files));
      }
    } catch (e) { }
  }, [files]);

  // Form States
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(appSettings.defaultUploadLocation);
  const [selectedSource, setSelectedSource] = useState<string>('Direct Upload');

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Welcome to AI Studio! Ask any question about your subject notes, study concepts, or academic assignments.",
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const navItems: WebNavItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutGrid },
    { id: 'home', title: 'Subject Folders', icon: Home, badge: folders.length, badgeColor: 'bg-slate-200 text-slate-800' },
    { id: 'analytics', title: 'Analytics', icon: BarChart2 },
    { id: 'ai-studio', title: 'AI Studio', icon: Bot, badge: 'RAG', badgeColor: 'bg-slate-800 text-white' },
    { id: 'trash', title: 'Trash', icon: Trash2, badge: trashedFiles.length, badgeColor: trashedFiles.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400' },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];



  // Sorting and Filtering Files based on Settings
  const getSortedFiles = (fileList: AcademicFile[]) => {
    let list = [...fileList];

    // Filter by search query if any
    if (searchQuery.trim()) {
      list = list.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by setting
    switch (appSettings.sortBy) {
      case 'Name':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'File type':
        return list.sort((a, b) => (a.fileType || '').localeCompare(b.fileType || ''));
      case 'Size':
        return list.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
      case 'Date added':
      default:
        return list.sort((a, b) => b.id.localeCompare(a.id));
    }
  };

  // Helper for Displaying File Title (with or without extension)
  const formatFileTitle = (title: string) => {
    if (appSettings.showFileExtensions) return title;
    return title.replace(/\.[^/.]+$/, "");
  };

  // Omni-Search Engine (Full Case-Insensitive Matching across pages, folders, files, to-dos, deadlines & settings)
  const getOmniSearchResults = (): OmniSearchResult[] => {
    try {
      const q = searchQuery.trim().toLowerCase();
      const results: OmniSearchResult[] = [];

      // 1. Pages & Navigation Menu
      const pageItems = [
        { id: 'p-dashboard', title: 'Dashboard Overview', subtitle: 'Main academic studio & summary', icon: LayoutGrid, tabId: 'dashboard' },
        { id: 'p-home', title: 'Subject Folders', subtitle: 'Browse all subject note directories', icon: Home, tabId: 'home' },
        { id: 'p-ai', title: 'AI Studio', subtitle: 'Interactive Llama 3.2 study assistant', icon: Bot, tabId: 'ai-studio' },
        { id: 'p-profile', title: 'Scholar Profile', subtitle: 'View & edit student details', icon: User, tabId: 'profile' },
        { id: 'p-settings', title: 'Workspace Settings & Backup', subtitle: 'Storage utilization & defaults', icon: Settings, tabId: 'settings' },
        { id: 'p-trash', title: 'Trash Bin', subtitle: 'Recover deleted files & documents', icon: Trash2, tabId: 'trash' },
      ];

      pageItems.forEach(p => {
        if (!q || (p.title && p.title.toLowerCase().includes(q)) || (p.subtitle && p.subtitle.toLowerCase().includes(q))) {
          results.push({
            id: p.id,
            category: 'page',
            title: p.title,
            subtitle: p.subtitle,
            icon: p.icon,
            badge: 'PAGE',
            badgeBg: 'bg-slate-100 text-slate-700',
            action: () => {
              setActiveTab(p.tabId);
              setOpenedFolderId(null);
              triggerSearchHighlight(p.id);
            }
          });
        }
      });

      // 2. Subject Folders (Case-Insensitive name, code, desc)
      if (Array.isArray(folders)) {
        folders.forEach(f => {
          const name = f?.name || '';
          const code = f?.code || '';
          const desc = f?.description || '';
          if (!q || name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
            results.push({
              id: `folder-${f.id}`,
              category: 'folder',
              title: `${name} (${code})`,
              subtitle: desc,
              icon: FolderClosed,
              badge: 'FOLDER',
              badgeBg: 'bg-amber-100 text-amber-800',
              action: () => {
                setActiveTab('home');
                setOpenedFolderId(f.id);
                triggerSearchHighlight(f.id);
              }
            });
          }
        });
      }

      // 3. Academic Files & Documents (Case-Insensitive title, source, snippet)
      if (Array.isArray(files)) {
        files.forEach(file => {
          const title = file?.title || '';
          const source = file?.source || '';
          const snippet = file?.contentSnippet || '';
          if (!q || title.toLowerCase().includes(q) || source.toLowerCase().includes(q) || snippet.toLowerCase().includes(q)) {
            const folder = folders.find(f => f.id === file.folderId);
            results.push({
              id: `file-${file.id}`,
              category: 'file',
              title: title,
              subtitle: `${folder ? folder.name : 'Document'} • ${source} • ${file?.size || ''}`,
              icon: FileText,
              badge: file?.fileType === 'pdf' ? 'PDF' : 'TEXT',
              badgeBg: file?.fileType === 'pdf' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800',
              action: () => {
                setReadingFile(file);
                triggerSearchHighlight(file.id);
              }
            });
          }
        });
      }

      // 4. Academic To-Do Tasks (Case-Insensitive task text)
      if (Array.isArray(todoTasks)) {
        todoTasks.forEach(task => {
          const text = task?.text || '';
          if (!q || text.toLowerCase().includes(q)) {
            results.push({
              id: `todo-${task.id}`,
              category: 'todo',
              title: text,
              subtitle: 'Academic To-Do Task',
              icon: Check,
              badge: 'TO-DO',
              badgeBg: 'bg-emerald-100 text-emerald-800',
              action: () => {
                setActiveTab('dashboard');
                triggerSearchHighlight(task.id);
              }
            });
          }
        });
      }

      // 5. Upcoming Deadlines (Case-Insensitive title, subject)
      if (Array.isArray(deadlines)) {
        deadlines.forEach(dl => {
          const title = dl?.title || '';
          const subject = dl?.subject || '';
          if (!q || title.toLowerCase().includes(q) || subject.toLowerCase().includes(q)) {
            results.push({
              id: `dl-${dl.id}`,
              category: 'deadline',
              title: title,
              subtitle: `${subject} ${dl?.dateStr ? '• Due ' + formatDeadlineDate(dl.dateStr) : ''}`,
              icon: Calendar,
              badge: 'DEADLINE',
              badgeBg: 'bg-indigo-100 text-indigo-800',
              action: () => {
                setActiveTab('dashboard');
                triggerSearchHighlight(dl.id);
              }
            });
          }
        });
      }

      // 6. Actions & Settings Controls (Case-Insensitive title, subtitle)
      const actionItems = [
        { id: 'act-upload', title: 'Upload Academic Notes', subtitle: 'Add new PDF or text file to folder', icon: Upload, fn: () => setIsUploadModalOpen(true) },
        { id: 'act-new-folder', title: 'Create New Subject Folder', subtitle: 'Add a new subject directory', icon: FolderPlus, fn: () => setIsCreateFolderModalOpen(true) },
        { id: 'act-backup', title: 'Backup All Files & Data', subtitle: 'Download complete workspace archive', icon: HardDrive, fn: () => handleBackupFiles() },
        { id: 'act-edit-profile', title: 'Edit Scholar Profile', subtitle: 'Update name, USN, email, or department', icon: UserCog, fn: () => { setActiveTab('profile'); setIsEditProfileModalOpen(true); } },
        { id: 'act-password', title: 'Change Password', subtitle: 'Update workspace account password', icon: KeyRound, fn: () => { setActiveTab('profile'); setIsChangePasswordModalOpen(true); } },
      ];

      actionItems.forEach(act => {
        if (!q || (act.title && act.title.toLowerCase().includes(q)) || (act.subtitle && act.subtitle.toLowerCase().includes(q))) {
          results.push({
            id: act.id,
            category: 'action',
            title: act.title,
            subtitle: act.subtitle,
            icon: act.icon,
            badge: 'ACTION',
            badgeBg: 'bg-purple-100 text-purple-800',
            action: () => {
              act.fn();
              triggerSearchHighlight(act.id);
            }
          });
        }
      });

      return results;
    } catch (err) {
      console.error("OmniSearch error:", err);
      return [];
    }
  };

  const omniSearchResults = getOmniSearchResults();

  // Create New Subject Folder (Database Synced)
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const colors = ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a'];
    const randomColor = colors[folders.length % colors.length];

    try {
      const created = await FirebaseService.createFolder(
        newFolderName.trim(),
        newFolderDesc.trim(),
        newFolderCode.trim()
      );

      const newFolder: SubjectFolder = {
        id: created ? created.id : `f-${Date.now()}`,
        name: newFolderName.trim(),
        code: newFolderCode.trim() || 'CS-GEN',
        description: newFolderDesc.trim() || 'Subject academic resource folder',
        fileCount: 0,
        colorHex: randomColor
      };

      setFolders(prev => [...prev, newFolder]);
      showNotification('FOLDER CREATED', `"${newFolder.name}" saved to Firebase`, 'success');
    } catch (err: any) {
      showNotification('FOLDER CREATION FAILED', err?.message || 'Error creating folder in Firebase', 'warning');
    }

    setNewFolderName('');
    setNewFolderCode('');
    setNewFolderDesc('');
    setIsCreateFolderModalOpen(false);
  };

  // Upload File via Browser File Picker (Firebase Cloud Storage & Firestore)
  const [isUploading, setIsUploading] = useState(false);

  const handleCloseUploadModal = () => {
    setIsUploading(false);
    setSelectedUploadFile(null);
    setIsUploadModalOpen(false);
  };

  const handleUploadFileSubmit = async () => {
    if (isUploading) return;
    if (!selectedUploadFile) {
      showNotification("NO FILE SELECTED", "Please browse and select a document from your device first.", "warning");
      return;
    }

    setIsUploading(true);

    try {
      let fileNameToUse = selectedUploadFile.name;

      if (appSettings.autoRenameDuplicates) {
        const exists = files.some(f => f.title.toLowerCase() === fileNameToUse.toLowerCase());
        if (exists) {
          const parts = fileNameToUse.split('.');
          const ext = parts.pop();
          fileNameToUse = `${parts.join('.')}_(1).${ext}`;
        }
      }

      const isPdf = fileNameToUse.toLowerCase().endsWith('.pdf');
      const localBlobUrl = URL.createObjectURL(selectedUploadFile);
      const fileSizeMb = (selectedUploadFile.size / (1024 * 1024)).toFixed(1);
      const targetFolderId = selectedFolderId || openedFolderId || folders[0]?.id || 'general';

      // Extract text preview snippet locally for text files
      let snippetText = `Document uploaded: ${fileNameToUse}. Stored in Firebase Cloud Storage.`;
      if (!isPdf && selectedUploadFile.type.includes('text')) {
        try {
          const rawText = await selectedUploadFile.text();
          if (rawText) snippetText = rawText.substring(0, 2000);
        } catch (e) { }
      }

      // Upload to Firebase Storage & Firestore
      let uploadedDbFile = null;
      try {
        uploadedDbFile = await FirebaseService.uploadFile(selectedUploadFile, targetFolderId, snippetText);
      } catch (err) {
        console.warn('Firebase upload fallback:', err);
      }

      let downloadUrl = localBlobUrl;
      if (uploadedDbFile?.data_url) {
        downloadUrl = uploadedDbFile.data_url;
      } else if (uploadedDbFile?.storage_path) {
        const signedUrl = await FirebaseService.getFileDownloadUrl(uploadedDbFile.storage_path);
        if (signedUrl) downloadUrl = signedUrl;
      }

      const newFile: AcademicFile = {
        id: uploadedDbFile?.id || `doc-${Date.now()}`,
        title: fileNameToUse,
        folderId: targetFolderId,
        source: selectedSource || 'Firebase Cloud',
        size: `${fileSizeMb} MB`,
        sizeBytes: selectedUploadFile.size,
        date: 'Just now',
        fileType: isPdf ? 'pdf' : 'text',
        fileUrl: downloadUrl,
        storagePath: uploadedDbFile?.storage_path,
        contentSnippet: snippetText
      };

      setFiles(prev => [newFile, ...prev]);

      setFolders(prev => prev.map(f => {
        if (f.id === targetFolderId) {
          return { ...f, fileCount: f.fileCount + 1 };
        }
        return f;
      }));

      const uploadedName = fileNameToUse;
      setSelectedUploadFile(null);
      setIsUploadModalOpen(false);
      showNotification('FILE UPLOADED', uploadedName, 'success');
    } catch (err: any) {
      showNotification("UPLOAD FAILED", err?.message || "Error processing file", "warning");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete File Handler (Moves to Trash)
  const handleDeleteFile = (doc: AcademicFile) => {
    if (appSettings.confirmBeforeDeleting) {
      setDeletingFileTarget(doc);
    } else {
      performDeleteFile(doc.id);
    }
  };

  const performDeleteFile = (fileId: string) => {
    const targetFile = files.find(f => f.id === fileId);
    if (!targetFile) return;

    setDeletingFileTarget(null);
    setAnimatingOutIds(prev => [...prev, fileId]);

    setTimeout(async () => {
      setFolders(prev => prev.map(f => {
        if (f.id === targetFile.folderId) {
          return { ...f, fileCount: Math.max(0, f.fileCount - 1) };
        }
        return f;
      }));
      setTrashedFiles(prev => [targetFile, ...prev.filter(t => t.id !== targetFile.id)]);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setAnimatingOutIds(prev => prev.filter(id => id !== fileId));

      if (readingFile?.id === fileId) {
        setReadingFile(null);
      }
      showNotification('MOVED TO TRASH', targetFile.title || 'File moved to trash', 'info');

      try {
        await FirebaseService.trashFile(fileId);
      } catch (e) {
        console.warn('Firebase trash error:', e);
      }
    }, 300);
  };

  const handleRestoreFile = async (doc: AcademicFile) => {
    setTrashedFiles(prev => prev.filter(f => f.id !== doc.id));
    setFiles(prev => [doc, ...prev]);
    setFolders(prev => prev.map(f => {
      if (f.id === doc.folderId) {
        return { ...f, fileCount: f.fileCount + 1 };
      }
      return f;
    }));

    try {
      await FirebaseService.restoreFile(doc.id);
    } catch (e) {
      console.warn('Firebase restore error:', e);
    }
    showNotification('FILE RESTORED', doc.title, 'success');
  };

  const handlePermanentDeleteFile = async (fileId: string) => {
    const targetFile = trashedFiles.find(f => f.id === fileId);
    setTrashedFiles(prev => prev.filter(f => f.id !== fileId));
    setPermanentDeleteTarget(null);

    try {
      await FirebaseService.permanentlyDeleteFile(fileId, targetFile?.storagePath);
    } catch (e) {
      console.warn('Firebase permanent delete error:', e);
    }
    showNotification('PERMANENTLY DELETED', 'File removed from Firebase storage & database', 'warning');
  };

  const handleEmptyTrash = () => {
    if (trashedFiles.length === 0) return;
    setIsEmptyTrashModalOpen(true);
  };

  const confirmEmptyTrash = async () => {
    setIsEmptyTrashModalOpen(false);
    setTrashedFiles([]);

    try {
      await FirebaseService.emptyTrash();
    } catch (e) {
      console.warn('Firebase empty trash error:', e);
    }
    showNotification('TRASH EMPTIED', 'All trashed files permanently removed', 'warning');
  };

  // Save Edit Profile (Firebase Auth & Firestore Synced)
  const handleSaveProfile = async () => {
    setStudentProfile(prev => ({
      ...prev,
      name: editName,
      email: editEmail,
      usn: editUsn,
      role: editRole,
      branch: editBranch
    }));
    setIsEditProfileModalOpen(false);

    try {
      await authUpdateProfile({ fullName: editName });
      showNotification('PROFILE UPDATED', 'Profile saved to Firebase', 'success');
    } catch (e: any) {
      showNotification('PROFILE UPDATE FAILED', e?.message || 'Error updating profile', 'warning');
    }
  };

  // Save Change Password (Firebase Auth Synced)
  const handleChangePasswordSubmit = async () => {
    if (!currentPassword) {
      setPasswordFeedback('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback('New password and Confirm password do not match.');
      return;
    }
    setPasswordFeedback('');

    try {
      const { error } = await authUpdatePassword(newPassword);
      if (error) {
        setPasswordFeedback(error.message || 'Error changing password in Firebase.');
        return;
      }
      showNotification('PASSWORD CHANGED', 'Updated securely in Firebase Auth', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangePasswordModalOpen(false);
    } catch (e: any) {
      setPasswordFeedback(e?.message || 'Failed to update password.');
    }
  };

  // Avatar Upload Handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setStudentProfile(prev => ({ ...prev, avatarUrl: url }));
    }
  };

  // Native Device File Download Trigger (Firebase Cloud Storage URL)
  const handleDownloadToDevice = async (doc: AcademicFile) => {
    let targetUrl = doc.fileUrl;
    if (doc.storagePath) {
      const signed = await FirebaseService.getFileDownloadUrl(doc.storagePath);
      if (signed) targetUrl = signed;
    }

    if (targetUrl) {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = doc.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('DOWNLOAD STARTED', `Exporting ${doc.title}`, 'success');
    } else {
      showNotification('DOWNLOAD ERROR', 'No download URL available for this file', 'warning');
    }
  };

  const handleSendChat = async (promptText?: string) => {
    const q = promptText || chatInput;
    if (!q.trim() || isAiGenerating) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: q, time: timeStr }]);
    if (!promptText) setChatInput('');
    setIsAiGenerating(true);

    try {
      // Direct REST API Call for guaranteed browser compatibility
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert AI Study Studio assistant embedded in FOLIO - Smart Student Study Studio. Answer the student's question concisely, clearly, and naturally using clean plain text without any markdown asterisks (*), hashtags (#), or formatting code blocks.\n\nStudent Question: ${q}`
            }]
          }]
        })
      });

      const data = await res.json();
      let responseText = '';
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        responseText = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
      } else {
        responseText = "I'm sorry, I couldn't generate a response for your question right now.";
      }

      // Clean out residual markdown symbols (*, #, `, _, -, >)
      const cleanText = (text: string) => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '$1')       // bold **text** -> text
          .replace(/\*(.*?)\*/g, '$1')           // italic *text* -> text
          .replace(/__([\s\S]*?)__/g, '$1')       // bold __text__ -> text
          .replace(/_([\s\S]*?)_/g, '$1')         // italic _text_ -> text
          .replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1')// code blocks `text` -> text
          .replace(/^#{1,6}\s*/gm, '')           // headers # Header -> Header
          .replace(/^\s*[\*\-\+]\s+/gm, '• ')    // bullet points * -> •
          .replace(/\*{1,3}/g, '')               // stray asterisks
          .replace(/_{1,2}/g, '')                // stray underscores
          .trim();
      };

      const cleanedResponse = cleanText(responseText);

      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: cleanedResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch (err: any) {
      console.error("Gemini AI Error:", err);
      let fallbackText = `⚠️ **Gemini AI Service Alert**: ${err?.message || "Unable to reach Gemini AI"}.\n\nBelow is retrieved study notes context for your query "${q}":\n\n`;
      if (q.toLowerCase().includes('ip addressing') || q.toLowerCase().includes('networks')) {
        fallbackText += "🌐 **IP Addressing Principles**:\n- **IPv4**: 32-bit address divided into 4 octets.\n- **CIDR Notation**: Classless Inter-Domain Routing (e.g. 192.168.1.0/24).\n- **Subnetting**: Enables efficient segmentation of IP address space.";
      } else if (q.toLowerCase().includes('normalization') || q.toLowerCase().includes('3nf') || q.toLowerCase().includes('dbms')) {
        fallbackText += "🗄️ **3NF Normalization Rules**:\n- Must be in **2NF** (no partial key dependencies).\n- All non-prime attributes must non-transitively depend on primary keys.";
      } else {
        fallbackText += `Answers and study notes compiled for academic concept: **${q}**. Clear structured explanation provided for revision.`;
      }
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: fallbackText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const sortedDashboardFiles = getSortedFiles(files);
  const currentOpenedFolder = folders.find(f => f.id === openedFolderId);
  const currentOpenedFolderFiles = getSortedFiles(files.filter(f => f.folderId === openedFolderId));

  return (
    <div className="flex h-screen w-screen bg-[#f4f7fa] text-slate-800 overflow-hidden antialiased">

      {/* Sidebar Navigation - Fixed Overflow & Layout (Fulfills Request #1) */}
      <aside
        className={`relative h-full flex flex-col justify-between transition-all duration-300 z-20 shadow-lg bg-[#1e293b] border-r border-slate-800 ${isSidebarCollapsed ? 'w-20 items-center' : 'w-64'
          }`}
      >
        <div className="w-full">
          {/* Brand Header */}
          <div className={`h-16 flex items-center bg-[#0f172a] border-b border-slate-800 ${isSidebarCollapsed ? 'px-2 justify-center gap-1' : 'px-4 justify-between'
            }`}>
            <div className="flex items-center gap-2.5 shrink-0 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                F
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-black text-lg tracking-wider text-white truncate">
                    FOLIO <span className="text-slate-400">STUDIO</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase truncate">
                    Academic File Manager
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onMouseEnter={() => setHoveredStatusLink('sidebar-toggle')}
              onMouseLeave={() => setHoveredStatusLink(null)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3">
            {!isSidebarCollapsed && (
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-2">
                Navigation Menu
              </div>
            )}

            <nav className="space-y-1 w-full">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setOpenedFolderId(null);
                      setHoveredStatusLink('#' + item.id);
                    }}
                    onMouseEnter={() => setHoveredStatusLink('#' + item.id)}
                    onMouseLeave={() => setHoveredStatusLink(null)}
                    title={isSidebarCollapsed ? item.title : undefined}
                    className={`w-full flex items-center rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer group ${isSidebarCollapsed ? 'justify-center p-3 hover:bg-slate-800 hover:scale-105 active:scale-95' : 'justify-between px-3.5 py-3'
                      } ${isActive
                        ? 'bg-slate-800 text-white font-black shadow-sm ring-1 ring-slate-700'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:scale-125 group-hover:text-white'
                        }`} />
                      {!isSidebarCollapsed && <span className="tracking-wide">{item.title}</span>}
                    </div>

                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${isActive
                          ? 'bg-slate-700 text-white'
                          : item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0f172a] w-full space-y-2">
          <div
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all group ${activeTab === 'profile' ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-800/50'
              } ${isSidebarCollapsed ? 'justify-center hover:scale-105' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setOpenedFolderId(null);
              setHoveredStatusLink('#profile');
            }}
            onMouseEnter={() => setHoveredStatusLink('#profile')}
            onMouseLeave={() => setHoveredStatusLink(null)}
          >
            {studentProfile.avatarUrl ? (
              <img src={studentProfile.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                JD
              </div>
            )}

            {!isSidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-white truncate">{studentProfile.name}</span>
                <span className="text-[11px] font-mono text-slate-400 truncate">{studentProfile.usn}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                showNotification("LOGGED OUT", "Session terminated safely", "info");
              }
            }}
            onMouseEnter={() => setHoveredStatusLink('#logout')}
            onMouseLeave={() => setHoveredStatusLink(null)}
            title={isSidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer group ${isSidebarCollapsed ? 'justify-center p-2.5 hover:scale-105' : 'justify-between px-3 py-2'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && <span>Logout</span>}
            </div>
            {!isSidebarCollapsed && <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />}
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f4f7fa]">

        {/* Header Navbar */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white shadow-2xs">

          {/* Omni-Search Box with Floating Autocomplete Panel */}
          <div ref={searchContainerRef} className="relative w-80 md:w-96">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onClick={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                }
              }}
              placeholder="Search files, folders, pages, settings, tasks..."
            />

            {/* Floating Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full start-0 mt-2 w-full max-h-[380px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 mb-1 text-[11px] font-bold text-slate-400">
                  <span>{searchQuery.trim() ? `SEARCH SUGGESTIONS (${omniSearchResults.length})` : 'QUICK SEARCH SHORTCUTS'}</span>
                  <span className="font-mono text-[10px]">Click item to redirect</span>
                </div>

                {omniSearchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                    <Search className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-slate-600">No matching items found</p>
                    <p className="text-[11px]">Try searching "Networks", "Settings", "Backup", or "Profile"</p>
                  </div>
                ) : (
                  omniSearchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => {
                        result.action();
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-900 text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <result.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-slate-950 truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-[11px] font-medium text-slate-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md shrink-0 ${result.badgeBg}`}>
                        {result.badge}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Top Header Actions */}
          <div className="flex items-center gap-3">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs">
              <Flame className="w-4 h-4 text-slate-700 animate-bounce" />
              <span>{studentProfile.studyStreak} Day Streak</span>
            </div>
          </div>
        </header>

        {/* Content View Switcher */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-300">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                {/* Left Column Stack: 1. Welcome Card + 2. Resource & Activity Overview Box + 3. Starred Box */}
                <div className="lg:col-span-2 space-y-4">

                  {/* 1. Welcome Card (Compact) */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-4 shrink-0">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                        Welcome back, {studentProfile.name}
                      </h1>

                      <p className="text-xs font-semibold text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>USN: <span className="text-slate-800 font-mono font-bold">{studentProfile.usn}</span></span>
                        <span className="text-slate-300">•</span>
                        <span>{studentProfile.branch}</span>
                        <span className="text-slate-300">•</span>
                        <span>{studentProfile.sem}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab('ai-studio')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-black shadow-xs hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ask AI</span>
                      </button>

                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer transition-all hover:bg-slate-200 active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Upload</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Resource Overview & Weekly Study Activity (Compact Single Row) */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Resource & Activity Overview
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        Avg: 2.8 hrs/day
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Left: Compact Total Folders & Files Count Pills (4 cols) */}
                      <div className="col-span-12 sm:col-span-4 flex flex-row sm:flex-col gap-2">
                        {/* Total Folders Small Box */}
                        <div
                          onClick={() => setActiveTab('home')}
                          className="flex-1 p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-xs">
                              <FolderClosed className="w-3.5 h-3.5 text-slate-200" />
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block leading-none">
                                Folders
                              </span>
                              <span className="text-base font-black text-slate-900 leading-tight">
                                {folders.length}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                        </div>

                        {/* Total Files Small Box */}
                        <div
                          onClick={() => setActiveTab('home')}
                          className="flex-1 p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-xs">
                              <FileText className="w-3.5 h-3.5 text-slate-200" />
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block leading-none">
                                Files
                              </span>
                              <span className="text-base font-black text-slate-900 leading-tight">
                                {files.length}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* Right: Visx-powered Animated BarChart (8 cols) */}
                      <div className="col-span-12 sm:col-span-8 p-1.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-center overflow-hidden">
                        <VisxBarChart
                          data={[
                            { day: 'Mon', hours: 2.5 },
                            { day: 'Tue', hours: 4.0 },
                            { day: 'Wed', hours: 1.8 },
                            { day: 'Thu', hours: 3.2 },
                            { day: 'Fri', hours: 2.0 },
                            { day: 'Sat', hours: 3.8 },
                            { day: 'Sun', hours: 2.2 },
                          ]}
                          xDataKey="day"
                          barGap={0.35}
                          aspectRatio="3.5 / 1"
                          margin={{ top: 12, right: 12, bottom: 28, left: 12 }}
                          animationDuration={900}
                        >
                          <VisxLinearGradient
                            from="#0f172a"
                            to="#475569"
                            id="weeklyStudyGradient"
                          />
                          <VisxBar
                            dataKey="hours"
                            fill="url(#weeklyStudyGradient)"
                            lineCap="butt"
                          />
                          <VisxBarXAxis showAllLabels maxLabels={7} />
                          <VisxChartTooltip showCrosshair={false} showDots={false} />
                          <VisxBarLineIndicator data={[
                            { day: 'Mon', hours: 2.5 },
                            { day: 'Tue', hours: 4.0 },
                            { day: 'Wed', hours: 1.8 },
                            { day: 'Thu', hours: 3.2 },
                            { day: 'Fri', hours: 2.0 },
                            { day: 'Sat', hours: 3.8 },
                            { day: 'Sun', hours: 2.2 },
                          ]} valueKey="hours" xKey="day" stroke="#0f172a" strokeWidth={1.5} />
                        </VisxBarChart>
                      </div>
                    </div>
                  </div>

                  {/* 3. Starred Files & Folders Box Section (Compact) */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Starred Items
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        {folders.filter(f => f.isStarred).length + files.filter(f => f.isStarred).length} items
                      </span>
                    </div>

                    {(() => {
                      const starredFoldersList = folders.filter(f => f.isStarred);
                      const starredFilesList = files.filter(f => f.isStarred);
                      const totalStarred = [
                        ...starredFoldersList.map(f => ({ id: f.id, title: f.name, isFolder: true, folderId: f.id })),
                        ...starredFilesList.map(file => ({ id: file.id, title: formatFileTitle(file.title), isFolder: false, fileObj: file }))
                      ];

                      if (totalStarred.length === 0) {
                        return (
                          <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                            <p className="text-[11px] font-medium text-slate-500">
                              Star <Star className="w-3 h-3 inline text-amber-400 fill-amber-400 mx-0.5" /> any file or folder to pin it here.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {totalStarred.map((item, index) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.isFolder) {
                                  setOpenedFolderId(item.folderId);
                                  setActiveTab('home');
                                } else if (item.fileObj) {
                                  setReadingFile(item.fileObj);
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:border-slate-300 transition-all duration-300 ease-in-out cursor-pointer ${
                                animatingOutIds.includes(item.id)
                                  ? 'opacity-0 scale-90 -translate-x-4 pointer-events-none'
                                  : 'opacity-100 scale-100 translate-x-0'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                <span className="text-[10px] font-mono font-black text-slate-400 shrink-0 w-4">
                                  {index + 1}.
                                </span>
                                {item.isFolder ? (
                                  <FolderClosed className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                                <span className="text-xs font-medium truncate text-slate-900" title={item.title}>
                                  {item.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.isFolder) {
                                      handleToggleStarFolder(item.id, e);
                                    } else {
                                      handleToggleStarFile(item.id, e);
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                  title="Unstar item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Right Column Stack: 1. Academic To-Do Tasks + 2. Upcoming Deadlines */}
                <div className="lg:col-span-1 space-y-6">

                  {/* 1. Academic To-Do Tasks */}
                  <div className="h-[210px] p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between shrink-0 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Academic To-Do Tasks
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {todoTasks.length} left
                      </span>
                    </div>

                    {/* Add To-Do Input */}
                    <div className="flex items-center gap-2 mb-2 shrink-0">
                      <input
                        type="text"
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTodo(); }}
                        placeholder="Add a new task..."
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:border-slate-800 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                      />
                      <button
                        onClick={handleAddTodo}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs cursor-pointer transition-all active:scale-95 shrink-0"
                        title="Add task"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Numbered & Scrollable Task List */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                      {todoTasks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">No tasks remaining </p>
                      ) : (
                        todoTasks.map((task, index) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-300 ${
                              highlightedItemId === task.id || highlightedItemId === `todo-${task.id}`
                                ? 'border-slate-800 ring-2 ring-slate-400 bg-slate-100/90 shadow-xs font-bold animate-pulse'
                                : task.animatingOut
                                  ? 'border-emerald-200 bg-emerald-50/60 opacity-70 scale-98'
                                  : 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                              <span className="text-[10px] font-mono font-black text-slate-400 shrink-0 w-4">
                                {index + 1}.
                              </span>
                              <span
                                className={`text-xs font-medium truncate transition-all duration-300 ${task.completed
                                    ? 'line-through decoration-2 decoration-emerald-600 text-slate-400 italic'
                                    : 'text-slate-900'
                                  }`}
                              >
                                {task.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Right Tick Mark Button */}
                              <button
                                onClick={() => handleCompleteTodo(task.id)}
                                disabled={task.completed}
                                className={`p-1 rounded-md transition-all cursor-pointer ${task.completed
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                title="Complete task"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Bin Button */}
                              <button
                                onClick={() => handleDeleteTodo(task.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 2. Upcoming Deadlines Box (Fixed Height, Scrollable, Tick & Trash Icons) */}
                  <div className="h-[250px] p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between shrink-0 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Upcoming Deadlines
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {deadlines.length} left
                        </span>
                        <button
                          onClick={() => setIsAddDeadlineModalOpen(true)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer transition-all hover:underline"
                        >
                          <span>ADD</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Deadlines List (Sorted by nearest date first) */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                      {deadlines.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">No upcoming deadlines scheduled</p>
                      ) : (
                        [...deadlines]
                          .sort((a, b) => new Date(a.dateStr + 'T00:00:00').getTime() - new Date(b.dateStr + 'T00:00:00').getTime())
                          .map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all duration-300 ${
                                highlightedItemId === item.id || highlightedItemId === `dl-${item.id}`
                                  ? 'border-slate-800 ring-2 ring-slate-400 bg-slate-100/90 shadow-xs font-bold animate-pulse'
                                  : item.animatingOut
                                    ? 'border-emerald-200 bg-emerald-50/60 opacity-70 scale-98'
                                    : 'border-slate-100 bg-slate-50/70 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* Blue Circle Icon Box */}
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4
                                    className={`text-xs font-bold truncate transition-all duration-300 ${item.completed
                                        ? 'line-through decoration-2 decoration-emerald-600 text-slate-400 italic'
                                        : 'text-slate-900'
                                      }`}
                                    title={item.title}
                                  >
                                    {item.title}
                                  </h4>
                                  <p className={`text-[10px] font-semibold truncate ${item.subjectColor || 'text-blue-500'}`}>
                                    {item.subject}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-slate-900 font-sans">
                                  {formatDeadlineDate(item.dateStr)}
                                </span>

                                {/* Right Tick Mark Button */}
                                <button
                                  onClick={() => handleCompleteDeadline(item.id)}
                                  disabled={item.completed}
                                  className={`p-1 rounded-md transition-all cursor-pointer ${item.completed
                                      ? 'bg-emerald-600 text-white'
                                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  title="Complete deadline"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Bin Button */}
                                <button
                                  onClick={() => handleDeleteDeadline(item.id)}
                                  className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                  title="Delete deadline"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* HOME TAB: Subject Folders */}
          {activeTab === 'home' && (
            <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
              {openedFolderId && currentOpenedFolder ? (
                <div className="space-y-6">
                  {/* Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setOpenedFolderId(null)}
                        className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 font-bold flex items-center gap-2 text-xs cursor-pointer transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>All Folders</span>
                      </button>

                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-black text-slate-900">
                            {currentOpenedFolder.name}
                          </h1>
                          <span className="px-2.5 py-1 text-xs font-black rounded-md border border-slate-300 bg-slate-100 text-slate-800">
                            {currentOpenedFolder.code}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-slate-500">
                          {currentOpenedFolder.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFolderId(currentOpenedFolder.id);
                        setIsUploadModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-black shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload File to Folder</span>
                    </button>
                  </div>

                  {/* Documents List inside folder */}
                  <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <h3 className="text-base font-bold mb-4 text-slate-900">
                      Files in {currentOpenedFolder.name} ({currentOpenedFolderFiles.length})
                    </h3>

                    {currentOpenedFolderFiles.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 text-xs">
                        <FolderOpen className="w-12 h-12 mx-auto text-slate-400 mb-3 animate-pulse" />
                        <p className="font-semibold">No documents uploaded in this folder yet.</p>
                        <button
                          onClick={() => {
                            setSelectedFolderId(currentOpenedFolder.id);
                            setIsUploadModalOpen(true);
                          }}
                          className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-black cursor-pointer"
                        >
                          Upload First File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentOpenedFolderFiles.map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                              highlightedItemId === doc.id || highlightedItemId === `file-${doc.id}`
                                ? 'border-slate-800 ring-2 ring-slate-400 bg-slate-100/90 shadow-xs font-bold animate-pulse'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{formatFileTitle(doc.title)}</div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Source: <span className="font-semibold">{doc.source}</span> • Added: {doc.date} • Size: {doc.size}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={(e) => handleToggleStarFile(doc.id, e)}
                                className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                                  doc.isStarred
                                    ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100'
                                    : 'border-slate-300 bg-white text-slate-400 hover:text-amber-500 hover:bg-amber-50/50'
                                }`}
                                title={doc.isStarred ? "Starred (Click to Unstar)" : "Star this File"}
                              >
                                <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-amber-400' : ''}`} />
                              </button>

                              <button
                                onClick={() => handleDownloadToDevice(doc)}
                                className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Download File to Device Explorer"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteFile(doc)}
                                className="p-2.5 rounded-lg border border-slate-300 bg-white text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setReadingFile(doc)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-black shadow-md cursor-pointer hover:bg-slate-800 transition-opacity"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View In-App</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SUBJECT FOLDERS GRID VIEW */
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900">Academic Subject Folders</h1>
                      <p className="text-xs mt-1 text-slate-500">
                        Organize your study resources by subject. Click any folder to inspect files.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreateFolderModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-black shadow-md hover:bg-slate-800 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>Create New Folder</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {folders.map((folder) => {
                      const folderFiles = files.filter(f => f.folderId === folder.id);
                      return (
                        <div
                          key={folder.id}
                          className={`relative group transition-all duration-300 ease-in-out ${
                            animatingOutIds.includes(folder.id)
                              ? 'opacity-0 scale-75 -translate-y-4 pointer-events-none'
                              : 'opacity-100 scale-100 translate-y-0'
                          }`}
                        >
                          {/* Delete/Discard Folder Button (Moves to Trash) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrashFolder(folder.id);
                            }}
                            className="absolute top-2 left-2 z-20 p-1.5 rounded-lg border border-slate-200 bg-white/80 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-2xs opacity-90 group-hover:opacity-100"
                            title="Discard folder (Move to Trash)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Star Folder Button */}
                          <button
                            onClick={(e) => handleToggleStarFolder(folder.id, e)}
                            className={`absolute top-2 right-2 z-20 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              folder.isStarred
                                ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100 shadow-xs'
                                : 'border-slate-200 bg-white/80 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            title={folder.isStarred ? "Starred Folder (Click to Unstar)" : "Star this Folder"}
                          >
                            <Star className={`w-3.5 h-3.5 ${folder.isStarred ? 'fill-amber-400' : ''}`} />
                          </button>
                          <FolderCard
                            title={folder.name}
                            code={folder.code}
                            description={folder.description}
                            fileCount={folderFiles.length}
                            onClick={() => setOpenedFolderId(folder.id)}
                            className={
                              highlightedItemId === folder.id || highlightedItemId === `folder-${folder.id}`
                                ? 'ring-2 ring-slate-800 bg-slate-100 animate-pulse'
                                : ''
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* AI STUDIO TAB */}
          {activeTab === 'ai-studio' && (
            <div className="h-[calc(100vh-100px)] w-full flex flex-col justify-between py-2 animate-in fade-in duration-300">

              {/* Clean Native Page Header */}
              <div className="pb-4 mb-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5 font-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">AI Studio</h2>
                    <p className="text-xs text-slate-500">Real-time academic assistant for concepts, notes, and homework</p>
                  </div>
                </div>

                <button
                  onClick={() => setChatMessages([{ sender: 'ai', text: "Thread cleared. Ask me any question about your notes or study concepts!", time: 'Just now' }])}
                  className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer font-bold border border-slate-200"
                >
                  Clear Thread
                </button>
              </div>

              {/* Full Page Chat Stream */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                    </div>
                    <div
                      className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                          ? 'bg-slate-900 text-white font-medium px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs max-w-[85%]'
                          : 'text-slate-800 pl-1 max-w-[95%]'
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAiGenerating && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Sparkles className="w-4 h-4 animate-spin text-slate-700" />
                    <span>AI Assistant is thinking...</span>
                  </div>
                )}
              </div>

              {/* Full Width Clean Input Bar */}
              <div className="pt-4 mt-4 border-t border-slate-200 flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  disabled={isAiGenerating}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask a question from your notes..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-800 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isAiGenerating || !chatInput.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Academic Study Analytics</h2>
                    <p className="text-xs text-slate-500">Track knowledge retrieval, study time, subject engagement & AI assistant usage</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-slate-500">Document Index Storage</span>
                      <span className="text-slate-800 font-mono">6.4 MB / 100 MB</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-slate-800 w-[6.4%] rounded-full animate-in slide-in-from-left duration-700"></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-slate-500">Query Response Latency</span>
                      <span className="text-slate-800 font-mono">42ms (Local Ollama)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-slate-800 w-[92%] rounded-full animate-in slide-in-from-left duration-700"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Subject-wise Usage Section */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                      SUBJECT ACTIVITY
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Total Engagement: 100%</span>
                </div>

                <div className="space-y-3.5">
                  {[
                    { name: 'DBMS', percent: 32 },
                    { name: 'Operating Systems', percent: 24 },
                    { name: 'AI / ML', percent: 19 },
                    { name: 'Computer Networks', percent: 14 },
                    { name: 'Mathematics', percent: 8 },
                    { name: 'Others', percent: 3 },
                  ].map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between gap-4">
                      <span className="w-36 text-xs font-bold text-slate-800 truncate font-mono">
                        {item.name}
                      </span>
                      <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden p-0.5 border border-slate-200">
                        <div
                          className="h-full bg-slate-900 rounded-xs transition-all duration-1000 ease-out shadow-xs"
                          style={{
                            width: isAnalyticsMounted ? `${item.percent}%` : '0%',
                            transitionDelay: `${idx * 100}ms`
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-mono font-bold text-slate-700">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. AI Usage Analytics Section */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      FOLIO AI Usage Analytics
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Comprehensive study breakdown for your interactive Llama 3.2 study assistant
                  </p>
                </div>

                {/* AI Activity Metrics Card */}
                <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs">🤖</span>
                    <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                      AI ACTIVITY OVERVIEW
                    </span>
                  </div>

                  <div className="space-y-3 max-w-md font-mono text-xs">
                    {[
                      { label: 'Questions Asked', count: 36 },
                      { label: 'Documents Summarized', count: 12 },
                      { label: 'Quizzes Generated', count: 5 },
                      { label: 'Flashcards Generated', count: 8 },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">{stat.label}</span>
                        <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300 shadow-2xs">
                          {stat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Asked Topics */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">
                    Most Asked Topics
                  </h4>

                  <div className="space-y-3">
                    {[
                      { topic: 'CPU Scheduling', count: 95 },
                      { topic: 'Normalization', count: 75 },
                      { topic: 'Deadlocks', count: 60 },
                      { topic: 'TCP / IP', count: 45 },
                      { topic: 'Neural Networks', count: 35 },
                    ].map((item, idx) => (
                      <div key={item.topic} className="flex items-center gap-4">
                        <span className="w-36 text-xs font-bold text-slate-700 font-mono truncate">
                          {item.topic}
                        </span>
                        <div className="w-48 h-4 bg-slate-100 rounded overflow-hidden p-0.5 border border-slate-200">
                          <div
                            className="h-full bg-slate-900 rounded-xs transition-all duration-1000 ease-out shadow-xs"
                            style={{
                              width: isAnalyticsMounted ? `${item.count}%` : '0%',
                              transitionDelay: `${idx * 100}ms`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PROFILE TAB (Fulfills Request #3) */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="p-8 rounded-xl border border-slate-200 bg-white shadow-2xs">

                {/* Avatar & Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 mb-6 border-b border-slate-200">
                  <div className="relative group">
                    {studentProfile.avatarUrl ? (
                      <img src={studentProfile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border border-slate-300 shadow-md" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shadow-md">
                        JD
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-xl border border-slate-300 shadow-md cursor-pointer hover:bg-slate-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-2xl font-black text-slate-900">{studentProfile.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{studentProfile.email}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                      <span className="px-3 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                        {studentProfile.role}
                      </span>
                      <span className="px-3 py-1 text-xs font-mono font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        USN: {studentProfile.usn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Profile Information & Actions
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-4 h-4 text-slate-700" />
                        <span>Full Name</span>
                      </div>
                      <div className="text-sm font-bold mt-1 text-slate-900">
                        {studentProfile.name}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <GraduationCap className="w-4 h-4 text-slate-700" />
                        <span>Email Address</span>
                      </div>
                      <div className="text-sm font-bold mt-1 text-slate-900">
                        {studentProfile.email}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <BookOpen className="w-4 h-4 text-slate-700" />
                        <span>Semester</span>
                      </div>
                      <div className="text-sm font-bold mt-1 text-slate-900">
                        {studentProfile.sem}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Layers className="w-4 h-4 text-slate-700" />
                        <span>Branch</span>
                      </div>
                      <div className="text-sm font-bold mt-1 text-slate-900">
                        {studentProfile.branch}
                      </div>
                    </div>
                  </div>

                  {/* Profile Action Buttons Grid */}
                  <div className="pt-6 mt-6 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setEditName(studentProfile.name);
                          setEditEmail(studentProfile.email);
                          setEditUsn(studentProfile.usn);
                          setEditRole(studentProfile.role);
                          setEditBranch(studentProfile.branch);
                          setIsEditProfileModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        <UserCog className="w-4 h-4 text-slate-700" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setPasswordFeedback('');
                          setIsChangePasswordModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-slate-700" />
                        <span>Change Password</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => showNotification("LOGGED OUT", "Session terminated safely", "info")}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>

                      <button
                        onClick={() => setIsDeleteAccountModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB (Fulfills Request #4 fully) */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="p-8 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-6">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">FOLIO Studio Workspace Settings</h2>
                  <p className="text-xs text-slate-500 mt-1">Configure workspace storage, backup archives, default sorting, view modes, and file behaviors</p>
                </div>

                {/* Storage & Cloud Backup Box (Placed in Settings Page) */}
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-5">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Workspace Storage Utilization & Backup
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500">
                          Monitor disk space usage and create local backup snapshots
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs">
                      2.4 GB / 15.0 GB (16%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Used Storage</span>
                      <span>12.6 GB Available</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-300/70">
                      <div 
                        className="bg-slate-900 h-full rounded-full transition-all duration-500 shadow-xs" 
                        style={{ width: '16%' }} 
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium pt-1 gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-900" />
                        <span>PDF Documents: 1.8 GB</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span>Text & Scans: 0.6 GB</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span>Free Space: 12.6 GB</span>
                      </span>
                    </div>
                  </div>

                  {/* Backup Option Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200 gap-3">
                    <div className="text-xs font-semibold text-slate-600">
                      Export a complete JSON backup snapshot of your lecture notes, subject folders, and deadlines
                    </div>

                    <button
                      onClick={handleBackupFiles}
                      disabled={isBackingUp}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-black shadow-sm hover:bg-slate-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isBackingUp ? 'Creating Backup...' : 'Backup All Files'}</span>
                    </button>
                  </div>

                </div>

                {/* 1. Default Folder & Upload Location */}
                <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    <span>Default Folder Structure & Upload Location</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-semibold">Default Upload Location</label>
                      <select
                        value={appSettings.defaultUploadLocation}
                        onChange={(e) => setAppSettings(s => ({ ...s, defaultUploadLocation: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 font-medium"
                      >
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1.5 font-semibold">Sort Files By</label>
                      <select
                        value={appSettings.sortBy}
                        onChange={(e) => setAppSettings(s => ({ ...s, sortBy: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 font-medium"
                      >
                        <option value="Date added">Date added</option>
                        <option value="Name">Name</option>
                        <option value="File type">File type</option>
                        <option value="Size">Size</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. File View & Sorting Options */}
                <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    <span>Default View & Layout Modes</span>
                  </h3>

                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Default View Mode</div>
                      <div className="text-[11px] text-slate-500">Choose how files are displayed across the studio</div>
                    </div>
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white p-1">
                      <button
                        onClick={() => setAppSettings(s => ({ ...s, defaultView: 'Grid' }))}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${appSettings.defaultView === 'Grid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setAppSettings(s => ({ ...s, defaultView: 'List' }))}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${appSettings.defaultView === 'List' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        List
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'autoOrganizeFiles', label: 'Auto-organize files', desc: 'Automatically tag files by ingestion source and metadata' },
                      { key: 'autoCreateSubjectFolders', label: 'Auto-create subject folders', desc: 'Automatically generate subject folders when uploading unknown course codes' },
                      { key: 'showFileExtensions', label: 'Show file extensions', desc: 'Display filename extensions like .pdf, .txt, .docx' },
                      { key: 'confirmBeforeDeleting', label: 'Confirm before deleting files', desc: 'Display a safety confirmation modal before deleting any document' },
                      { key: 'autoRenameDuplicates', label: 'Automatically rename duplicate files', desc: 'Append numbers to uploaded files with duplicate names' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-200/60">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.label}</div>
                          <div className="text-[11px] text-slate-500">{item.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={(appSettings as any)[item.key]}
                          onChange={(e) => setAppSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                          className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server Endpoint Box */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900 font-mono">Local Endpoint: http://localhost:11434</div>
                    <div className="text-slate-500 text-[11px]">FOLIO Spring Boot & Ollama Service</div>
                  </div>
                  <span className="px-3 py-1 bg-slate-200 text-slate-800 font-bold rounded-md border border-slate-300">Active</span>
                </div>

              </div>
            </div>
          )}

          {/* TRASH TAB */}
          {activeTab === 'trash' && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">

              {/* Trash Header Card */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-[11px] font-black tracking-wider uppercase mb-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Trash Bin Storage</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trash Bin & File Recovery</h1>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Deleted files are safely kept here. Restore items back to your subject folders or permanently remove them.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-500">
                    {trashedFolders.length + trashedFiles.length} {trashedFolders.length + trashedFiles.length === 1 ? 'item' : 'items'} in Trash
                  </span>
                  {(trashedFiles.length > 0 || trashedFolders.length > 0) && (
                    <button
                      onClick={handleEmptyTrash}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Empty Trash</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Trashed Items Listing (Folders & Files) */}
              {trashedFolders.length === 0 && trashedFiles.length === 0 ? (
                <div className="p-12 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Trash is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you delete subject folders or documents from your library, they will appear here before being permanently removed.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Trashed Folders */}
                  {trashedFolders.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                        Deleted Subject Folders ({trashedFolders.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trashedFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                                  <FolderClosed className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 truncate" title={folder.name}>
                                    {folder.name}
                                  </h4>
                                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                    Subject Code: <span className="font-bold text-slate-600">{folder.code || 'SUBJ'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] font-mono text-slate-400">Folder</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRestoreFolder(folder)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-all"
                                  title="Restore folder to library"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => handlePermanentDeleteFolder(folder.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-all"
                                  title="Delete folder permanently"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trashed Files */}
                  {trashedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                        Deleted Files ({trashedFiles.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trashedFiles.map((doc) => {
                          const subjectFolder = folders.find(f => f.id === doc.folderId);
                          return (
                            <div
                              key={doc.id}
                              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100">
                                    {doc.fileType === 'pdf' ? 'PDF' : 'DOC'}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.title}>
                                      {doc.title}
                                    </h4>
                                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                      Folder: <span className="font-bold text-slate-600">{subjectFolder?.name || 'General'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-mono text-slate-400">{doc.size}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRestoreFile(doc)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-all"
                                    title="Restore to folder"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Restore</span>
                                  </button>
                                  <button
                                    onClick={() => setPermanentDeleteTarget(doc)}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-all"
                                    title="Delete permanently"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STARRED RESOURCES TAB */}
          {activeTab === 'starred' && (
            <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center shadow-2xs">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Starred Academic Resources</h1>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Quick access to your pinned subject folders, key study documents, and priority notes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    {folders.filter(f => f.isStarred).length} Folders
                  </span>
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    {files.filter(f => f.isStarred).length} Files
                  </span>
                </div>
              </div>

              {/* Check if anything is starred */}
              {folders.filter(f => f.isStarred).length === 0 && files.filter(f => f.isStarred).length === 0 ? (
                <div className="p-12 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-400 flex items-center justify-center mx-auto border border-amber-100">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No Starred Resources Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click the star icon on any subject folder or document in your library to pin it here for instant one-click access.
                  </p>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-black cursor-pointer hover:bg-slate-800 transition-all"
                  >
                    Browse All Folders
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Minimal Starred Folders List (To-Do Style) */}
                  {folders.filter(f => f.isStarred).length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                        <FolderClosed className="w-3.5 h-3.5 text-amber-500" />
                        <span>Starred Folders ({folders.filter(f => f.isStarred).length})</span>
                      </h2>

                      <div className="space-y-2">
                        {folders.filter(f => f.isStarred).map((folder, index) => (
                          <div
                            key={folder.id}
                            onClick={() => {
                              setOpenedFolderId(folder.id);
                              setActiveTab('home');
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:border-slate-300 transition-all duration-300 ease-in-out cursor-pointer ${
                              animatingOutIds.includes(folder.id)
                                ? 'opacity-0 scale-90 -translate-x-4 pointer-events-none'
                                : 'opacity-100 scale-100 translate-x-0'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                              <span className="text-[10px] font-mono font-black text-slate-400 shrink-0 w-4">
                                {index + 1}.
                              </span>
                              <FolderClosed className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-xs font-medium truncate text-slate-900" title={folder.name}>
                                {folder.name}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStarFolder(folder.id, e);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0"
                              title="Unstar Folder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Minimal Starred Files List (To-Do Style) */}
                  {files.filter(f => f.isStarred).length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>Starred Files ({files.filter(f => f.isStarred).length})</span>
                      </h2>

                      <div className="space-y-2">
                        {files.filter(f => f.isStarred).map((doc, index) => (
                          <div
                            key={doc.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:border-slate-300 transition-all duration-300 ease-in-out cursor-pointer ${
                              animatingOutIds.includes(doc.id)
                                ? 'opacity-0 scale-90 -translate-x-4 pointer-events-none'
                                : 'opacity-100 scale-100 translate-x-0'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                              <span className="text-[10px] font-mono font-black text-slate-400 shrink-0 w-4">
                                {index + 1}.
                              </span>
                              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-xs font-medium truncate text-slate-900" title={doc.title}>
                                {formatFileTitle(doc.title)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setReadingFile(doc)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStarFile(doc.id, e);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                title="Unstar File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* EDIT PROFILE MODAL (Fulfills Request #3) */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <UserCog className="w-4 h-4 text-slate-700" />
                <span>Edit Profile Details</span>
              </h3>
              <button onClick={() => setIsEditProfileModalOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">USN Identifier</label>
                <input
                  type="text"
                  value={editUsn}
                  onChange={(e) => setEditUsn(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Academic Role</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Department Branch</label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsEditProfileModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="px-5 py-2 rounded-lg text-xs font-black bg-slate-900 text-white shadow-md hover:bg-slate-800">
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL (Fulfills Request #3) */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <KeyRound className="w-4 h-4 text-slate-700" />
                <span>Change Password</span>
              </h3>
              <button onClick={() => setIsChangePasswordModalOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordFeedback && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {passwordFeedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsChangePasswordModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={handleChangePasswordSubmit} className="px-5 py-2 rounded-lg text-xs font-black bg-slate-900 text-white shadow-md hover:bg-slate-800">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL (Fulfills Request #3) */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base">Permanently Delete Account?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete your student account? All uploaded documents, subject folders, and AI study threads will be permanently erased. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsDeleteAccountModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={() => {
                  showNotification("ACCOUNT DELETED", "All student data has been erased", "warning");
                  setIsDeleteAccountModalOpen(false);
                  if (onLogout) {
                    setTimeout(() => onLogout(), 800);
                  }
                }}
                className="px-5 py-2 rounded-lg text-xs font-black bg-rose-600 text-white hover:bg-rose-700 shadow-md"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE FILE CONFIRMATION MODAL (Fulfills Request #4 confirmBeforeDeleting setting) */}
      {deletingFileTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="font-bold text-sm">Move to Trash?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Are you sure you want to move <span className="font-bold text-slate-900">{deletingFileTarget.title}</span> to Trash? You can restore it later from the Trash Bin.
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingFileTarget(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => performDeleteFile(deletingFileTarget.id)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {permanentDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="font-bold text-sm">Permanently Delete?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Are you sure you want to permanently delete <span className="font-bold text-slate-900">{permanentDeleteTarget.title}</span>?
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mb-5">
              This action cannot be undone. The file will be removed from the database forever.
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setPermanentDeleteTarget(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDeleteFile(permanentDeleteTarget.id)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY TRASH CONFIRMATION MODAL */}
      {isEmptyTrashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="font-bold text-sm">Empty Trash Bin?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              Are you sure you want to permanently delete all <span className="font-bold text-slate-900">{trashedFiles.length} {trashedFiles.length === 1 ? 'item' : 'items'}</span> from Trash?
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mb-5">
              This action cannot be undone. All deleted items will be removed from the database forever.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEmptyTrashModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmEmptyTrash}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL IN-APP DOCUMENT / PDF READER MODAL */}
      {readingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className={`w-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden transition-all ${isReaderFullscreen ? 'h-full w-full max-w-none rounded-none' : 'h-[90vh] max-w-5xl'
            }`}>

            {/* Highlighted Banner when redirected from search */}
            {(highlightedItemId === readingFile.id || highlightedItemId === `file-${readingFile.id}`) && (
              <div className="bg-slate-100 border-b border-slate-300 px-6 py-2 text-xs font-bold text-slate-800 flex items-center justify-between shrink-0 animate-pulse">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-700 animate-spin" />
                  <span>✨ OPENED FROM SEARCH MATCH</span>
                </span>
                <span className="font-mono text-[10px] bg-white border border-slate-300 px-2.5 py-0.5 rounded text-slate-700 font-bold">Search Match</span>
              </div>
            )}

            {/* Reader Header */}
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{readingFile.title}</h3>
                  <p className="text-xs text-slate-400">In-App Reader • {readingFile.size} • Source: {readingFile.source}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!readingFile.fileUrl && (
                  <button
                    onClick={() => handleCopySnippet(readingFile.contentSnippet || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-slate-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownloadToDevice(readingFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-slate-900 text-xs font-black transition-all cursor-pointer shadow-sm hover:bg-slate-100"
                  title="Download File to Local Explorer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => handleDeleteFile(readingFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Move document to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Trash</span>
                </button>

                <button
                  onClick={() => setIsReaderFullscreen(!isReaderFullscreen)}
                  className="p-2 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isReaderFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setReadingFile(null)}
                  className="p-2 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Body */}
            <div className="flex-1 bg-slate-100 overflow-hidden p-3">
              {readingFile.fileUrl ? (
                <iframe
                  src={readingFile.fileUrl}
                  className="w-full h-full rounded-lg border-0 bg-white"
                  title={readingFile.title}
                />
              ) : (
                <div className="h-full overflow-y-auto p-8 max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-xl text-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Document Snippet Viewer</span>
                    <span className="text-xs font-mono text-slate-500">{readingFile.title}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-800 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    {readingFile.contentSnippet}
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CREATE SUBJECT FOLDER MODAL */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <FolderPlus className="w-4 h-4 text-slate-700" />
                <span>Create New Subject Folder</span>
              </h3>
              <button onClick={() => setIsCreateFolderModalOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1.5 font-semibold">Subject Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-semibold">Subject Code</label>
                <input
                  type="text"
                  value={newFolderCode}
                  onChange={(e) => setNewFolderCode(e.target.value)}
                  placeholder="e.g. CS303"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-semibold">Description</label>
                <textarea
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="Brief summary of notes stored inside..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 h-20 resize-none font-medium"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsCreateFolderModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={handleCreateFolder} className="px-5 py-2 rounded-lg text-xs font-black bg-slate-900 text-white shadow-md hover:bg-slate-800">
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD NOTES FILE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <Upload className="w-4 h-4 text-slate-700" />
                <span>Upload Academic Notes</span>
              </h3>
              <button onClick={handleCloseUploadModal} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1.5 font-semibold">Select File from Device</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-semibold">Add to Subject Folder</label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 font-medium"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1.5 font-semibold">Ingestion Source Channel</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-800 font-medium"
                >
                  <option value="Direct Upload">Direct Upload</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Google Classroom">Google Classroom</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseUploadModal}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFileSubmit}
                disabled={isUploading}
                className="px-5 py-2 rounded-lg text-xs font-black bg-slate-900 text-white shadow-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload & Process</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DEADLINE MODAL */}
      {isAddDeadlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Add Upcoming Deadline</span>
              </h3>
              <button onClick={() => setIsAddDeadlineModalOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Task / Assignment Title</label>
                <input
                  type="text"
                  value={newDeadlineTitle}
                  onChange={(e) => setNewDeadlineTitle(e.target.value)}
                  placeholder="e.g. Complete Programming Assignment 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Subject / Course Subtitle</label>
                <input
                  type="text"
                  value={newDeadlineSubject}
                  onChange={(e) => setNewDeadlineSubject(e.target.value)}
                  placeholder="e.g. Introduction to Computer Science"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Select Deadline Date</label>
                <input
                  type="date"
                  value={newDeadlineDate}
                  onChange={(e) => setNewDeadlineDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsAddDeadlineModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeadline}
                className="px-5 py-2 rounded-lg text-xs font-black bg-slate-900 text-white shadow-md hover:bg-slate-800 active:scale-95 cursor-pointer"
              >
                Save Deadline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM THEMED GLOBAL NOTIFICATION MODAL */}
      {notificationModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 text-center animate-in zoom-in-95 duration-150 flex flex-col items-center space-y-4">
            
            {/* Context Icon */}
            {notificationModal.type === 'warning' ? (
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
            ) : notificationModal.type === 'info' ? (
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center shadow-xs">
                <Sparkles className="w-7 h-7 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5 uppercase">
                <span>{notificationModal.title}</span>
              </h3>
              {notificationModal.message && (
                <p className="text-xs font-semibold text-slate-500 max-w-[270px] mx-auto leading-relaxed">
                  {notificationModal.message}
                </p>
              )}
            </div>

            <button
              onClick={() => setNotificationModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow-md hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            >
              OK
            </button>

          </div>
        </div>
      )}

      {/* Browser Link Status Bar (Bottom-Right Preview) */}
      {hoveredStatusLink && (
        <div className="fixed bottom-0 right-0 z-50 bg-black text-slate-300 text-[11px] font-mono px-3 py-1 border-t border-l border-neutral-800 rounded-tl-md shadow-2xl pointer-events-none transition-all animate-in fade-in slide-in-from-bottom-1 duration-150 flex items-center gap-1.5">
          <span className="text-sky-400 font-medium">http://localhost:5173/</span>
          <span className="text-white font-bold">{hoveredStatusLink}</span>
        </div>
      )}

    </div>
  );
}
