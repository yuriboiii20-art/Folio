import React, { useState } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings, 
  LogOut,
  Hash,
  ChevronDown,
  ChevronRight,
  Inbox,
  Calendar,
  Activity,
  CreditCard,
  Globe,
  Terminal,
  Blocks,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X
} from 'lucide-react';

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const mockNavGroups: NavGroupData[] = [
  {
    items: [
      { id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' },
      { id: 'home', title: 'Dashboard', icon: LayoutDashboard },
      { id: 'inbox', title: 'Notes Inbox', icon: Inbox, badge: 12 },
      { id: 'analytics', title: 'Analytics', icon: Activity },
    ]
  },
  {
    heading: 'Academic Workspace',
    items: [
      { 
        id: 'projects', 
        title: 'Subjects', 
        icon: FolderKanban,
        children: [
          { id: 'p-networks', title: 'Computer Networks', icon: Hash },
          { id: 'p-dbms', title: 'Database Systems', icon: Hash },
          { id: 'p-ml', title: 'Machine Learning', icon: Hash },
        ]
      },
      { id: 'calendar', title: 'Schedule', icon: Calendar },
      { 
        id: 'team', 
        title: 'Study Groups', 
        icon: Users,
        children: [
          { id: 't-design', title: 'CS Peer Group', icon: Hash },
          { id: 't-eng', title: 'Lab Partners', icon: Hash },
        ]
      },
      { id: 'finance', title: 'Integrations', icon: CreditCard },
    ]
  },
  {
    heading: 'AI & Developer',
    items: [
      { id: 'api', title: 'Ollama RAG API', icon: Terminal },
      { id: 'webhooks', title: 'Integrations', icon: Blocks },
    ]
  }
];

const mockBottomItems: NavItemData[] = [
  { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
  { id: 'logout', title: 'Log out', icon: LogOut },
];

function WorkspaceSwitcher({ selected, onSelect }: { selected?: string, onSelect?: (ws: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState('FOLIO Studio');
  
  const current = selected || internalSelected;
  const handleSelect = onSelect || setInternalSelected;

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2.5 py-2 mb-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors select-none group border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-semibold leading-none mb-1 text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{current}</span>
            <span className="text-[11px] text-slate-500 leading-none">Academic Workspace</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {['FOLIO Studio', 'Personal Notes', 'Research Vault'].map(ws => (
              <div 
                key={ws}
                onClick={() => { handleSelect(ws); setIsOpen(false); }}
                className={`px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors ${current === ws ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-950/50 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {ws}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ 
  item, 
  activeId, 
  onSelect,
  level = 0
}: { 
  item: NavItemData; 
  activeId: string; 
  onSelect: (id: string) => void;
  level?: number;
}) {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-md cursor-pointer transition-all duration-150 select-none
          ${isActive 
            ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/50 dark:text-indigo-300' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon 
            className={`w-[16px] h-[16px] transition-colors
              ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
            `} 
            strokeWidth={1.5} 
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {item.shortcut && (
             <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
               {item.shortcut}
             </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight 
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div 
              className="absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-800"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map(child => (
              <NavItem 
                key={child.id} 
                item={child} 
                activeId={activeId} 
                onSelect={onSelect} 
                level={level + 1} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ 
  className = '',
  activeId,
  onSelect,
  activeWorkspace,
  onWorkspaceSelect
}: { 
  className?: string,
  activeId?: string,
  onSelect?: (id: string) => void,
  activeWorkspace?: string,
  onWorkspaceSelect?: (ws: string) => void
}) {
  const [internalId, setInternalId] = useState('home');
  const currentId = activeId !== undefined ? activeId : internalId;
  const handleSelect = onSelect || setInternalId;

  return (
    <div className={`flex flex-col w-[260px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 font-sans ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
        {mockNavGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map(item => (
              <NavItem 
                key={item.id} 
                item={item} 
                activeId={currentId} 
                onSelect={handleSelect} 
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
        {mockBottomItems.map(item => (
          <NavItem 
            key={item.id} 
            item={item} 
            activeId={currentId} 
            onSelect={handleSelect} 
          />
        ))}
      </div>
    </div>
  );
}

const allItems = [...mockNavGroups.flatMap(g => g.items), ...mockBottomItems];
const flattenItems = (items: NavItemData[]): NavItemData[] => {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) acc.push(...flattenItems(item.children));
    return acc;
  }, [] as NavItemData[]);
};
const flatMockData = flattenItems(allItems);

export default function SidebarNavPreview() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState('home');
  const [activeWorkspace, setActiveWorkspace] = useState('FOLIO Studio');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeItem = flatMockData.find(i => i.id === activeId);
  const activeTitle = activeItem ? activeItem.title : 'Dashboard';

  const handleSelect = (id: string) => {
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    setActiveId(id);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      
      <div className="relative w-full max-w-6xl h-[780px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden shadow-xl">
        
        <div 
          className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${
            isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'
          }`}
        >
          <SidebarNav 
            className="w-[260px] border-none bg-transparent" 
            activeId={activeId}
            onSelect={handleSelect}
            activeWorkspace={activeWorkspace}
            onWorkspaceSelect={setActiveWorkspace}
          />
        </div>
        
        <div className="flex-1 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col min-w-0 transition-all duration-300">
           
           <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between bg-white dark:bg-slate-900 shrink-0">
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsOpen(!isOpen)}
                 className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors"
               >
                 {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
               </button>
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <span className="truncate">{activeWorkspace}</span>
                 <span>/</span>
                 <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{activeTitle}</span>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="w-64 h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hidden md:flex items-center px-3 text-xs text-slate-400 gap-2">
                 <Search className="w-3.5 h-3.5" />
                 <span>Search documents, notes...</span>
               </div>
               <div className="w-8 h-8 bg-indigo-100 text-indigo-700 font-bold rounded-full border border-indigo-200 flex items-center justify-center text-xs">
                 YA
               </div>
             </div>
           </div>

           <div className="p-6 md:p-8 overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Academic Notes & Storage</h2>
                 <p className="text-xs text-slate-500 mt-1">Organize lecture notes, PDFs, and interact via local Ollama RAG AI.</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
               <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase">Uploaded Notes</span>
                 <div className="flex items-baseline gap-2 mt-2">
                   <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">12</span>
                   <span className="text-xs text-emerald-600 font-medium">+2 this week</span>
                 </div>
               </div>
               <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase">Active Subjects</span>
                 <div className="flex items-baseline gap-2 mt-2">
                   <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">4</span>
                   <span className="text-xs text-slate-500">CS Core</span>
                 </div>
               </div>
               <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-xs flex flex-col justify-between">
                 <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Local AI Model</span>
                 <div className="flex items-baseline gap-2 mt-2">
                   <span className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200">Llama 3.2</span>
                   <span className="text-xs text-indigo-600 font-semibold">Active RAG</span>
                 </div>
               </div>
             </div>

             <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Notes & Uploads</h3>
                
                <div className="flex flex-col gap-3">
                  {[
                    { title: 'Unit-1_IP_Addressing_Notes.pdf', sub: 'Computer Networks • WhatsApp', size: '1.0 MB' },
                    { title: 'Relational_Algebra_Assignment.pdf', sub: 'Database Systems • Classroom', size: '2.0 MB' },
                    { title: 'Linear_Regression_Lab.docx', sub: 'Machine Learning • Direct Upload', size: '850 KB' }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          PDF
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{doc.sub}</div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400">{doc.size}</span>
                    </div>
                  ))}
               </div>
             </div>
           </div>
        </div>

        {isSearchOpen && (
          <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/30 backdrop-blur-xs px-4">
            <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
                <Search className="w-[18px] h-[18px] text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
                <input 
                  autoFocus
                  className="flex-1 bg-transparent py-4 outline-none text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  placeholder="Search projects, docs, or actions..."
                />
                <kbd 
                  onClick={() => setIsSearchOpen(false)}
                  className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded cursor-pointer"
                >
                  ESC
                </kbd>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-3 p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors"
                >
                  <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-2 py-8 flex flex-col items-center justify-center">
                 <Command className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" strokeWidth={1.5} />
                 <p className="text-[13px] text-slate-400 font-medium">Type a command or search...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
