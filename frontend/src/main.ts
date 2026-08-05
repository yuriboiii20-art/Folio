// API Client Base URL
const API_BASE = 'http://localhost:8080/api/v1';

interface Subject {
  id: number;
  name: String;
  code: String;
  colorHex: String;
}

interface Document {
  id: number;
  filename: string;
  originalName: string;
  source: string;
  fileSize: number;
  createdAt: string;
}

// Initial Mock Datasets fallback if backend server isn't active
let mockSubjects: Subject[] = [
  { id: 1, name: 'Computer Networks', code: 'CS301', colorHex: '#6366f1' },
  { id: 2, name: 'Database Management', code: 'CS302', colorHex: '#ec4899' },
  { id: 3, name: 'Machine Learning', code: 'CS401', colorHex: '#10b981' }
];

let mockDocs: Document[] = [
  { id: 101, filename: 'Unit-1_IP_Addressing_Notes.pdf', originalName: 'Unit-1_IP_Addressing_Notes.pdf', source: 'WHATSAPP', fileSize: 1024500, createdAt: new Date().toISOString() },
  { id: 102, filename: 'Relational_Algebra_Assignment.pdf', originalName: 'Relational_Algebra_Assignment.pdf', source: 'GOOGLE_CLASSROOM', fileSize: 2048000, createdAt: new Date().toISOString() }
];

// App State & DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadDashboardData();
  setupChat();
});

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = (item as HTMLElement).dataset.tab;
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const dashTab = document.getElementById('dashboardView');
      const aiTab = document.getElementById('aiView');

      if (tab === 'ai-assistant') {
        dashTab?.classList.add('d-none');
        aiTab?.classList.remove('d-none');
      } else {
        dashTab?.classList.remove('d-none');
        aiTab?.classList.add('d-none');
      }
    });
  });
}

function loadDashboardData() {
  const subjectList = document.getElementById('sidebarSubjectsList');
  if (subjectList) {
    subjectList.innerHTML = mockSubjects.map(s => `
      <div class="nav-item">
        <i class="bi bi-folder-fill" style="color: ${s.colorHex}"></i>
        <span>${s.name}</span>
      </div>
    `).join('');
  }

  const statDocs = document.getElementById('statTotalDocs');
  const statSubjects = document.getElementById('statTotalSubjects');
  if (statDocs) statDocs.innerText = mockDocs.length.toString();
  if (statSubjects) statSubjects.innerText = mockSubjects.length.toString();

  const filesGrid = document.getElementById('recentFilesGrid');
  if (filesGrid) {
    filesGrid.innerHTML = mockDocs.map(d => `
      <div class="file-card">
        <div class="file-icon"><i class="bi bi-file-earmark-pdf"></i></div>
        <div class="file-title" style="font-weight: 600;">${d.filename}</div>
        <div class="file-meta" style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem;">
          Source: ${d.source}
        </div>
      </div>
    `).join('');
  }
}

function setupChat() {
  const sendBtn = document.getElementById('sendChatBtn');
  const input = document.getElementById('chatInput') as HTMLInputElement;
  const chatBox = document.getElementById('chatBox');

  sendBtn?.addEventListener('click', async () => {
    const question = input.value.trim();
    if (!question) return;

    // Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerText = question;
    chatBox?.appendChild(userMsg);
    input.value = '';

    // Render AI Thinking placeholder
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-message system';
    aiMsg.innerText = 'Thinking... retrieving context from local Ollama...';
    chatBox?.appendChild(aiMsg);
    chatBox?.scrollTo(0, chatBox.scrollHeight);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      aiMsg.innerText = data.answer || "Answer generated from notes context successfully!";
    } catch (err) {
      aiMsg.innerText = `[Offline Mode] Ollama simulated response for: "${question}". Upload PDFs to enable live RAG!`;
    }
  });
}
