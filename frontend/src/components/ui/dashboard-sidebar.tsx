import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SearchInput } from './search-input';
import FolderCard from './folder';
import { FolioLogo, FolioMark } from './logo';
import WeakSpotAnalysis, { SubjectEngagement } from './weak-spot-analysis';
import * as FirebaseService from '../../lib/firebaseService';
import * as Rag from '../../lib/ragIndex';
import * as ShareKit from '../../lib/share';
import { TabId, absoluteUrl, navigateTo, onLocationChange, parseLocation } from '../../lib/routes';
import { StreakState, getStreakState, recordStudyActivity } from '../../lib/streak';
import { classifyDocument } from '../../lib/autoTag';
import { AVATAR_PRESETS, resolveAvatarSrc } from '../../lib/avatars';
import { MagneticCursor } from './magnetic-cursor';
import { ChatMarkdown } from './chat-markdown';
import AnimatedGradientBackground from './animated-gradient-background';
import { GlassCard } from './glass-card';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
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
  Star,
  ScrollText,
  ShieldCheck,
  Archive,
  Share2,
  Mic,
  Globe,
  Paperclip,
  Tag,
  Wand2,
  Menu,
  Link2,
  Mail,
  MessageCircle,
  CheckSquare,
  Square,
  ExternalLink
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
  isArchived?: boolean;
  /** File ids trashed alongside the folder, so a restore can bring them back. */
  trashedFileIds?: string[];
  lastActivityTs?: number;
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
  tags?: string[];
  autoTagged?: boolean;
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

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  time: string;
  /** Filenames the student attached to this question. */
  attachments?: string[];
  /** Notes the assistant grounded its answer in. */
  sources?: string[];
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
    avatarPreset?: string;
  };
  onLogout?: () => void;
}

