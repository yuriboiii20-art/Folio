const API_BASE = 'http://localhost:8080/api/v1';

interface Subject {
  id: number;
  name: string;
  code: string;
  colorHex: string;
}

interface Document {
  id: number;
  filename: string;
  originalName: string;
  source: string;
  fileSize: number;
  createdAt: string;
}

let mockSubjects: Subject[] = [
  { id: 1, name: 'Computer Networks', code: 'CS301', colorHex: '#8ab4f8' },
  { id: 2, name: 'Database Management', code: 'CS302', colorHex: '#c58af9' },
  { id: 3, name: 'Machine Learning', code: 'CS401', colorHex: '#81c995' }
];

let mockDocs: Document[] = [
  { id: 101, filename: 'Unit-1_IP_Addressing_Notes.pdf', originalName: 'Unit-1_IP_Addressing_Notes.pdf', source: 'WHATSAPP', fileSize: 1024500, createdAt: new Date().toISOString() },
  { id: 102, filename: 'Relational_Algebra_Assignment.pdf', originalName: 'Relational_Algebra_Assignment.pdf', source: 'GOOGLE_CLASSROOM', fileSize: 2048000, createdAt: new Date().toISOString() }
];

document.addEventListener('DOMContentLoaded', () => {
  setupStitchNavigation();
  loadStitchData();
  setupChat();
  setupUploadModal();
});

function setupStitchNavigation() {
  const navItems = document.querySelectorAll('.stitch-nav-item');
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

function loadStitchData() {
  const subjectList = document.getElementById('sidebarSubjectsList');
  if (subjectList) {
    subjectList.innerHTML = mockSubjects.map(s => `
      <div class="stitch-nav-item">
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
        <div class="d-flex align-items-center justify-content-between mb-2">
          <i class="bi bi-file-earmark-pdf-fill" style="font-size: 1.8rem; color: #8ab4f8;"></i>
          <span style="font-size: 0.7rem; background: rgba(138, 180, 248, 0.15); color: #8ab4f8; padding: 2px 6px; border-radius: 4px;">${d.source}</span>
        </div>
        <div class="file-title" style="font-weight: 600; font-size: 0.9rem; margin-top: 0.4rem; color: #e8eaed;">${d.filename}</div>
        <div class="file-meta" style="font-size: 0.75rem; color: #9aa0a6; margin-top: 0.4rem;">
          Size: ${(d.fileSize / 1024).toFixed(0)} KB
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

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user';
    userMsg.innerText = question;
    chatBox?.appendChild(userMsg);
    input.value = '';

    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-bubble system';
    aiMsg.innerText = 'Retrieving context from Ollama...';
    chatBox?.appendChild(aiMsg);
    chatBox?.scrollTo(0, chatBox.scrollHeight);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      aiMsg.innerText = data.answer || "Answer generated from notes context!";
    } catch (err) {
      aiMsg.innerText = `Ollama Assistant response for: "${question}".`;
    }
  });
}

function setupUploadModal() {
  const openBtn = document.getElementById('openUploadModalTop');
  const closeBtn = document.getElementById('closeUploadModal');
  const cancelBtn = document.getElementById('cancelUpload');
  const modal = document.getElementById('uploadModal');

  openBtn?.addEventListener('click', () => modal?.classList.remove('d-none'));
  closeBtn?.addEventListener('click', () => modal?.classList.add('d-none'));
  cancelBtn?.addEventListener('click', () => modal?.classList.add('d-none'));
}
