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
  Moon
} from 'lucide-react';

export type WebNavItem = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
};

export default function DesktopWebApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! I am your local Ollama AI study assistant. Ask me questions about your uploaded documents or subject notes." }
  ]);
  const [chatInput, setChatInput] = useState('');

  const navItems: WebNavItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutGrid },
    { id: 'home', title: 'Home', icon: Home },
    { id: 'analytics', title: 'Analytics', icon: BarChart2 },
    { id: 'ai-studio', title: 'AI Studio', icon: Bot, badge: 'RAG' },
    { id: 'profile', title: 'Profile', icon: User },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: q }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: `[Ollama Llama 3.2] Answer generated for: "${q}". Context retrieved from Unit-1_IP_Addressing_Notes.pdf` }
      ]);
    }, 500);
  };

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden antialiased transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0b0e14] text-white selection:bg-purple-600 selection:text-white' 
        : 'bg-slate-100 text-slate-900 selection:bg-slate-800 selection:text-white'
    }`}>
      
      {/* Sleek Sidebar (Supports Dark & Light Mode with proper collapsed icon alignments) */}
      <aside 
        className={`relative h-full flex flex-col justify-between p-4 transition-all duration-300 z-20 ${
          isDarkMode 
            ? 'bg-[#121620] border-r border-slate-800/80' 
            : 'bg-white border-r border-slate-200 shadow-sm'
        } ${isSidebarCollapsed ? 'w-20 items-center' : 'w-64'}`}
      >
        <div className="w-full">
          {/* Brand Header */}
          <div className={`flex items-center pb-6 mb-4 border-b ${
            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
          } ${isSidebarCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-lg text-white shadow-lg shrink-0">
                L
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
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Main Nav Items */}
          <nav className="space-y-1.5 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.title : undefined}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
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

        {/* Bottom Section with Replaced Order (Account Above, Logout Below) */}
        <div className={`pt-4 border-t w-full space-y-3 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
          {/* User Profile Footer (PLACED ABOVE LOGOUT) */}
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'px-1'}`}>
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              JD
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>John Doe</span>
                <span className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>john@example.com</span>
              </div>
            )}
          </div>

          {/* Logout Button (PLACED AT THE VERY BOTTOM) */}
          <button 
            title={isSidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-900/30 hover:opacity-95 transition-opacity ${
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
            {/* Dark Mode / Light Mode Toggle Button */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                isDarkMode 
                  ? 'bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-200/80 text-slate-800 border-slate-300 hover:bg-slate-300'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Upload Notes Action Button */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
              <Upload className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              
              {/* Hero Banner */}
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
                    Welcome back, John Doe
                  </h1>
                  <p className={`text-sm mt-2 max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Organize your academic resources from WhatsApp, Telegram, Google Classroom & PDFs with local RAG Q&A.
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

              {/* Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
                  isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Notes</span>
                    <div className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>24</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-colors ${
                  isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Subjects</span>
                    <div className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>6</div>
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

              {/* Recent Documents Table */}
              <div className={`p-6 rounded-2xl border shadow-xs transition-colors ${
                isDarkMode ? 'bg-[#121620] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Documents & Academic Notes</h3>
                  <button className="text-xs font-semibold text-purple-600 hover:text-purple-500">View All</button>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Unit-1_IP_Addressing_Notes.pdf', subject: 'Computer Networks', source: 'WhatsApp', size: '1.0 MB', date: 'Today' },
                    { title: 'Relational_Algebra_Assignment.pdf', subject: 'Database Management', source: 'Google Classroom', size: '2.0 MB', date: 'Yesterday' },
                    { title: 'Machine_Learning_Lab_Manual.pdf', subject: 'Machine Learning', source: 'Direct Upload', size: '3.4 MB', date: '3 days ago' },
                  ].map((doc, idx) => (
                    <div 
                      key={idx} 
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
                          <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{doc.subject} • {doc.source}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{doc.size}</span>
                        <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{doc.date}</span>
                        <button className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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

              {/* Chat Messages Log */}
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

              {/* Chat Input */}
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
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