/** Greetings and small talk should get a human reply, not a study briefing. */
const SMALL_TALK = /^\s*(hi|hey+|hello|yo|hiya|sup|howdy|good\s+(morning|afternoon|evening|night)|how(\s+are|'?s)\s+(you|it going)|what'?s\s+up|thanks?|thank\s+you|ty|ok(ay)?|cool|nice|bye|goodbye|see\s+ya)\b[\s!.?]*$/i;

/** Turn a raw AI service error into something a student can act on. */
const describeAiError = (message: string): string => {
  const m = (message || '').toLowerCase();

  if (m.includes('unregistered callers') || m.includes('api key') || m.includes('api_key_invalid') || m.includes('permission_denied')) {
    return 'The Gemini API key is missing or invalid, so I answered from your indexed notes instead. Add `VITE_GEMINI_API_KEY` to your `.env` file and restart the dev server to turn on full AI answers.';
  }
  if (m.includes('quota') || m.includes('rate limit') || m.includes('resource_exhausted')) {
    return 'The Gemini API quota is used up for now, so I answered from your indexed notes instead.';
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return 'I could not reach the Gemini service, so I answered from your indexed notes instead.';
  }
  return `The AI service returned an error, so I answered from your indexed notes instead. Details: ${message}`;
};

/**
 * Compose a genuinely useful answer without the AI service: friendly for small
 * talk, grounded in the retrieved passages when the notes cover the question,
 * and otherwise a clear next step.
 */
const buildOfflineAnswer = (question: string, matches: Rag.RagMatch[]): string => {
  const q = question.trim();

  if (SMALL_TALK.test(q)) {
    return [
      'Hey! I am your FOLIO study assistant.',
      '',
      'Ask me anything about the notes you have uploaded and I will answer from them. You can also:',
      '- Attach a document with the paperclip or folder icon',
      '- Send the question to Google with the Search button',
      '- Tap the mic and just say it out loud'
    ].join('\n');
  }

  if (matches.length) {
    const lines = ['Here is what your indexed notes say about this.', ''];
    matches.slice(0, 3).forEach(match => {
      const passage = match.chunk.text.trim();
      lines.push(`## ${match.chunk.fileTitle}`);
      lines.push(passage.length > 420 ? `${passage.slice(0, 420).trim()}...` : passage);
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  return [
    `I could not find anything about **${q}** in your indexed notes yet.`,
    '',
    'Here is how to get an answer:',
    '- Upload the relevant PDF or notes into a subject folder, then ask again',
    '- Attach a file to this question with the paperclip or folder icon',
    '- Use the Search button to look it up on the web'
  ].join('\n');
};

/** Tidy whitespace without stripping the structure we asked the model for. */
const normalizeAnswer = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export default function DesktopWebApp({ currentUser, onLogout }: DesktopWebAppProps = {}) {
  const { user: authUser, updateProfile: authUpdateProfile, updatePassword: authUpdatePassword } = useAuth();

  // Deep-linkable workspace location: /dashboard, /subject-folders/<id>, /settings#storage ...
  const initialLocation = useRef(parseLocation()).current;
  const [activeTab, setActiveTab] = useState<string>(initialLocation.tab);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Trash Bin & Browser Status Link State
  const [trashedFiles, setTrashedFiles] = useState<AcademicFile[]>([]);
  const [trashedFolders, setTrashedFolders] = useState<SubjectFolder[]>([]);

  // Folder multi-select & bulk actions
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [deletingFolderTarget, setDeletingFolderTarget] = useState<SubjectFolder | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [permanentFolderTarget, setPermanentFolderTarget] = useState<SubjectFolder | null>(null);

  // Folder sharing
  const [shareFolderTarget, setShareFolderTarget] = useState<SubjectFolder | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Storage threshold alert
  const [dismissedStorageAlert, setDismissedStorageAlert] = useState(false);
  const [previewStorageAlert, setPreviewStorageAlert] = useState(false);
  const storageSectionRef = useRef<HTMLDivElement>(null);

  // The scrolling content column, so page changes can glide back to the top.
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // RAG index revision counter — bumped whenever embeddings are added or purged
  // so every dependent view (storage, analytics, weak spots) recomputes.
  const [ragRevision, setRagRevision] = useState(0);
  const bumpRagRevision = () => setRagRevision(v => v + 1);

  // Study streak (measured, not hard-coded)
  const [streak, setStreak] = useState<StreakState>(() => getStreakState());
  const [isStreakPanelOpen, setIsStreakPanelOpen] = useState(false);
  const streakPanelRef = useRef<HTMLDivElement>(null);

  // AI Studio composer: attachments, source picker and chat sharing
  const [chatAttachments, setChatAttachments] = useState<{
    id: string;
    name: string;
    size: string;
    text: string;
    origin: 'device' | 'folio';
  }[]>([]);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isShareChatOpen, setIsShareChatOpen] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

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
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(initialLocation.folderId);
  const [readingFile, setReadingFile] = useState<AcademicFile | null>(null);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // ==========================================================================
  // URL <-> WORKSPACE SYNCHRONISATION
  // Every tab is a real address so links like /settings#storage and
  // /subject-folders/<id> can be shared, bookmarked and navigated with
  // browser back/forward.
  // ==========================================================================
  const [pendingSection, setPendingSection] = useState<{ tab: string; section: string } | null>(
    initialLocation.section ? { tab: initialLocation.tab, section: initialLocation.section } : null
  );

  const activeSection =
    pendingSection && pendingSection.tab === activeTab ? pendingSection.section : null;

  /** Single entry point for navigation: updates the view and the address bar. */
  const goToTab = useCallback(
    (tab: TabId, options: { folderId?: string | null; section?: string | null } = {}) => {
      setActiveTab(tab);
      setOpenedFolderId(options.folderId ?? null);
      setPendingSection(options.section ? { tab, section: options.section } : null);
      setIsMobileNavOpen(false);
    },
    []
  );

  const firstNavRef = useRef(true);
  useEffect(() => {
    navigateTo(activeTab as TabId, {
      folderId: openedFolderId,
      section: activeSection,
      replace: firstNavRef.current
    });
    firstNavRef.current = false;
  }, [activeTab, openedFolderId, activeSection]);

  // Browser back / forward
  useEffect(() => {
    return onLocationChange(loc => {
      setActiveTab(loc.tab);
      setOpenedFolderId(loc.folderId);
      setPendingSection(loc.section ? { tab: loc.tab, section: loc.section } : null);
    });
  }, []);

  // Scroll to the linked section (e.g. the storage panel in Settings)
  useEffect(() => {
    if (!activeSection) return;
    const timer = setTimeout(() => {
      document.getElementById(activeSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 160);
    return () => clearTimeout(timer);
  }, [activeSection, activeTab]);

  // ==========================================================================
  // STUDY STREAK — measured from real daily activity
  // ==========================================================================
  useEffect(() => {
    const seeded = recordStudyActivity(currentUser?.studyStreak ?? 12);
    setStreak(seeded);

    // Keep the account record in step with the measured streak.
    if (currentUser && seeded.current !== currentUser.studyStreak) {
      authUpdateProfile({ studyStreak: seeded.current }).catch(() => { });
    }
    // Runs once per session — the streak is a per-day measurement.
  }, []);

  /** Log a study action (upload, AI question, task completed) into the streak. */
  const registerStudyActivity = useCallback(() => {
    setStreak(recordStudyActivity());
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (streakPanelRef.current && !streakPanelRef.current.contains(e.target as Node)) {
        setIsStreakPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

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

  // ==========================================================================
  // CLOUD SYNC
  // Guards below stop React StrictMode double-invocation (and rapid tab
  // switches) from seeding starter folders twice or interleaving two fetches —
  // the cause of duplicated subject cards.
  // ==========================================================================
  const seedingRef = useRef(false);
  const fetchInFlightRef = useRef(false);

  const mapDbFolder = (f: FirebaseService.DbFolder, idx: number): SubjectFolder => {
    const colors = ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a'];
    return {
      id: f.id,
      name: f.name,
      code: f.subject_name || f.description?.substring(0, 8) || 'SUBJ',
      description: f.description || 'Academic subject resource folder',
      fileCount: 0,
      colorHex: colors[idx % colors.length],
      isStarred: Boolean(f.is_starred),
      isArchived: Boolean(f.archived),
      lastActivityTs: f.updated_at ? new Date(f.updated_at).getTime() : undefined
    };
  };

  const fetchBackendDocuments = async () => {
    // Without a cloud session there is nothing to merge — keep local state.
    if (!authUser) return;
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;

    try {
      // 1. Fetch Firebase Folders (active + trashed in one pass)
      let dbFolders = await FirebaseService.fetchFolders(true);

      // Seed starter folders exactly once for a brand-new workspace.
      if ((!dbFolders || dbFolders.length === 0) && !seedingRef.current) {
        seedingRef.current = true;
        const starterSubjects = [
          { name: 'Database Management Systems', code: 'CS-DBMS', desc: 'Relational Schema, SQL & Normalization' },
          { name: 'Operating Systems', code: 'CS-OS', desc: 'CPU Scheduling, Virtual Memory & Concurrency' },
          { name: 'Computer Networks', code: 'CS-NET', desc: 'TCP/IP, Routing Protocols & Sockets' },
          { name: 'Mathematics & Algorithms', code: 'CS-MATH', desc: 'Linear Algebra, Probability & Graph Theory' },
        ];
        for (const subject of starterSubjects) {
          try {
            await FirebaseService.createFolder(subject.name, subject.desc, subject.code);
          } catch (e) { }
        }
        dbFolders = await FirebaseService.fetchFolders(true);
      }

      if (dbFolders && dbFolders.length > 0) {
        // De-duplicate defensively: one card per document id, and collapse any
        // identical name + code pairs left behind by an earlier double-seed.
        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();
        const uniqueFolders = dbFolders.filter(f => {
          const key = `${(f.name || '').toLowerCase()}::${(f.subject_name || '').toLowerCase()}`;
          if (seenIds.has(f.id) || seenKeys.has(key)) return false;
          seenIds.add(f.id);
          seenKeys.add(key);
          return true;
        });

        setFolders(prev => {
          // Preserve any star toggled locally but not yet round-tripped.
          const localStars = new Map(prev.map(f => [f.id, f.isStarred]));
          return uniqueFolders
            .filter(f => !f.trashed)
            .map((f, idx) => {
              const mapped = mapDbFolder(f, idx);
              return { ...mapped, isStarred: mapped.isStarred || Boolean(localStars.get(f.id)) };
            });
        });

        setTrashedFolders(uniqueFolders.filter(f => f.trashed).map(mapDbFolder));
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
            isStarred: doc.is_starred || false,
            tags: doc.tags || [],
            autoTagged: Boolean(doc.auto_tagged)
          } as AcademicFile;
        }));

        // Unique by id so a card can never render twice.
        const uniqueActive = Array.from(new Map(mappedActive.map(f => [f.id, f])).values());

        setFiles(uniqueActive);
        setFolders(prev => prev.map(f => ({
          ...f,
          fileCount: uniqueActive.filter(file => file.folderId === f.id).length
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
            isStarred: doc.is_starred || false,
            tags: doc.tags || []
          } as AcademicFile;
        });
        setTrashedFiles(Array.from(new Map(mappedTrashed.map(f => [f.id, f])).values()));
      }
    } catch (e) {
      console.warn('Firebase document fetch note:', e);
    } finally {
      fetchInFlightRef.current = false;
    }
  };

  // Sync once per session / auth change rather than on every tab switch, so
  // locally toggled state (stars, selections) is never clobbered mid-session.
  useEffect(() => {
    fetchBackendDocuments();
  }, [authUser?.uid]);

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
        avatarUrl: '',
        avatarPreset: ''
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
    autoTagging: true,
  });

  // Dynamic Folders State
  const [folders, setFolders] = useState<SubjectFolder[]>([
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
  ]);

  // Dynamic Files State
  const [files, setFiles] = useState<AcademicFile[]>([
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
    },
    {
      id: 'doc-3',
      title: 'Machine_Learning_Lab_Manual.pdf',
      folderId: 'f-ml',
      source: 'Direct Upload',
      size: '3.4 MB',
      sizeBytes: 3565158,
      date: '3 days ago',
      fileType: 'text',
      contentSnippet: `LAB PROGRAM 1: DECISION TREE CLASSIFIER

Objectives:
1. Load Iris Dataset using scikit-learn.
2. Train DecisionTreeClassifier with entropy criterion.
3. Visualize decision boundaries and tree nodes.

Python Implementation Snippet:
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target, test_size=0.2)
clf = DecisionTreeClassifier(criterion='entropy')
clf.fit(X_train, y_train)
print("Model Accuracy:", clf.score(X_test, y_test))`
    }
  ]);

  // ==========================================================================
  // RAG INDEX SYNC
  // Every active document is embedded into the local retrieval index. The
  // signature check keeps this cheap: it only re-embeds when a document is
  // added, re-filed, or its extracted text changes.
  // ==========================================================================
  const ragSyncRef = useRef('');
  useEffect(() => {
    const signature = files
      .map(f => `${f.id}:${f.folderId}:${(f.contentSnippet || '').length}`)
      .join('|');
    if (signature === ragSyncRef.current) return;
    ragSyncRef.current = signature;

    files.forEach(f => Rag.indexDocument(f.id, f.folderId, f.title, f.contentSnippet || ''));
    bumpRagRevision();
  }, [files]);

  // ==========================================================================
  // STAR SYNCHRONISATION
  // A star is global state: it persists to Firestore and immediately drives the
  // Dashboard "Starred Items" widget while the item stays in /subject-folders.
  // ==========================================================================
  const handleToggleStarFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = folders.find(f => f.id === folderId);
    if (!target) return;

    const nextStarred = !target.isStarred;
    setFolders(prev => prev.map(f => (f.id === folderId ? { ...f, isStarred: nextStarred } : f)));

    FirebaseService.toggleFolderStarred(folderId, Boolean(target.isStarred)).catch(err => {
      console.warn('Folder star sync failed, reverting:', err);
      setFolders(prev => prev.map(f => (f.id === folderId ? { ...f, isStarred: !nextStarred } : f)));
    });

    registerStudyActivity();
  };

  const handleToggleStarFile = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = files.find(f => f.id === fileId);
    if (!target) return;

    const nextStarred = !target.isStarred;
    setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, isStarred: nextStarred } : f)));

    FirebaseService.toggleFileStarred(fileId, Boolean(target.isStarred)).catch(err => {
      console.warn('File star sync failed, reverting:', err);
      setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, isStarred: !nextStarred } : f)));
    });

    registerStudyActivity();
  };

  // ==========================================================================
  // FOLDER MULTI-SELECT
  // ==========================================================================
  const [showArchivedFolders, setShowArchivedFolders] = useState(false);

  const visibleFolders = folders.filter(f => (showArchivedFolders ? true : !f.isArchived));
  const archivedCount = folders.filter(f => f.isArchived).length;
  const selectedFolders = folders.filter(f => selectedFolderIds.includes(f.id));

  const toggleFolderSelection = (folderId: string, selected: boolean) => {
    setSelectedFolderIds(prev =>
      selected ? [...new Set([...prev, folderId])] : prev.filter(id => id !== folderId)
    );
  };

  const clearFolderSelection = () => setSelectedFolderIds([]);

  const toggleSelectAllFolders = () => {
    const visibleIds = visibleFolders.map(f => f.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedFolderIds.includes(id));
    setSelectedFolderIds(allSelected ? [] : visibleIds);
  };

  // ==========================================================================
  // FOLDER SOFT DELETE
  // Folders and the documents inside them move to Trash together, the sidebar
  // counter and dashboard metrics follow automatically from state, and the
  // matching RAG embeddings are purged from the document index.
  // ==========================================================================
  const performSoftDeleteFolders = async (targets: SubjectFolder[]) => {
    if (!targets.length) return;

    const ids = targets.map(f => f.id);
    const affectedFiles = files.filter(f => ids.includes(f.folderId));

    // 1. Documents inside the folders move to Trash
    setFiles(prev => prev.filter(f => !ids.includes(f.folderId)));
    setTrashedFiles(prev => [
      ...affectedFiles,
      ...prev.filter(t => !affectedFiles.some(a => a.id === t.id))
    ]);

    // 2. The folders themselves move to Trash, remembering their documents
    const trashedRecords = targets.map(t => ({
      ...t,
      trashedFileIds: affectedFiles.filter(f => f.folderId === t.id).map(f => f.id)
    }));
    setFolders(prev => prev.filter(f => !ids.includes(f.id)));
    setTrashedFolders(prev => [...trashedRecords, ...prev.filter(t => !ids.includes(t.id))]);

    setSelectedFolderIds(prev => prev.filter(id => !ids.includes(id)));
    if (openedFolderId && ids.includes(openedFolderId)) setOpenedFolderId(null);

    // 3. Clean up the RAG document index
    let purgedChunks = 0;
    ids.forEach(id => { purgedChunks += Rag.removeFolder(id); });
    affectedFiles.forEach(f => { purgedChunks += Rag.removeDocument(f.id); });
    ragSyncRef.current = '';
    bumpRagRevision();

    // 4. Persist the soft delete
    await Promise.all(
      ids.map(id => FirebaseService.trashFolder(id).catch(err => {
        console.warn('Folder soft-delete sync note:', err);
        return [];
      }))
    );

    setDeletingFolderTarget(null);
    setBulkDeleteConfirm(false);

    const label = targets.length === 1 ? `"${targets[0].name}"` : `${targets.length} folders`;
    showNotification(
      'MOVED TO TRASH',
      `${label} • ${affectedFiles.length} file${affectedFiles.length === 1 ? '' : 's'} archived • ${purgedChunks} RAG embedding${purgedChunks === 1 ? '' : 's'} cleared`,
      'info'
    );
  };

  const handleRestoreFolder = async (folder: SubjectFolder) => {
    const rememberedIds = folder.trashedFileIds || [];
    const restoredFiles = trashedFiles.filter(
      f => rememberedIds.includes(f.id) || f.folderId === folder.id
    );

    setTrashedFolders(prev => prev.filter(f => f.id !== folder.id));
    setFolders(prev => [
      ...prev.filter(f => f.id !== folder.id),
      { ...folder, trashedFileIds: undefined, fileCount: restoredFiles.length }
    ]);
    setTrashedFiles(prev => prev.filter(f => !restoredFiles.some(r => r.id === f.id)));
    setFiles(prev => [
      ...restoredFiles,
      ...prev.filter(p => !restoredFiles.some(r => r.id === p.id))
    ]);

    try {
      await FirebaseService.restoreFolder(folder.id, restoredFiles.map(f => f.id));
    } catch (e) {
      console.warn('Folder restore sync note:', e);
    }

    showNotification(
      'FOLDER RESTORED',
      `${folder.name} • ${restoredFiles.length} file${restoredFiles.length === 1 ? '' : 's'} returned and re-indexed`,
      'success'
    );
  };

  const handlePermanentDeleteFolder = async (folder: SubjectFolder) => {
    const rememberedIds = folder.trashedFileIds || [];
    setTrashedFolders(prev => prev.filter(f => f.id !== folder.id));
    setTrashedFiles(prev =>
      prev.filter(f => !(rememberedIds.includes(f.id) || f.folderId === folder.id))
    );
    setPermanentFolderTarget(null);

    Rag.removeFolder(folder.id);
    rememberedIds.forEach(id => Rag.removeDocument(id));
    bumpRagRevision();

    try {
      await FirebaseService.deleteFolder(folder.id);
    } catch (e) {
      console.warn('Folder permanent delete note:', e);
    }

    showNotification('FOLDER DELETED FOREVER', `${folder.name} and its documents were removed`, 'warning');
  };

  // ==========================================================================
  // BULK ACTIONS
  // ==========================================================================
  const handleBulkArchive = async () => {
    if (!selectedFolders.length) return;

    // Archive if anything selected is still active, otherwise un-archive.
    const shouldArchive = selectedFolders.some(f => !f.isArchived);
    const ids = selectedFolders.map(f => f.id);

    setFolders(prev => prev.map(f => (ids.includes(f.id) ? { ...f, isArchived: shouldArchive } : f)));
    clearFolderSelection();

    await Promise.all(
      ids.map(id => FirebaseService.setFolderArchived(id, shouldArchive).catch(err => {
        console.warn('Folder archive sync note:', err);
        return shouldArchive;
      }))
    );

    showNotification(
      shouldArchive ? 'FOLDERS ARCHIVED' : 'FOLDERS RESTORED',
      `${ids.length} folder${ids.length === 1 ? '' : 's'} ${shouldArchive ? 'archived' : 'returned to your active subjects'}`,
      'success'
    );
  };

  const handleBulkExport = () => {
    if (!selectedFolders.length) return;

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      exportedBy: studentProfile.name,
      folderCount: selectedFolders.length,
      folders: selectedFolders.map(folder => {
        const folderFiles = files.filter(f => f.folderId === folder.id);
        return {
          name: folder.name,
          code: folder.code,
          description: folder.description,
          starred: Boolean(folder.isStarred),
          archived: Boolean(folder.isArchived),
          fileCount: folderFiles.length,
          files: folderFiles.map(f => ({
            title: f.title,
            source: f.source,
            size: f.size,
            date: f.date,
            tags: f.tags || [],
            fileUrl: f.fileUrl,
            contentSnippet: f.contentSnippet
          }))
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Folio_Export_${selectedFolders.length}_folders_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const exportedFileCount = exportPayload.folders.reduce((sum, f) => sum + f.fileCount, 0);
    clearFolderSelection();
    showNotification(
      'EXPORT READY',
      `${selectedFolders.length} folder${selectedFolders.length === 1 ? '' : 's'} • ${exportedFileCount} file${exportedFileCount === 1 ? '' : 's'} downloaded`,
      'success'
    );
  };

  // ==========================================================================
  // FOLDER SHARING
  // ==========================================================================
  const buildFolderShareText = (folder: SubjectFolder) =>
    ShareKit.buildFolderShareMessage({
      name: folder.name,
      code: folder.code,
      description: folder.description,
      fileNames: files.filter(f => f.folderId === folder.id).map(f => formatFileTitle(f.title)),
      url: absoluteUrl('home', folder.id),
      sharedBy: studentProfile.name
    });

  const handleShareFolderVia = async (folder: SubjectFolder, channel: 'whatsapp' | 'email' | 'copy' | 'native') => {
    const message = buildFolderShareText(folder);
    const url = absoluteUrl('home', folder.id);

    if (channel === 'whatsapp') {
      ShareKit.shareOnWhatsApp(message);
      setShareFolderTarget(null);
      return;
    }

    if (channel === 'email') {
      ShareKit.shareViaEmail(`FOLIO folder: ${folder.name}`, message);
      setShareFolderTarget(null);
      return;
    }

    if (channel === 'native') {
      const shared = await ShareKit.nativeShare(`FOLIO folder: ${folder.name}`, message, url);
      if (shared) setShareFolderTarget(null);
      else showNotification('SHARING UNAVAILABLE', 'This device has no share sheet — use WhatsApp, email or copy instead.', 'info');
      return;
    }

    const copied = await ShareKit.copyToClipboard(message);
    setShareCopied(copied);
    setTimeout(() => setShareCopied(false), 2000);
    if (!copied) showNotification('COPY FAILED', 'Your browser blocked clipboard access.', 'warning');
  };

  // ==========================================================================
  // STORAGE & INDEX METRICS
  // ==========================================================================
  const storageMetrics = useMemo(() => {
    const activeBytes = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    const trashBytes = trashedFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    const usedBytes = activeBytes + trashBytes;
    const pdfBytes = files
      .filter(f => f.fileType === 'pdf')
      .reduce((sum, f) => sum + (f.sizeBytes || 0), 0);

    const diskRatio = Math.min(1, usedBytes / Rag.DISK_QUOTA_BYTES);
    const rag = Rag.getIndexStats();

    return {
      usedBytes,
      activeBytes,
      trashBytes,
      pdfBytes,
      otherBytes: Math.max(0, usedBytes - pdfBytes),
      freeBytes: Math.max(0, Rag.DISK_QUOTA_BYTES - usedBytes),
      quotaBytes: Rag.DISK_QUOTA_BYTES,
      diskRatio,
      diskPercent: diskRatio * 100,
      rag,
      diskBreached: diskRatio >= Rag.STORAGE_ALERT_THRESHOLD,
      ragBreached: rag.usageRatio >= Rag.STORAGE_ALERT_THRESHOLD
    };
  }, [files, trashedFiles, ragRevision]);

  const storageAlertActive =
    (storageMetrics.diskBreached || storageMetrics.ragBreached || previewStorageAlert) &&
    !dismissedStorageAlert;

  // Re-arm the alert whenever usage crosses the threshold again.
  useEffect(() => {
    if (!storageMetrics.diskBreached && !storageMetrics.ragBreached) {
      setDismissedStorageAlert(false);
    }
  }, [storageMetrics.diskBreached, storageMetrics.ragBreached]);

  // ==========================================================================
  // WEAK SPOT INPUTS
  // ==========================================================================
  const subjectEngagement: SubjectEngagement[] = useMemo(() => {
    const queryCounts = Rag.getFolderQueryCounts();
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      code: folder.code,
      fileCount: files.filter(f => f.folderId === folder.id).length,
      queries: queryCounts[folder.id] || 0,
      lastActivityTs: folder.lastActivityTs,
      isStarred: folder.isStarred
    }));
  }, [folders, files, ragRevision]);

  const confusionTopics = useMemo(() => Rag.getConfusionTopics(), [ragRevision]);

  // Form States
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(appSettings.defaultUploadLocation);
  const [selectedSource, setSelectedSource] = useState<string>('Direct Upload');

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "👋 Welcome to AI Studio! Ask any question about your subject notes, attach a file, search the web, or use the mic to speak your question.",
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const chatStreamRef = useRef<HTMLDivElement>(null);

  // Voice search — Web Speech API, filling the composer live as the student speaks
  const voice = useSpeechRecognition({
    onInterimResult: (text) => setChatInput(text),
    onFinalResult: (text) => setChatInput(text)
  });

  useEffect(() => {
    if (voice.error) showNotification('VOICE INPUT', voice.error, 'warning');
  }, [voice.error]);

  // Keep the newest message in view
  useEffect(() => {
    chatStreamRef.current?.scrollTo({ top: chatStreamRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isAiGenerating]);

  /** Attach a document from the student device to the next question. */
  const handleAttachDeviceFile = async (file: File | null) => {
    if (!file) return;

    let text = '';
    const isTextLike = file.type.includes('text') || /\.(txt|md|csv|json|log)$/i.test(file.name);
    if (isTextLike) {
      try {
        text = (await file.text()).slice(0, 6000);
      } catch { /* keep the filename-only reference */ }
    }

    setChatAttachments(prev => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        text: text || `(binary document: ${file.name} — ask about it by name)`,
        origin: 'device'
      }
    ]);
  };

  /** Attach a document already stored in FOLIO. */
  const handleAttachFolioFile = (doc: AcademicFile) => {
    setIsFilePickerOpen(false);
    setChatAttachments(prev =>
      prev.some(a => a.id === doc.id)
        ? prev
        : [...prev, {
            id: doc.id,
            name: doc.title,
            size: doc.size,
            text: (doc.contentSnippet || '').slice(0, 6000),
            origin: 'folio' as const
          }]
    );
  };

  const removeChatAttachment = (id: string) =>
    setChatAttachments(prev => prev.filter(a => a.id !== id));

  /** Web search button — hands the question to Google in a new tab. */
  const handleWebSearch = () => {
    const query = chatInput.trim() ||
      [...chatMessages].reverse().find(m => m.sender === 'user')?.text || '';
    if (!query) {
      showNotification('WEB SEARCH', 'Type or dictate a question first, then search the web.', 'info');
      return;
    }
    ShareKit.openGoogleSearch(query);
  };

  /** Share the whole thread to WhatsApp. */
  const handleShareChat = async (channel: 'whatsapp' | 'copy' | 'native') => {
    const transcript = ShareKit.buildChatTranscript(chatMessages, studentProfile.name);

    if (channel === 'whatsapp') {
      ShareKit.shareOnWhatsApp(transcript);
      setIsShareChatOpen(false);
      return;
    }
    if (channel === 'native') {
      const shared = await ShareKit.nativeShare('FOLIO AI Studio thread', transcript);
      if (shared) setIsShareChatOpen(false);
      else showNotification('SHARING UNAVAILABLE', 'This device has no share sheet — use WhatsApp or copy instead.', 'info');
      return;
    }
    const copied = await ShareKit.copyToClipboard(transcript);
    showNotification(
      copied ? 'THREAD COPIED' : 'COPY FAILED',
      copied ? 'The full conversation is on your clipboard.' : 'Your browser blocked clipboard access.',
      copied ? 'success' : 'warning'
    );
    setIsShareChatOpen(false);
  };

  const trashCount = trashedFiles.length + trashedFolders.length;

  const navItems: WebNavItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutGrid },
    { id: 'home', title: 'Subject Folders', icon: Home, badge: folders.length, badgeColor: 'bg-slate-200 text-slate-800' },
    { id: 'analytics', title: 'Analytics', icon: BarChart2 },
    { id: 'ai-studio', title: 'AI Studio', icon: Bot, badge: 'RAG', badgeColor: 'bg-slate-800 text-white' },
    { id: 'trash', title: 'Trash', icon: Trash2, badge: trashCount, badgeColor: trashCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400' },
    { id: 'terms', title: 'Terms & Conditions', icon: ScrollText },
    { id: 'privacy', title: 'Privacy Policy', icon: ShieldCheck },
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
        { id: 'p-terms', title: 'Terms & Conditions', subtitle: 'Usage terms, data handling & AI disclaimer', icon: ScrollText, tabId: 'terms' },
        { id: 'p-privacy', title: 'Privacy Policy', subtitle: 'What FOLIO stores, where it lives & your rights', icon: ShieldCheck, tabId: 'privacy' },
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
  const [autoTagStatus, setAutoTagStatus] = useState('');

  const handleUploadFileSubmit = async () => {
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
      let targetFolderId = selectedFolderId || folders[0]?.id || 'f-cn';

      // Extract text preview snippet locally for text files
      let snippetText = `Document uploaded: ${fileNameToUse}. Stored in Firebase Cloud Storage.`;
      if (!isPdf && selectedUploadFile.type.includes('text')) {
        try {
          const rawText = await selectedUploadFile.text();
          if (rawText) snippetText = rawText.substring(0, 2000);
        } catch (e) { }
      }

      // AI auto-tagging: classify the document and route it to the best folder
      let autoTags: string[] = [];
      let autoTagNote = '';
      if (appSettings.autoTagging) {
        setAutoTagStatus(`Analysing ${fileNameToUse}...`);
        const classification = await classifyDocument({
          fileName: fileNameToUse,
          content: snippetText,
          folders: folders.map(f => ({ id: f.id, name: f.name, code: f.code, description: f.description })),
          selectedFolderId: targetFolderId,
          apiKey: GEMINI_API_KEY
        });

        autoTags = classification.tags;
        if (classification.rerouted && classification.confidence >= 0.5) {
          targetFolderId = classification.folderId;
          autoTagNote = ` • auto-filed into ${classification.folderName}`;
        }
        if (autoTags.length) {
          autoTagNote += ` • tagged ${autoTags.slice(0, 3).join(', ')}`;
        }
        setAutoTagStatus('');
      }

      // Upload to Firebase Storage & Firestore
      let uploadedDbFile = null;
      try {
        uploadedDbFile = await FirebaseService.uploadFile(
          selectedUploadFile,
          targetFolderId,
          snippetText,
          autoTags,
          appSettings.autoTagging
        );
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
        contentSnippet: snippetText,
        tags: autoTags,
        autoTagged: appSettings.autoTagging && autoTags.length > 0
      };

      setFiles(prev => [newFile, ...prev]);

      // Embed the new document into the RAG index straight away
      Rag.indexDocument(newFile.id, newFile.folderId, newFile.title, snippetText);
      bumpRagRevision();
      registerStudyActivity();

      setFolders(prev => prev.map(f => {
        if (f.id === targetFolderId) {
          return { ...f, fileCount: f.fileCount + 1 };
        }
        return f;
      }));

      const uploadedName = fileNameToUse;
      setSelectedUploadFile(null);
      setIsUploadModalOpen(false);
      showNotification('FILE UPLOADED', `${uploadedName}${autoTagNote}`, 'success');
    } catch (err: any) {
      showNotification("UPLOAD FAILED", err?.message || "Error processing file", "warning");
    } finally {
      setIsUploading(false);
      setAutoTagStatus('');
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

  const performDeleteFile = async (fileId: string) => {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      setFolders(prev => prev.map(f => {
        if (f.id === targetFile.folderId) {
          return { ...f, fileCount: Math.max(0, f.fileCount - 1) };
        }
        return f;
      }));
      setTrashedFiles(prev => [targetFile, ...prev.filter(t => t.id !== targetFile.id)]);
      setFiles(prev => prev.filter(f => f.id !== fileId));

      // Purge this document from the RAG index
      Rag.removeDocument(fileId);
      ragSyncRef.current = '';
      bumpRagRevision();

      try {
        await FirebaseService.trashFile(fileId);
      } catch (e) {
        console.warn('Firebase trash error:', e);
      }
    }
    setDeletingFileTarget(null);
    if (readingFile?.id === fileId) {
      setReadingFile(null);
    }
    showNotification('MOVED TO TRASH', targetFile?.title || 'File moved to trash', 'info');
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

    // Re-embed the restored document so the assistant can find it again
    Rag.indexDocument(doc.id, doc.folderId, doc.title, doc.contentSnippet || '');
    bumpRagRevision();

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

    Rag.removeDocument(fileId);
    bumpRagRevision();

    try {
      await FirebaseService.permanentlyDeleteFile(fileId, targetFile?.storagePath);
    } catch (e) {
      console.warn('Firebase permanent delete error:', e);
    }
    showNotification('PERMANENTLY DELETED', 'File removed from Firebase storage & database', 'warning');
  };

  const handleEmptyTrash = () => {
    if (trashedFiles.length === 0 && trashedFolders.length === 0) return;
    setIsEmptyTrashModalOpen(true);
  };

  const confirmEmptyTrash = async () => {
    setIsEmptyTrashModalOpen(false);

    trashedFiles.forEach(f => Rag.removeDocument(f.id));
    trashedFolders.forEach(f => Rag.removeFolder(f.id));
    bumpRagRevision();

    const foldersToPurge = [...trashedFolders];
    setTrashedFiles([]);
    setTrashedFolders([]);

    await Promise.all(
      foldersToPurge.map(f => FirebaseService.deleteFolder(f.id).catch(e => {
        console.warn('Folder purge note:', e);
        return false;
      }))
    );

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

  // Avatar Upload Handler — an uploaded photo clears any chosen character
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setStudentProfile(prev => ({ ...prev, avatarUrl: url, avatarPreset: '' }));
      authUpdateProfile({ avatarPreset: '' }).catch(() => { });
      registerStudyActivity();
    }
  };

  /**
   * Pick one of the built-in character avatars. Only the short preset id is
   * persisted, and it takes precedence over an uploaded photo — so clearing it
   * restores the original picture instead of losing it.
   */
  const handleSelectAvatarPreset = (presetId: string) => {
    const isSame = studentProfile.avatarPreset === presetId;
    const nextPreset = isSame ? '' : presetId;

    setStudentProfile(prev => ({ ...prev, avatarPreset: nextPreset }));
    registerStudyActivity();

    authUpdateProfile({ avatarPreset: nextPreset }).catch(err => {
      console.warn('Avatar preset sync failed, reverting:', err);
      setStudentProfile(prev => ({ ...prev, avatarPreset: studentProfile.avatarPreset || '' }));
    });

    const chosen = AVATAR_PRESETS.find(p => p.id === presetId);
    showNotification(
      nextPreset ? 'AVATAR UPDATED' : 'AVATAR CLEARED',
      nextPreset ? `${chosen?.name || 'Character'} is now your profile picture` : 'Back to your original profile picture',
      'success'
    );
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

    const attachmentsForTurn = [...chatAttachments];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: q,
      time: timeStr,
      attachments: attachmentsForTurn.map(a => a.name)
    }]);
    if (!promptText) setChatInput('');
    setChatAttachments([]);
    setIsAiGenerating(true);
    if (voice.listening) voice.stop();

    // Retrieve grounding passages from the local RAG document index and record
    // the retrieval quality so Weak Spot Analysis can flag confusing topics.
    const matches = Rag.search(q, 4);
    const topScore = matches.length ? matches[0].score : 0;
    Rag.logQuery(q, topScore, matches[0]?.chunk.folderId);
    bumpRagRevision();
    registerStudyActivity();

    const sourceTitles = [...new Set(matches.map(m => m.chunk.fileTitle))];
    const notesContext = matches
      .map((m, i) => `[${i + 1}] From "${m.chunk.fileTitle}": ${m.chunk.text}`)
      .join('\n\n');
    const attachmentContext = attachmentsForTurn
      .map(a => `[Attached file: ${a.name}]\n${a.text}`)
      .join('\n\n');

    // No key configured: answer locally rather than firing a request that is
    // guaranteed to come back as "unregistered caller".
    if (!GEMINI_API_KEY) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: buildOfflineAnswer(q, matches),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: sourceTitles
        }
      ]);
      setIsAiGenerating(false);
      return;
    }

    try {
      // Direct REST API Call for guaranteed browser compatibility
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: [
                'You are the FOLIO Study Studio assistant, helping a university student with their coursework.',
                '',
                'How to answer:',
                '- If the message is a greeting or small talk, reply in one friendly sentence. No headings, no bullets.',
                '- Otherwise open with one or two sentences that answer the question directly.',
                '- Break anything longer into short sections using "## Section title" headings.',
                '- Use "- " for lists and "1. " for ordered steps. Keep each point to one line where you can.',
                '- Bold key terms with **term**, and wrap code, commands, formulas and identifiers in `backticks`.',
                '- Never restate the question, never pad, and never end with a sign-off.',
                attachmentContext ? `\nThe student attached these files to this question:\n${attachmentContext}` : '',
                notesContext ? `\nPassages retrieved from the student's own uploaded notes:\n${notesContext}\nPrefer these passages when they are relevant, and name the note you used.` : '',
                `\nStudent question: ${q}`
              ].filter(Boolean).join('\n')
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

      // The reply is rendered by <ChatMarkdown>, so the structure is kept —
      // only whitespace is tidied up.
      const cleanedResponse = normalizeAnswer(responseText);

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: cleanedResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: sourceTitles
        }
      ]);
    } catch (err: any) {
      console.error("Gemini AI Error:", err);

      const note = describeAiError(err?.message || 'Unable to reach the AI service');
      const answer = buildOfflineAnswer(q, matches);

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `${answer}\n\n---\n${note}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: sourceTitles
        }
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

  const avatarSrc = resolveAvatarSrc(studentProfile.avatarPreset, studentProfile.avatarUrl);

  // The cursor collects its magnetic targets once per effect run, so hand it a
  // fresh key whenever the view swaps out the interactive elements.
  const magneticRescanKey = `${activeTab}|${openedFolderId || ''}`;

  // Every page toggle returns the reader to the top, smoothly. Skipped when the
  // URL points at a section (e.g. /settings#storage), which scrolls itself.
  useEffect(() => {
    if (activeSection) return;
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, openedFolderId, activeSection]);

  /** Show a goodbye card for a beat, then actually end the session. */
  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsMobileNavOpen(false);
    setIsStreakPanelOpen(false);

    window.setTimeout(() => {
      if (onLogout) onLogout();
      else setIsLoggingOut(false);
    }, 1600);
  };

  const profileFirstName = (studentProfile.name || 'Scholar').trim().split(/\s+/)[0];

  const profileInitials = (studentProfile.name || 'Folio Scholar')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'FS';

  const sortedDashboardFiles = getSortedFiles(files);
  const currentOpenedFolder = folders.find(f => f.id === openedFolderId);
  const currentOpenedFolderFiles = getSortedFiles(files.filter(f => f.folderId === openedFolderId));

  return (
    <MagneticCursor
      cursorSize={22}
      magneticFactor={0.3}
      hoverPadding={10}
      blendMode="exclusion"
      rescanKey={magneticRescanKey}
    >
    <div className="flex h-screen w-full bg-[#f4f7fa] text-slate-800 overflow-hidden antialiased">

      {/* Mobile navigation backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation — off-canvas drawer below lg, static flex column above */}
      <aside
        className={`z-40 h-full bg-[#1e293b] border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 ${
          isMobileNavOpen
            ? 'fixed inset-y-0 left-0 flex w-64 shadow-2xl animate-in slide-in-from-left duration-200'
            : 'hidden lg:flex lg:static lg:translate-x-0'
        } ${isSidebarCollapsed ? 'w-64 lg:w-20' : 'w-64'}`}
      >
        <div className="w-full">
          {/* Brand Header */}
          <div className={`h-16 flex items-center bg-[#0f172a] border-b border-slate-800 ${
            isSidebarCollapsed ? 'px-4 lg:px-2 justify-between lg:justify-center gap-1' : 'px-4 justify-between'
          }`}>
            <FolioLogo size={58} compact={isSidebarCollapsed && !isMobileNavOpen} tone="dark" />

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:block p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3">
            {(!isSidebarCollapsed || isMobileNavOpen) && (
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
                    data-magnetic
                    onClick={() => {
                      goToTab(item.id as TabId);
                      setIsMobileNavOpen(false);
                    }}
                    title={isSidebarCollapsed ? item.title : undefined}
                    className={`w-full flex items-center rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer group ${
                      isSidebarCollapsed
                        ? 'justify-between px-3.5 py-3 lg:justify-center lg:p-3 hover:bg-slate-800 hover:scale-105 active:scale-95'
                        : 'justify-between px-3.5 py-3'
                    } ${isActive
                        ? 'bg-slate-800 text-white font-black shadow-sm ring-1 ring-slate-700'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:scale-125 group-hover:text-white'
                      }`} />
                      <span className={`tracking-wide ${isSidebarCollapsed ? 'inline lg:hidden' : 'inline'}`}>
                        {item.title}
                      </span>
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
              goToTab('profile');
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 group-hover:scale-110 transition-transform" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                {profileInitials}
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
            data-magnetic
            onClick={handleLogout}
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
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#f4f7fa]">

        {/* Header Navbar */}
        <header className="h-16 border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 bg-white shadow-2xs">

          {/* Mobile navigation trigger */}
          <button
            data-magnetic
            onClick={() => setIsMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Open navigation"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Omni-Search Box with Floating Autocomplete Panel */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-0 max-w-md">
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Live Study Streak — measured from real daily activity */}
            <div ref={streakPanelRef} className="relative">
              <button
                data-magnetic
                onClick={() => setIsStreakPanelOpen(o => !o)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                  streak.activeToday
                    ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
                title="Study streak details"
              >
                <Flame className={`w-4 h-4 ${streak.activeToday ? 'text-amber-500 animate-bounce' : 'text-slate-500'}`} />
                <span>{streak.current}</span>
                <span className="hidden sm:inline">Day Streak</span>
              </button>

              {isStreakPanelOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                      Study Streak
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      BEST {streak.longest}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-black text-slate-900 leading-none">{streak.current}</div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-1">
                        consecutive {streak.current === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                    <Flame className={`w-8 h-8 ${streak.activeToday ? 'text-amber-500' : 'text-slate-300'}`} />
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    {streak.lastSevenDays.map((day) => (
                      <div key={day.date} className="flex flex-col items-center gap-1" title={day.date}>
                        <div
                          className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                            day.active
                              ? 'bg-amber-100 border-amber-300 text-amber-700'
                              : 'bg-slate-50 border-slate-200 text-slate-300'
                          }`}
                        >
                          {day.active ? <Flame className="w-3 h-3" /> : <span className="text-[10px]">·</span>}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{day.label}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                    {streak.activeToday
                      ? `Today counts — ${streak.todayActivities} study ${streak.todayActivities === 1 ? 'action' : 'actions'} recorded. Come back tomorrow to extend the run.`
                      : 'Upload a note, star a subject or ask the AI to record today.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* AUTOMATED STORAGE THRESHOLD ALERT (>85% disk or RAG index usage) */}
        {storageAlertActive && (
          <div className="shrink-0 border-b border-amber-300 bg-amber-50 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in slide-in-from-top duration-300">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs font-bold text-amber-900 min-w-0">
                {!storageMetrics.diskBreached && !storageMetrics.ragBreached && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded mr-1.5">
                    Preview
                  </span>
                )}
                Storage threshold ({(Rag.STORAGE_ALERT_THRESHOLD * 100).toFixed(0)}%) exceeded —{' '}
                <span className="font-mono">disk {storageMetrics.diskPercent.toFixed(1)}%</span>
                {', '}
                <span className="font-mono">RAG document index {storageMetrics.rag.usagePercent.toFixed(1)}%</span>
                <span className="font-medium text-amber-800">
                  {' '}of capacity used. Free up space to keep uploads and indexing running.
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <a
                href="/settings#storage"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('settings', { section: 'storage' });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Manage storage</span>
              </a>

              <button
                onClick={() => {
                  setDismissedStorageAlert(true);
                  setPreviewStorageAlert(false);
                }}
                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Dismiss alert"
                aria-label="Dismiss storage alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content View Switcher */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth p-3 sm:p-6 md:p-8">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-300">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                {/* Left Column Stack: 1. Welcome Card + 2. Resource & Activity Overview Box + 3. Starred Box */}
                <div className="lg:col-span-2 space-y-4">

                  {/* 1. Welcome Card (Compact) */}
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3 sm:gap-4 shrink-0">
                    <div className="min-w-0">
                      <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 break-words">
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
                        data-magnetic
                        onClick={() => goToTab('ai-studio')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-black shadow-xs hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ask AI</span>
                      </button>

                      <button
                        data-magnetic
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
                          onClick={() => goToTab('home')}
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
                          onClick={() => goToTab('home')}
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

                    {folders.filter(f => f.isStarred).length === 0 && files.filter(f => f.isStarred).length === 0 ? (
                      <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                        <p className="text-[11px] font-medium text-slate-500">
                          Star <Star className="w-3 h-3 inline text-amber-400 fill-amber-400 mx-0.5" /> any file or folder to pin it here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                        {/* Starred Folders */}
                        {folders.filter(f => f.isStarred).map((folder) => {
                          const folderFiles = files.filter(f => f.folderId === folder.id);
                          return (
                            <div
                              key={folder.id}
                              className="flex items-center justify-between p-2 rounded-lg border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 transition-all"
                            >
                              <button
                                onClick={() => goToTab('home', { folderId: folder.id })}
                                className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-md bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                                  <FolderClosed className="w-3 h-3" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">{folder.name}</h4>
                                  <p className="text-[10px] font-mono font-semibold text-slate-500 truncate">
                                    {folder.code} • {folderFiles.length} file{folderFiles.length === 1 ? '' : 's'}
                                  </p>
                                </div>
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => goToTab('home', { folderId: folder.id })}
                                  className="p-0.5 px-1.5 rounded bg-slate-900 text-white text-[9px] font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                                  title="Open folder"
                                >
                                  <FolderOpen className="w-2.5 h-2.5" />
                                  <span>Open</span>
                                </button>
                                <button
                                  onClick={(e) => handleToggleStarFolder(folder.id, e)}
                                  className="p-1 text-amber-500 hover:text-amber-700 transition-all cursor-pointer"
                                  title="Unstar folder"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Starred Files */}
                        {files.filter(f => f.isStarred).map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center shrink-0">
                                <FileText className="w-3 h-3" />
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {formatFileTitle(file.title)}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setReadingFile(file)}
                                className="p-0.5 px-1.5 rounded bg-slate-900 text-white text-[9px] font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                                title="Read In-App"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>Read</span>
                              </button>
                              <button
                                onClick={(e) => handleToggleStarFile(file.id, e)}
                                className="p-1 text-amber-500 hover:text-amber-700 transition-all cursor-pointer"
                                title="Unstar file"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                        id="new-todo-task-input"
                        name="new-todo-task-input"
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
                          <h1 className="text-lg sm:text-2xl font-black text-slate-900 break-words">
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
                      <Upload className="w-4 h-4 shrink-0" />
                      <span className="truncate">Upload File to Folder</span>
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
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900">Academic Subject Folders</h1>
                      <p className="text-xs mt-1 text-slate-500">
                        Organize your study resources by subject. Click any folder to inspect files, or select several for bulk actions.
                      </p>
                    </div>
                    <button
                      data-magnetic
                      onClick={() => setIsCreateFolderModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-black shadow-md hover:bg-slate-800 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>Create New Folder</span>
                    </button>
                  </div>

                  {/* Selection toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <button
                      onClick={toggleSelectAllFolders}
                      disabled={visibleFolders.length === 0}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {visibleFolders.length > 0 && visibleFolders.every(f => selectedFolderIds.includes(f.id)) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-slate-900" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Select all</span>
                      <span className="text-[10px] font-mono text-slate-400">({visibleFolders.length})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {selectedFolderIds.length > 0 && (
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {selectedFolderIds.length} selected
                        </span>
                      )}
                      {archivedCount > 0 && (
                        <button
                          onClick={() => setShowArchivedFolders(v => !v)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            showArchivedFolders
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archived</span>
                          <span className="text-[10px] font-mono opacity-80">({archivedCount})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {visibleFolders.length === 0 ? (
                    <div className="p-12 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-3">
                      <FolderClosed className="w-10 h-10 mx-auto text-slate-300" />
                      <h3 className="text-sm font-bold text-slate-700">
                        {folders.length === 0 ? 'No subject folders yet' : 'Every folder is archived'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {folders.length === 0
                          ? 'Create your first subject folder to start organising lecture notes and assignments.'
                          : 'Toggle "Archived" above to bring your archived subjects back into view.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {visibleFolders.map((folder) => {
                        const folderFiles = files.filter(f => f.folderId === folder.id);
                        return (
                          <FolderCard
                            key={folder.id}
                            title={folder.name}
                            code={folder.code}
                            description={folder.description}
                            fileCount={folderFiles.length}
                            isStarred={folder.isStarred}
                            isArchived={folder.isArchived}
                            selectable
                            selected={selectedFolderIds.includes(folder.id)}
                            onSelectChange={(checked) => toggleFolderSelection(folder.id, checked)}
                            onStarToggle={(e) => handleToggleStarFolder(folder.id, e)}
                            onShare={() => { setShareCopied(false); setShareFolderTarget(folder); }}
                            onDelete={() => setDeletingFolderTarget(folder)}
                            onClick={() => goToTab('home', { folderId: folder.id })}
                            className={
                              highlightedItemId === folder.id || highlightedItemId === `folder-${folder.id}`
                                ? 'ring-2 ring-slate-800 bg-slate-100 animate-pulse'
                                : ''
                            }
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* STICKY BULK ACTION BAR */}
                  {selectedFolderIds.length > 0 && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl animate-in slide-in-from-bottom-4 duration-200">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-white text-slate-900 text-xs font-black flex items-center justify-center shrink-0">
                            {selectedFolderIds.length}
                          </span>
                          <span className="text-xs font-bold truncate">
                            folder{selectedFolderIds.length === 1 ? '' : 's'} selected
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <button
                            onClick={handleBulkExport}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                            title="Export the selected folders and their files"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export</span>
                          </button>

                          <button
                            onClick={handleBulkArchive}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                            title="Archive the selected folders"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {selectedFolders.some(f => !f.isArchived) ? 'Archive' : 'Unarchive'}
                            </span>
                          </button>

                          <button
                            onClick={() => setBulkDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer"
                            title="Move the selected folders to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>

                          <button
                            onClick={clearFolderSelection}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                            title="Clear selection"
                            aria-label="Clear selection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* AI STUDIO TAB */}
          {activeTab === 'ai-studio' && (
            <div className="h-[calc(100dvh-150px)] sm:h-[calc(100dvh-120px)] w-full max-w-4xl mx-auto flex flex-col justify-between py-1 sm:py-2 animate-in fade-in duration-300">

              {/* Clean Native Page Header */}
              <div className="pb-4 mb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5 font-black" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">AI Studio</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      Grounded in {storageMetrics.rag.documentCount} indexed document{storageMetrics.rag.documentCount === 1 ? '' : 's'} from your notes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsShareChatOpen(true)}
                    disabled={chatMessages.length <= 1}
                    className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer font-bold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Share this conversation"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => setChatMessages([{ sender: 'ai', text: "Thread cleared. Ask me any question about your notes or study concepts!", time: 'Just now' }])}
                    className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer font-bold border border-slate-200"
                  >
                    Clear<span className="hidden sm:inline"> Thread</span>
                  </button>
                </div>
              </div>

              {/* Full Page Chat Stream */}
              <div ref={chatStreamRef} className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-6">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                    </div>

                    {/* Attached files on the question */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end max-w-[85%]">
                        {msg.attachments.map(name => (
                          <span
                            key={name}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md"
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">{name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.sender === 'user' ? (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap bg-slate-900 text-white font-medium px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs max-w-[85%]">
                        {msg.text}
                      </div>
                    ) : (
                      <ChatMarkdown content={msg.text} className="pl-1 max-w-[95%]" />
                    )}

                    {/* Notes the answer was grounded in */}
                    {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-1 pt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From your notes:</span>
                        {msg.sources.map(source => (
                          <span
                            key={source}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[160px]">{formatFileTitle(source)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isAiGenerating && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Sparkles className="w-4 h-4 animate-spin text-slate-700" />
                    <span>AI Assistant is thinking...</span>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">

                {/* Pending attachments */}
                {chatAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chatAttachments.map(att => (
                      <span
                        key={att.id}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 pl-2 pr-1 py-1 rounded-lg"
                      >
                        {att.origin === 'folio' ? <FolderClosed className="w-3 h-3 text-slate-500" /> : <Paperclip className="w-3 h-3 text-slate-500" />}
                        <span className="truncate max-w-[160px]">{att.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{att.size}</span>
                        <button
                          onClick={() => removeChatAttachment(att.id)}
                          className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remove attachment"
                          aria-label={`Remove ${att.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Voice listening indicator */}
                {voice.listening && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold animate-in fade-in duration-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                    </span>
                    <span>Listening… speak your question</span>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-300 bg-white shadow-xs focus-within:border-slate-800 transition-colors">
                  <input
                    id="ai-studio-chat-input"
                    name="ai-studio-chat-input"
                    type="text"
                    value={chatInput}
                    disabled={isAiGenerating}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask a question from your notes..."
                    className="w-full px-4 pt-3 pb-2 text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400 disabled:opacity-50 rounded-t-2xl"
                  />

                  {/* Control row */}
                  <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">

                      {/* Attach from device */}
                      <input
                        id="chat-file-attachment-input"
                        name="chat-file-attachment-input"
                        ref={chatFileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          handleAttachDeviceFile(e.target.files ? e.target.files[0] : null);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => chatFileInputRef.current?.click()}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Attach a file from this device"
                        aria-label="Attach a file from this device"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Attach from FOLIO folders */}
                      <button
                        onClick={() => setIsFilePickerOpen(true)}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Attach a document from your FOLIO folders"
                        aria-label="Attach a document from your FOLIO folders"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>

                      <span className="w-px h-5 bg-slate-200 mx-0.5" />

                      {/* Google web search */}
                      <button
                        onClick={handleWebSearch}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:border-slate-800 hover:text-slate-900 transition-all cursor-pointer"
                        title="Search this question on Google"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold hidden sm:inline">Search</span>
                      </button>

                      {/* Voice search */}
                      <button
                        onClick={voice.supported ? voice.toggle : () => showNotification('VOICE UNAVAILABLE', 'This browser does not support voice input. Try Chrome or Edge.', 'info')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${
                          voice.listening
                            ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                            : voice.supported
                              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              : 'text-slate-300'
                        }`}
                        title={voice.listening ? 'Stop listening' : 'Ask by voice'}
                        aria-label={voice.listening ? 'Stop listening' : 'Ask by voice'}
                        aria-pressed={voice.listening}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      data-magnetic
                      onClick={() => handleSendChat()}
                      disabled={isAiGenerating || !chatInput.trim()}
                      className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="p-4 sm:p-6 rounded-xl border border-slate-200 bg-white shadow-2xs">
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
                    <div className="flex justify-between items-center text-xs font-bold mb-2 gap-2">
                      <span className="text-slate-500">RAG Document Index</span>
                      <span className="text-slate-800 font-mono truncate">
                        {Rag.formatBytes(storageMetrics.rag.indexedBytes)} / {Rag.formatBytes(storageMetrics.rag.capacityBytes)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${storageMetrics.ragBreached ? 'bg-amber-500' : 'bg-slate-800'}`}
                        style={{ width: `${Math.max(1.5, storageMetrics.rag.usagePercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                      <span>{storageMetrics.rag.documentCount} documents • {storageMetrics.rag.chunkCount} embeddings</span>
                      <span>{storageMetrics.rag.usagePercent.toFixed(1)}%</span>
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

              {/* Weak Spot Analysis */}
              <WeakSpotAnalysis
                subjects={subjectEngagement}
                confusionTopics={confusionTopics}
                mounted={isAnalyticsMounted}
                onOpenFolder={(folderId) => goToTab('home', { folderId })}
                onUploadToFolder={(folderId) => {
                  setSelectedFolderId(folderId);
                  setIsUploadModalOpen(true);
                }}
                onAskAiAbout={(topic) => {
                  goToTab('ai-studio');
                  setChatInput(`Explain ${topic} clearly using my notes, and cover the parts I keep getting stuck on.`);
                }}
              />

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
                    <div key={item.name} className="flex items-center justify-between gap-2 sm:gap-4">
                      <span className="w-20 sm:w-36 text-[11px] sm:text-xs font-bold text-slate-800 truncate font-mono shrink-0">
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
                      <span className="w-10 sm:w-12 text-right text-[11px] sm:text-xs font-mono font-bold text-slate-700 shrink-0">
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
                      <div key={item.topic} className="flex items-center gap-2 sm:gap-4">
                        <span className="w-20 sm:w-36 text-[11px] sm:text-xs font-bold text-slate-700 font-mono truncate shrink-0">
                          {item.topic}
                        </span>
                        <div className="flex-1 sm:flex-none sm:w-48 h-4 bg-slate-100 rounded overflow-hidden p-0.5 border border-slate-200">
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
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border border-slate-300 shadow-md" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shadow-md">
                        {profileInitials}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-xl border border-slate-300 shadow-md cursor-pointer hover:bg-slate-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 break-words">{studentProfile.name}</h2>
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

                {/* CHARACTER AVATAR PICKER */}
                <div className="pb-6 mb-6 border-b border-slate-200 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Pick your avatar
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Choose a character, or upload a photo of your own
                      </p>
                    </div>

                    {studentProfile.avatarPreset && (
                      <button
                        onClick={() => handleSelectAvatarPreset(studentProfile.avatarPreset || '')}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = studentProfile.avatarPreset === preset.id;
                      return (
                        <div key={preset.id} className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                          <button
                            data-magnetic
                            onClick={() => handleSelectAvatarPreset(preset.id)}
                            aria-pressed={isSelected}
                            title={isSelected ? `${preset.name} selected — click to clear` : `Use ${preset.name}`}
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all cursor-pointer ring-2 ring-offset-2 ring-offset-white ${
                              isSelected
                                ? `${preset.ringClass} shadow-md`
                                : 'ring-transparent hover:ring-slate-200'
                            }`}
                          >
                            <img
                              src={preset.src}
                              alt={preset.name}
                              className="w-full h-full rounded-full pointer-events-none"
                            />
                            {isSelected && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-sm pointer-events-none">
                                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                              </span>
                            )}
                          </button>
                          <span
                            className={`text-[10px] font-bold truncate w-full text-center ${
                              isSelected ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {preset.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* Upload your own photo */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <label
                        data-magnetic
                        title="Upload your own photo"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 flex items-center justify-center cursor-pointer hover:border-slate-800 hover:text-slate-800 hover:bg-slate-100 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                      <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">
                        Upload
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
                        onClick={handleLogout}
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
              <div className="p-4 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-6">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">FOLIO Studio Workspace Settings</h2>
                  <p className="text-xs text-slate-500 mt-1">Configure workspace storage, backup archives, default sorting, view modes, and file behaviors</p>
                </div>

                {/* Storage & Cloud Backup Box — target of the /settings#storage alert link */}
                <div
                  id="storage"
                  ref={storageSectionRef}
                  className={`p-4 sm:p-6 rounded-xl border bg-slate-50 space-y-5 scroll-mt-6 transition-all ${
                    activeSection === 'storage'
                      ? 'border-amber-400 ring-2 ring-amber-200'
                      : 'border-slate-200'
                  }`}
                >

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Workspace Storage Utilization & Backup
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500">
                          Monitor disk space usage and create local backup snapshots
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold border px-3 py-1.5 rounded-lg shadow-2xs shrink-0 self-start sm:self-auto ${
                        storageMetrics.diskBreached
                          ? 'text-amber-800 bg-amber-50 border-amber-300'
                          : 'text-slate-700 bg-white border-slate-300'
                      }`}
                    >
                      {Rag.formatBytes(storageMetrics.usedBytes)} / {Rag.formatBytes(storageMetrics.quotaBytes)} ({storageMetrics.diskPercent.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Disk usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Used Storage</span>
                      <span>{Rag.formatBytes(storageMetrics.freeBytes)} Available</span>
                    </div>

                    <div className="relative w-full bg-slate-200 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-300/70">
                      <div
                        className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                          storageMetrics.diskBreached ? 'bg-amber-500' : 'bg-slate-900'
                        }`}
                        style={{ width: `${Math.max(1, storageMetrics.diskPercent)}%` }}
                      />
                      {/* 85% alert threshold marker */}
                      <span
                        className="absolute top-0 bottom-0 w-px bg-amber-600/70"
                        style={{ left: `${Rag.STORAGE_ALERT_THRESHOLD * 100}%` }}
                        title="Alert threshold: 85%"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium pt-1 gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-900" />
                        <span>PDF Documents: {Rag.formatBytes(storageMetrics.pdfBytes)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span>Text & Scans: {Rag.formatBytes(storageMetrics.otherBytes)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        <span>Free Space: {Rag.formatBytes(storageMetrics.freeBytes)}</span>
                      </span>
                    </div>
                  </div>

                  {/* RAG document index usage */}
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 gap-2">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>RAG Document Index</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {Rag.formatBytes(storageMetrics.rag.indexedBytes)} / {Rag.formatBytes(storageMetrics.rag.capacityBytes)} ({storageMetrics.rag.usagePercent.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="relative w-full bg-slate-200 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-300/70">
                      <div
                        className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                          storageMetrics.ragBreached ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(1, storageMetrics.rag.usagePercent)}%` }}
                      />
                      <span
                        className="absolute top-0 bottom-0 w-px bg-amber-600/70"
                        style={{ left: `${Rag.STORAGE_ALERT_THRESHOLD * 100}%` }}
                        title="Alert threshold: 85%"
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      {storageMetrics.rag.documentCount} document{storageMetrics.rag.documentCount === 1 ? '' : 's'} embedded across {storageMetrics.rag.chunkCount} chunk{storageMetrics.rag.chunkCount === 1 ? '' : 's'}.
                      FOLIO raises a workspace alert once disk or index usage passes 85%.
                    </p>
                  </div>

                  {/* Backup & alert controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200 gap-3">
                    <div className="text-xs font-semibold text-slate-600">
                      Export a complete JSON backup snapshot of your lecture notes, subject folders, and deadlines
                      <button
                        onClick={() => {
                          setDismissedStorageAlert(false);
                          setPreviewStorageAlert(true);
                        }}
                        className="block mt-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                      >
                        Preview the storage threshold alert
                      </button>
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

                {/* 3. AI Document Intelligence */}
                <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    <span>AI Document Intelligence</span>
                  </h3>

                  <div className="flex items-start justify-between gap-4 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Auto-tag &amp; route uploaded files</span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded">AI</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Every upload is analysed for subject, topic and course code, then filed into the
                        best-matching folder with topic tags attached. Falls back to keyword matching when
                        the AI service is unreachable, so uploads are never blocked.
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={appSettings.autoTagging}
                      onChange={(e) => setAppSettings(s => ({ ...s, autoTagging: e.target.checked }))}
                      className="w-4 h-4 accent-slate-900 rounded cursor-pointer mt-1 shrink-0"
                      aria-label="Auto-tag and route uploaded files"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200 text-[11px] font-medium text-slate-500">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {appSettings.autoTagging
                        ? `Active — ${files.filter(f => f.autoTagged).length} document${files.filter(f => f.autoTagged).length === 1 ? '' : 's'} classified so far.`
                        : 'Disabled — uploads go straight to the folder you pick, untagged.'}
                    </span>
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

          {/* TERMS & CONDITIONS TAB */}
          {activeTab === 'terms' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="p-4 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-6">

                {/* Header */}
                <div className="flex items-start gap-3 pb-5 border-b border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 shrink-0">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900">Terms &amp; Conditions</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      The agreement covering your use of FOLIO Studio, your documents, and the AI assistant
                    </p>
                    <p className="text-[11px] font-mono font-bold text-slate-400 mt-2">
                      Last updated: 19 August 2026 &bull; Version 1.0
                    </p>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-5">
                  {[
                    {
                      title: '1. Acceptance of Terms',
                      body: 'By creating a FOLIO Studio account or uploading any material to the workspace, you agree to these terms. If you do not agree, stop using the workspace and delete your account from the Profile page.'
                    },
                    {
                      title: '2. Eligibility & Your Account',
                      body: 'FOLIO Studio is intended for students and educators. You are responsible for the accuracy of your profile details, for keeping your password confidential, and for all activity that happens under your account. Tell us immediately if you believe your account has been accessed by someone else.'
                    },
                    {
                      title: '3. Your Content Stays Yours',
                      body: 'You keep full ownership of every note, PDF, assignment and document you upload. You grant FOLIO Studio only the permission it needs to operate: to store your files, index their text so search and the AI assistant can retrieve them, and display them back to you. We do not sell your content and we do not use it to train third-party models.'
                    },
                    {
                      title: '4. Acceptable Use',
                      body: 'Do not upload material you have no right to share, content that infringes copyright, malware, or anything unlawful. Do not use the workspace to submit AI-generated work in violation of your institution academic integrity policy. Accounts used for these purposes may be suspended.'
                    },
                    {
                      title: '5. AI Assistant Disclaimer',
                      body: 'The AI Studio assistant generates answers from your indexed notes and a third-party language model. Its responses can be incomplete or wrong, and it is a study aid — not a substitute for your lectures, textbooks or your own judgement. Always verify anything you rely on for an assessment. Questions you send are processed by the configured AI provider.'
                    },
                    {
                      title: '6. Storage, Trash & Deletion',
                      body: 'Each workspace has a storage quota and a document index quota; FOLIO warns you once either passes 85% of capacity. Deleted folders and files are soft-deleted to the Trash bin and can be restored. Emptying the Trash, or deleting an item permanently, removes it and its search embeddings for good and cannot be undone.'
                    },
                    {
                      title: '7. Sharing',
                      body: 'When you share a folder or an AI conversation, you choose the recipient and the channel. Anything you send leaves the workspace and is outside our control, so only share material you have the right to pass on.'
                    },
                    {
                      title: '8. Availability',
                      body: 'FOLIO Studio is provided on an "as available" basis. Cloud sync, storage and AI features depend on third-party services that may be interrupted, and features may change or be withdrawn. Keep your own backups of anything important — the Settings page can export a full snapshot at any time.'
                    },
                    {
                      title: '9. Changes to These Terms',
                      body: 'We may update these terms as the workspace evolves. The version and date at the top of this page always reflect the current agreement, and continued use after an update means you accept it.'
                    },
                  ].map((section) => (
                    <div key={section.title} className="space-y-1.5">
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        {section.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {section.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900">Questions about these terms?</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Reach the workspace administrator at support@folio.edu
                    </span>
                  </div>
                  <button
                    onClick={() => goToTab('settings', { section: 'storage' })}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <HardDrive className="w-4 h-4 text-slate-600" />
                    <span>Storage &amp; backup</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* PRIVACY POLICY TAB */}
          {activeTab === 'privacy' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="p-4 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-6">

                {/* Header */}
                <div className="flex items-start gap-3 pb-5 border-b border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      What FOLIO Studio collects, where it is stored, and the control you keep over it
                    </p>
                    <p className="text-[11px] font-mono font-bold text-slate-400 mt-2">
                      Last updated: 19 August 2026 &bull; Version 1.0
                    </p>
                  </div>
                </div>

                {/* Data summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Account', value: 'Name, email, USN, branch, semester', icon: User },
                    { label: 'Documents', value: 'Files you upload and their extracted text', icon: FileText },
                    { label: 'On this device', value: 'Search index, study streak, preferences', icon: HardDrive },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <item.icon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1.5 leading-relaxed">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Sections */}
                <div className="space-y-5">
                  {[
                    {
                      title: '1. What We Collect',
                      body: 'Account details you provide (name, email, USN, branch, semester and avatar), the documents you upload along with the text extracted from them, and the study activity that powers your streak, analytics and weak spot reports. We do not collect your location, your contacts, or anything from outside the workspace.'
                    },
                    {
                      title: '2. Where Your Data Lives',
                      body: 'Your profile, folders and documents are stored in Google Firebase (Firestore and Cloud Storage) under your own user id. Firestore security rules isolate every account, so no other student can read your files. Your search index, study streak and workspace preferences never leave this browser.'
                    },
                    {
                      title: '3. How the AI Assistant Uses Your Notes',
                      body: 'Retrieval happens locally: your documents are indexed in this browser and the matching passages are selected here. When you send a question, that question and the matched passages are transmitted to the configured AI provider to compose the answer. Turn the assistant off simply by not using AI Studio; your notes stay indexed for search either way.'
                    },
                    {
                      title: '4. Auto-Tagging & Uploads',
                      body: 'If auto-tagging is enabled in Settings, the filename and a short text sample from each upload are sent to the AI provider to suggest a subject folder and topic tags. Disable the toggle in Settings and every upload is filed exactly where you put it, with nothing sent anywhere.'
                    },
                    {
                      title: '5. What We Never Do',
                      body: 'We do not sell your data, we do not show you advertising, we do not share your documents with other students or institutions, and we do not use your coursework to train AI models.'
                    },
                    {
                      title: '6. Sharing Is Always Your Choice',
                      body: 'Folders and AI conversations leave the workspace only when you choose to share them, and only through the channel you pick. Once shared, the content is in the recipient hands and can no longer be recalled by FOLIO.'
                    },
                    {
                      title: '7. Retention & Deletion',
                      body: 'Deleted items sit in the Trash bin until you restore them or delete them permanently. Permanent deletion removes the file, its stored copy and its search embeddings. Deleting your account from the Profile page removes your profile and documents; local data clears when you clear this browser storage.'
                    },
                    {
                      title: '8. Your Rights',
                      body: 'You can view and edit your profile at any time, export a complete JSON snapshot of your workspace from Settings, and delete individual documents, whole folders or your entire account. If you need a copy of everything we hold, the export in Settings is the fastest route.'
                    },
                    {
                      title: '9. Changes to This Policy',
                      body: 'If what we collect or how we use it changes, this page and its version date are updated first. Continued use after an update means you accept the revised policy.'
                    },
                  ].map((section) => (
                    <div key={section.title} className="space-y-1.5">
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        {section.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {section.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900">Want a copy of your data?</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Export a full workspace snapshot, or reach us at privacy@folio.edu
                    </span>
                  </div>
                  <button
                    onClick={handleBackupFiles}
                    disabled={isBackingUp}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer shrink-0 self-start sm:self-auto disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>{isBackingUp ? 'Preparing...' : 'Export my data'}</span>
                  </button>
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
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Trash Bin & File Recovery</h1>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Deleted files are safely kept here. Restore items back to your subject folders or permanently remove them.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-500">
                    {trashCount} {trashCount === 1 ? 'item' : 'items'} in Trash
                  </span>
                  {trashCount > 0 && (
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

              {/* Trashed Folders Listing */}
              {trashedFolders.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    Deleted Folders ({trashedFolders.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trashedFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                            <FolderClosed className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate" title={folder.name}>
                              {folder.name}
                            </h4>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              <span className="font-mono font-bold text-slate-600">{folder.code}</span>
                              {' • '}
                              {(folder.trashedFileIds || []).length} file{(folder.trashedFileIds || []).length === 1 ? '' : 's'} trashed with it
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-400">Folder</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestoreFolder(folder)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-all"
                              title="Restore folder and its documents"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => setPermanentFolderTarget(folder)}
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

              {/* Trashed Files Listing */}
              {trashCount === 0 ? (
                <div className="p-12 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Trash is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you delete notes or documents from your library, they will appear here before being permanently removed.
                  </p>
                </div>
              ) : trashedFiles.length === 0 ? null : (
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
              Are you sure you want to permanently delete all <span className="font-bold text-slate-900">{trashCount} {trashCount === 1 ? 'item' : 'items'}</span> from Trash?
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-6 animate-in fade-in duration-200">
          <div className={`w-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden transition-all ${isReaderFullscreen ? 'h-full w-full max-w-none rounded-none' : 'h-[92dvh] sm:h-[90vh] max-w-5xl'
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
            <div className="p-3 sm:p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 font-bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">{readingFile.title}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate">In-App Reader • {readingFile.size} • Source: {readingFile.source}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {!readingFile.fileUrl && (
                  <button
                    onClick={() => handleCopySnippet(readingFile.contentSnippet || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-slate-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedSnippet ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownloadToDevice(readingFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-slate-900 text-xs font-black transition-all cursor-pointer shadow-sm hover:bg-slate-100"
                  title="Download File to Local Explorer"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  onClick={() => handleDeleteFile(readingFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Move document to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trash</span>
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
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
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
                onClick={() => setIsUploadModalOpen(false)}
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

      {/* DELETE SUBJECT FOLDER CONFIRMATION (soft delete) */}
      {deletingFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="font-bold text-sm">Move folder to Trash?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              <span className="font-bold text-slate-900">{deletingFolderTarget.name}</span> and the{' '}
              <span className="font-bold text-slate-900">
                {files.filter(f => f.folderId === deletingFolderTarget.id).length}
              </span>{' '}
              document{files.filter(f => f.folderId === deletingFolderTarget.id).length === 1 ? '' : 's'} inside it will move to Trash together.
            </p>

            <ul className="text-[11px] text-slate-500 space-y-1 mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <li>• Sidebar Trash counter increases</li>
              <li>• Dashboard folder metrics decrease</li>
              <li>• RAG embeddings for this subject are cleared from the index</li>
              <li>• Everything can be restored from the Trash bin</li>
            </ul>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingFolderTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => performSoftDeleteFolders([deletingFolderTarget])}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="font-bold text-sm">Move {selectedFolders.length} folders to Trash?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              This moves{' '}
              <span className="font-bold text-slate-900">
                {files.filter(f => selectedFolderIds.includes(f.folderId)).length}
              </span>{' '}
              document{files.filter(f => selectedFolderIds.includes(f.folderId)).length === 1 ? '' : 's'} to Trash and clears their RAG embeddings. You can restore everything later.
            </p>

            <div className="max-h-28 overflow-y-auto text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5 space-y-1">
              {selectedFolders.map(f => (
                <div key={f.id} className="truncate">• {f.name} <span className="font-mono text-slate-400">{f.code}</span></div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => performSoftDeleteFolders(selectedFolders)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT FOLDER DELETE CONFIRMATION */}
      {permanentFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="font-bold text-sm">Delete folder forever?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              <span className="font-bold text-slate-900">{permanentFolderTarget.name}</span> and every document stored inside it will be erased from Firebase.
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mb-5">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPermanentFolderTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDeleteFolder(permanentFolderTarget)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE FOLDER MODAL */}
      {shareFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900 min-w-0">
                <Share2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate">Share &quot;{shareFolderTarget.name}&quot;</span>
              </h3>
              <button
                onClick={() => setShareFolderTarget(null)}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium max-h-32 overflow-y-auto whitespace-pre-wrap">
                {buildFolderShareText(shareFolderTarget)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShareFolderVia(shareFolderTarget, 'whatsapp')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShareFolderVia(shareFolderTarget, 'email')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>

                <button
                  onClick={() => handleShareFolderVia(shareFolderTarget, 'copy')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {shareCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
                  <span>{shareCopied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleShareFolderVia(shareFolderTarget, 'native')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>More apps</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-medium text-center">
                Your friend receives the folder summary plus a direct link. They will need access to your FOLIO workspace to open the documents.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SHARE AI CHAT MODAL */}
      {isShareChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Share this AI thread</span>
              </h3>
              <button
                onClick={() => setIsShareChatOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium max-h-40 overflow-y-auto whitespace-pre-wrap">
                {ShareKit.buildChatTranscript(chatMessages, studentProfile.name)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleShareChat('whatsapp')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShareChat('copy')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>

                <button
                  onClick={() => handleShareChat('native')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>More</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTACH A FOLIO DOCUMENT TO THE CHAT */}
      {isFilePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <FolderOpen className="w-4 h-4 text-slate-700" />
                <span>Attach from your folders</span>
              </h3>
              <button
                onClick={() => setIsFilePickerOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {files.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No documents stored yet</p>
                <button
                  onClick={() => { setIsFilePickerOpen(false); setIsUploadModalOpen(true); }}
                  className="text-xs font-bold text-slate-900 underline underline-offset-2 cursor-pointer"
                >
                  Upload your first file
                </button>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                {folders.map(folder => {
                  const folderFiles = files.filter(f => f.folderId === folder.id);
                  if (folderFiles.length === 0) return null;
                  return (
                    <div key={folder.id} className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 pt-2">
                        {folder.name}
                      </div>
                      {folderFiles.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => handleAttachFolioFile(doc)}
                          className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{formatFileTitle(doc.title)}</div>
                              <div className="text-[10px] font-mono text-slate-400">{doc.size}</div>
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* SIGNING OUT OVERLAY */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 text-center animate-in fade-in duration-200">

          {/* Same animated gradient backdrop as the sign-in screen */}
          <AnimatedGradientBackground Breathing />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] bg-blue-500/25 rounded-full blur-[120px] pointer-events-none" />

          <GlassCard className="relative z-10 w-full max-w-sm items-center gap-5 rounded-3xl px-6 py-8 border-white/25 bg-gradient-to-br from-white/30 via-white/10 to-white/20 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_70px_-20px_rgba(2,6,23,0.75)] ring-1 ring-inset ring-white/10 overflow-hidden">
            <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            <FolioMark size={56} className="relative z-10 rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse" />

            <div className="relative z-10 space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Logging out, {profileFirstName}...
              </h2>
              <p className="text-xs font-medium text-slate-200/80 max-w-xs mx-auto">
                Your notes, folders and study streak are saved. See you at your next session.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-300/70">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              <span>Closing workspace</span>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
    </MagneticCursor>
  );
}
