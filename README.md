# FOLIO - Smart Student Study Studio & Academic Resource Management System

FOLIO is a modern, high-performance academic file management and AI study studio designed for students. It features an enhanced Slate-Gray UI, visx animated charts, 3D interactive subject folders, local Ollama AI vector search (RAG), and PostgreSQL 15 database persistence.

---

## Key Features & Accomplishments

### 🎨 1. Dashboard & Slate-Gray Design System
- **Slate-Gray Aesthetics**: Professional slate-gray gradient accents (`#1e293b`, `#334155`, `#475569`, `#0f172a`) with crisp contrast and clean Light Mode default.
- **Compact Viewport**: Optimized single-page viewport layout without unnecessary page scrolling.
- **Top Header Bar**: Clean layout featuring omni-search autocomplete and animated **Study Streak Badge** (`12 Day Streak`) in the top-right corner.

### 📊 2. Visx Animated Activity Bar Chart
- **Visx Powered Charts**: High-performance SVG bar charts built using `@visx/scale`, `@visx/grid`, `@visx/gradient`, and `motion/react`.
- **Standing Rectangular Bars**: Clean standing bar design (`lineCap="butt"`) with custom linear gradients (`from-slate-900 to-slate-600`), line indicators, interactive tooltips, and well-spaced X-axis day labels (`Mon`-`Sun`).

### 📁 3. Interactive 3D Subject Folders & Starred Items
- **3D Animated Folders**: Custom 3D folder component ([folder.tsx](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/frontend/src/components/ui/folder.tsx)) with soft light pastel styling, perspective hover tilt effects, and subject code badges.
- **Compact 4-Column Grid**: Responsive `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` layout for subject folders.
- **Starred Files & Folders**: Star toggle option on files and folders to instantly pin favorite academic resources in the Starred Items section.

### 📈 4. Comprehensive Academic & AI Study Analytics
- **Subject-wise Usage (`SUBJECT ACTIVITY`)**: Real-time engagement percentage breakdown for DBMS, Operating Systems, AI/ML, Computer Networks, Mathematics, and others.
- **AI Usage Analytics (`🤖 FOLIO AI`)**: Detailed metrics tracking Questions Asked, Documents Summarized, Quizzes Generated, and Flashcards Generated.
- **Most Asked Topics**: Animated bar breakdown covering top AI study topics like CPU Scheduling, Normalization, Deadlocks, TCP/IP, and Neural Networks.
- **Entrance Bar Animations**: Smooth staggered width fill transitions (`transition-all duration-1000 ease-out`) that animate dynamically whenever the Analytics tab is opened.

### 🔔 5. Custom Themed Dialog Modals
- **Universal Dialog System**: Replaced native browser `alert()` popups with custom-themed dialog modals.
- **Context-Aware Visual Badges**: Themed green tick circle icons for file uploads, amber warning badges for missing selections, and slate info popups for system notifications.

### 🐘 6. PostgreSQL 15 Database Integration
- **Primary Database**: Integrated PostgreSQL 15 (`foliodb` on port `5432`) with Spring Boot JPA entities.
- **Automated DDL Schema**: Complete PostgreSQL DDL initialization script (`schema-postgres.sql`) with tables for `users`, `subjects`, `documents`, `document_chunks`, and `personal_notes`.
- **Docker Compose & Adminer Web UI**: Included `docker-compose.yml` with PostgreSQL 15 container and Adminer Web Database Explorer (`http://localhost:8088/`).
- **H2 Fallback**: Provided `application-h2.properties` for zero-setup offline development.

### 📄 7. In-App Document Reader & AI Assistant
- **In-App Reader**: Direct in-app viewing (`View In-App`) for PDFs and text notes without forcing downloads.
- **Device Downloads**: Dedicated download button (`Download`) for saving files to device explorer.
- **Local Ollama AI Chat**: RAG study assistant powered by Llama 3.2 for answering questions directly from uploaded lecture notes.

---

## Quick Start

### Frontend (Vite + React + Tailwind)
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173/
```

### Backend (Spring Boot + PostgreSQL 15)
```bash
# Option A: Run PostgreSQL 15 via Docker
docker compose up -d

# Option B: Run Spring Boot Server
cd backend
.\mvnw spring-boot:run
# REST API active at http://localhost:8080/api/v1/
```

---

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Visx, Motion, Lucide Icons
- **Backend**: Java 25 / 17, Spring Boot 3.2, Spring Security, Apache Tika
- **Database**: PostgreSQL 15 (Primary), H2 Database (Fallback)
- **Containerization**: Docker & Docker Compose
