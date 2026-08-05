import React, { useState } from 'react';
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
  Zap,
  MoreVertical,
  Sun,
  Moon,
  X,
  FolderPlus,
  Plus,
  ArrowLeft,
  GraduationCap,
  Hash,
  BookOpen,
  Eye,
  Download,
  FolderOpen,
  Maximize2,
  Minimize2,
  File
} from 'lucide-react';

export type WebNavItem = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
};

export interface SubjectFolder {
  id: string;
  name: string;
  code: string;
  description: string;
  fileCount: number;
}

export interface AcademicFile {
  id: string;
  title: string;
  folderId: string;
  source: string;
  size: string;
  date: string;
  fileUrl?: string;
  contentSnippet?: string;
  fileType?: 'pdf' | 'text' | 'doc';
}

export default function DesktopWebApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

  // Folder Opening & In-App Reader State
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState<AcademicFile | null>(null);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);

  // Student Profile State
  const [studentProfile, setStudentProfile] = useState({
    name: 'John Doe',
    role: 'Student',
    usn: '1FA21CS042',
    sem: '6th Semester',
    branch: 'Computer Science & Engineering',
    email: 'john.doe@folio.edu'
  });

  // Dynamic Folders State
  const [folders, setFolders] = useState<SubjectFolder[]>([
    { id: 'f-cn', name: 'Computer Networks', code: 'CS301', description: 'OSI layers, TCP/IP, IP addressing notes', fileCount: 4 },
    { id: 'f-dbms', name: 'Database Management', code: 'CS302', description: 'SQL queries, ER diagrams, Normalization', fileCount: 3 },
    { id: 'f-ml', name: 'Machine Learning', code: 'CS401', description: 'Supervised algorithms & lab manuals', fileCount: 5 }
  ]);

  // Dynamic Files State
  const [files, setFiles] = useState<AcademicFile[]>([
    { 
      id: 'doc-1', 
      title: 'Unit-1_IP_Addressing_Notes.pdf', 
      folderId: 'f-cn', 
      source: 'WhatsApp', 
      size: '1.0 MB', 
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
X_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target, test.size=0.2)
clf = DecisionTreeClassifier(criterion='entropy')
clf.fit(X_train, y_train)
print("Model Accuracy:", clf.score(X_test, y_test))`
    }
  ]);

  // Form States
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-cn');
  const [selectedSource, setSelectedSource] = useState<string>('Direct Upload');

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! I am your local Ollama AI study assistant. Ask me questions about your uploaded documents or subject notes." }
  ]);
  const [chatInput, setChatInput] = useState('');

  const navItems: WebNavItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutGrid },
    { id: 'home', title: 'Home (Subject Folders)', icon: Home },
    { id: 'analytics', title: 'Analytics', icon: BarChart2 },
    { id: 'ai-studio', title: 'AI Studio', icon: Bot, badge: 'RAG' },
    { id: 'profile', title: 'Profile', icon: User },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  // Create New Subject Folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: SubjectFolder = {
      id: `f-${Date.now()}`,
      name: newFolderName,
      code: newFolderCode || 'CS-GEN',
      description: newFolderDesc || 'Subject academic resource folder',
      fileCount: 0
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setNewFolderCode('');
    setNewFolderDesc('');
    setIsCreateFolderModalOpen(false);
  };

  // Upload File via Browser File Picker
  const handleUploadFileSubmit = () => {
    if (!selectedUploadFile) {
      alert("Please browse and select a file from your device first.");
      return;
    }

    const isPdf = selectedUploadFile.name.toLowerCase().endsWith('.pdf');
    const localBlobUrl = URL.createObjectURL(selectedUploadFile);
    const fileSizeMb = (selectedUploadFile.size / (1024 * 1024)).toFixed(1);

    const newFile: AcademicFile = {
      id: `doc-${Date.now()}`,
      title: selectedUploadFile.name,
      folderId: selectedFolderId,
      source: selectedSource,
      size: `${fileSizeMb} MB`,
      date: 'Just now',
      fileType: isPdf ? 'pdf' : 'text',
      fileUrl: localBlobUrl,
      contentSnippet: `Document content loaded for ${selectedUploadFile.name}. Extracted via Apache Tika parser.`
    };

    setFiles(prev => [newFile, ...prev]);

    setFolders(prev => prev.map(f => {
      if (f.id === selectedFolderId) {
        return { ...f, fileCount: f.fileCount + 1 };
      }
      return f;
    }));

    setSelectedUploadFile(null);
    setIsUploadModalOpen(false);
  };

  // Native Device File Download Trigger
  const handleDownloadToDevice = (doc: AcademicFile) => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blob = new Blob([doc.contentSnippet || ''], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: q }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: `[Ollama Llama 3.2] Answer generated for: "${q}". Context retrieved from uploaded subject files.` }
      ]);
    }, 500);
  };

  const currentOpenedFolder = folders.find(f => f.id === openedFolderId);
  const currentOpenedFolderFiles = files.filter(f => f.folderId === openedFolderId);

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden antialiased transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0b0e14] text-white selection:bg-purple-600 selection:text-white' 
        : 'bg-slate-100 text-slate-900 selection:bg-slate-800 selection:text-white'
    }`}>
      
      {/* Sidebar */}
      <aside 
        className={`relative h-full flex flex-col justify-between p-4 transition-all duration-300 z-20 ${
          isDarkMode 
            ? 'bg-[#121620] border-r border-slate-800/80' 
            : 'bg-white border-r border-slate-200 shadow-sm'
        } ${isSidebarCollapsed ? 'w-20 items-center' : 'w-64'}`}
      >
        <div className="w-full">
          <div className={`flex items-center pb-6 mb-4 border-b ${
            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
          } ${isSidebarCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-lg text-white shadow-lg shrink-0">
                F
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <span className={`font-bold text-lg tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>FOLIO</span>
                  <span className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Smart Studio</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-1.5 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setOpenedFolderId(null);
                  }}
                  title={isSidebarCollapsed ? item.title : undefined}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md shadow-purple-900/20' 
                      : isDarkMode 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                    {!isSidebarCollapsed && <span>{item.title}</span>}
                  </div>

                  {!isSidebarCollapsed && item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={`pt-4 border-t w-full space-y-3 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div 
            className={`flex items-center gap-3 cursor-pointer p-1.5 rounded-xl transition-colors ${
              activeTab === 'profile' ? 'bg-purple-600/20 border border-purple-500/30' : isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`} 
            onClick={() => {
              setActiveTab('profile');
              setOpenedFolderId(null);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              JD
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{studentProfile.name}</span>
                <span className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{studentProfile.usn}</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => alert("Logged out!")}
            title={isSidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-900/30 hover:opacity-95 transition-opacity cursor-pointer ${
              isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <LogOut className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Logout</span>}
            </div>
            {!isSidebarCollapsed && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 transition-colors ${
          isDarkMode 
            ? 'bg-[#121620]/60 border-slate-800/80' 
            : 'bg-white/80 border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className={`absolute left-3.5 top-3 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <input 
                type="text" 
                placeholder="Search notes, subjects, or ask AI..."
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-[#1a1f2c] border-slate-800 text-white placeholder:text-slate-500 focus:border-purple-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-800'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-200/80 text-slate-800 border-slate-300 hover:bg-slate-300'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div className={`p-8 rounded-2xl border flex items-center justify-between shadow-xl transition-colors ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800' 
                  : 'bg-gradient-to-r from-white via-slate-50 to-white border-slate-200 shadow-md'
              }`}>
                <div>
                  <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-700'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                    <span>AI Study Workspace</span>
                  </div>
                  <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Welcome back, {studentProfile.name}
                  </h1>
                  <p className={`text-sm mt-2 max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    USN: {studentProfile.usn} • {studentProfile.branch} ({studentProfile.sem})
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-center gap-4 ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-500">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>RAG Engine</div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Llama 3.2 Ollama</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
                  isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Notes</span>
                    <div className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{files.length}</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
                  isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Subject Folders</span>
                    <div className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{folders.length}</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                    <FolderClosed className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
                  isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI Queries</span>
                    <div className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>148</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border shadow-xs transition-colors ${
                isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Documents & Academic Notes</h3>
                  <button onClick={() => setActiveTab('home')} className="text-xs font-semibold text-purple-500 hover:underline cursor-pointer">
                    Browse Folders →
                  </button>
                </div>

                <div className="space-y-3">
                  {files.map((doc) => {
                    const parentFolder = folders.find(f => f.id === doc.folderId);
                    return (
                      <div 
                        key={doc.id} 
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isDarkMode 
                            ? 'bg-[#1a1f2c]/50 border-slate-800/60 hover:border-purple-500/40' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{doc.title}</div>
                            <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {parentFolder ? parentFolder.name : 'General'} • Source: {doc.source}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleDownloadToDevice(doc)}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                            title="Download File to Device Explorer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setReadingFile(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Read In-App</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* HOME TAB: Subject Folders Page */}
          {activeTab === 'home' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              
              {/* IF A FOLDER IS OPENED */}
              {openedFolderId && currentOpenedFolder ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setOpenedFolderId(null)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                          isDarkMode ? 'bg-[#1a1f2c] border-slate-800 text-white hover:bg-slate-800' : 'bg-slate-200 border-slate-300 text-slate-900'
                        }`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Folders</span>
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {currentOpenedFolder.name}
                          </h1>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-purple-500/20 text-purple-400">
                            {currentOpenedFolder.code}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {currentOpenedFolder.description}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedFolderId(currentOpenedFolder.id);
                        setIsUploadModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload File to this Folder</span>
                    </button>
                  </div>

                  {/* Folder Contents Files List */}
                  <div className={`p-6 rounded-2xl border shadow-xs transition-colors ${
                    isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className={`text-base font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Documents in {currentOpenedFolder.name} ({currentOpenedFolderFiles.length})
                    </h3>

                    {currentOpenedFolderFiles.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        <FolderOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                        <p>No documents uploaded in this folder yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentOpenedFolderFiles.map((doc) => (
                          <div 
                            key={doc.id} 
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                              isDarkMode ? 'bg-[#1a1f2c]/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{doc.title}</div>
                                <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Source: {doc.source} • Added: {doc.date}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleDownloadToDevice(doc)}
                                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                                  isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-700'
                                }`}
                                title="Download File to Device File Explorer"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setReadingFile(doc)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read In-App</span>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Subject Folders</h1>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Click on any folder to open and view its uploaded documents.
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsCreateFolderModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>Create Subject Folder</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {folders.map((folder) => {
                      const folderFiles = files.filter(f => f.folderId === folder.id);
                      return (
                        <div 
                          key={folder.id} 
                          onClick={() => setOpenedFolderId(folder.id)}
                          className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                            isDarkMode 
                              ? 'bg-[#121620] border-slate-800 hover:border-purple-500/60 hover:bg-[#161c28]' 
                              : 'bg-white border-slate-200 shadow-sm hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                              <FolderClosed className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-500/20 text-purple-400">
                              {folder.code}
                            </span>
                          </div>

                          <h3 className={`text-lg font-bold group-hover:text-purple-400 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {folder.name}
                          </h3>
                          <p className={`text-xs mt-1.5 min-h-[36px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {folder.description}
                          </p>

                          <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs">
                            <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {folderFiles.length} File{folderFiles.length === 1 ? '' : 's'}
                            </span>
                            <span className="font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              <span>Open Folder</span>
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className={`p-8 rounded-2xl border shadow-xl ${
                isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-5 pb-6 mb-6 border-b border-slate-800/80">
                  <div className="w-20 h-20 rounded-full bg-emerald-500 text-black font-black text-2xl flex items-center justify-center shadow-lg">
                    JD
                  </div>
                  <div>
                    <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{studentProfile.name}</h2>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{studentProfile.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                      {studentProfile.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Student Information Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User className="w-4 h-4 text-purple-400" />
                        <span>Full Name</span>
                      </div>
                      <div className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {studentProfile.name}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <GraduationCap className="w-4 h-4 text-purple-400" />
                        <span>Role</span>
                      </div>
                      <div className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {studentProfile.role}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Hash className="w-4 h-4 text-purple-400" />
                        <span>USN</span>
                      </div>
                      <div className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {studentProfile.usn}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span>Semester (SEM)</span>
                      </div>
                      <div className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {studentProfile.sem}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border md:col-span-2 ${isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FolderClosed className="w-4 h-4 text-purple-400" />
                        <span>Branch</span>
                      </div>
                      <div className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {studentProfile.branch}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-studio' && (
            <div className={`h-[calc(100vh-140px)] max-w-4xl mx-auto flex flex-col border rounded-2xl overflow-hidden shadow-xl ${
              isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-500 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ollama RAG AI Assistant</h3>
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ask questions over uploaded lecture notes</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none shadow-md'
                          : isDarkMode
                            ? 'bg-[#1a1f2c] border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                            : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-4 border-t flex items-center gap-3 ${
                isDarkMode ? 'bg-[#1a1f2c] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask a question from your documents..."
                  className={`flex-1 px-4 py-3 border rounded-xl text-xs outline-none focus:border-purple-500 ${
                    isDarkMode ? 'bg-[#0b0e14] border-slate-800 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <button 
                  onClick={handleSendChat}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-[#121620] border border-slate-800 text-center">
              <h2 className="text-xl font-bold text-white mb-2">Academic Analytics</h2>
              <p className="text-xs text-slate-400">Track study time, document access frequency, and Ollama RAG query insights.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#121620] border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Workspace Settings</h2>
              <div className="p-4 rounded-xl bg-[#1a1f2c] border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white">Ollama Endpoint</div>
                  <div className="text-slate-400">http://localhost:11434</div>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-md">Connected</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FULL IN-APP DOCUMENT / PDF READER MODAL */}
      {readingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className={`w-full flex flex-col bg-[#121620] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all ${
            isReaderFullscreen ? 'h-full w-full max-w-none rounded-none' : 'h-[90vh] max-w-5xl'
          }`}>
            
            {/* Reader Header */}
            <div className="p-4 bg-[#1a1f2c] border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{readingFile.title}</h3>
                  <p className="text-xs text-slate-400">In-App Reader • {readingFile.size} • Source: {readingFile.source}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadToDevice(readingFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Download File to File Explorer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>

                <button 
                  onClick={() => setIsReaderFullscreen(!isReaderFullscreen)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isReaderFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button 
                  onClick={() => setReadingFile(null)} 
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Content Body */}
            <div className="flex-1 bg-[#0b0e14] overflow-hidden p-2">
              {readingFile.fileUrl ? (
                /* PDF / Document Embed Viewer */
                <iframe 
                  src={readingFile.fileUrl}
                  className="w-full h-full rounded-xl border-0"
                  title={readingFile.title}
                />
              ) : (
                /* Rich Text Reading Layout */
                <div className="h-full overflow-y-auto p-8 max-w-3xl mx-auto bg-[#121620] border border-slate-800 rounded-xl shadow-lg text-slate-200 font-mono text-xs leading-relaxed space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 font-sans">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Document Text Reader</span>
                    <span className="text-xs text-slate-500">{readingFile.title}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#121620] border border-slate-800 rounded-2xl p-6 shadow-2xl text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-purple-400" />
                <span>Create New Subject Folder</span>
              </h3>
              <button onClick={() => setIsCreateFolderModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subject Name</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Subject Code</label>
                <input 
                  type="text" 
                  value={newFolderCode}
                  onChange={(e) => setNewFolderCode(e.target.value)}
                  placeholder="e.g. CS303"
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea 
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="Brief description of notes inside..."
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsCreateFolderModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleCreateFolder} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD NOTES FILE & SELECT FOLDER MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#121620] border border-slate-800 rounded-2xl p-6 shadow-2xl text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Upload Study Document</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select File from Device</label>
                <input 
                  type="file" 
                  onChange={(e) => setSelectedUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-slate-800 rounded-xl text-white text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Add to Subject Folder</label>
                <select 
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ingestion Source Channel</label>
                <select 
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0b0e14] border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
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
              <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleUploadFileSubmit} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
                Upload & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
