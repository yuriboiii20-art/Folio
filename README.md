# FOLIO - Smart Student Study Studio & Academic Resource Management System

FOLIO is a modern, high-performance academic file management and AI study studio designed for students. It features an enhanced Slate-Gray UI, visx animated charts, 3D interactive subject folders, local Ollama AI vector search (RAG), and PostgreSQL 15 database persistence.

---

## 🖼️ Application Interface Preview

| Dashboard & Viewport View | Academic & AI Analytics Studio |
| :---: | :---: |
| ![FOLIO Dashboard Preview](assets/images/dashboard_view.png) | ![FOLIO Analytics Studio Preview](assets/images/analytics_view.png) |

---

## 📚 Table of Contents
- [Application Interface Preview](#️-application-interface-preview)
- [Key Features & Accomplishments](#key-features--accomplishments)
- [Architecture & Design Methodology](#architecture--design-methodology)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

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
- **Automated DDL Schema**: Complete PostgreSQL DDL initialization script ([schema-postgres.sql](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/backend/src/main/resources/schema-postgres.sql)) with tables for `users`, `subjects`, `documents`, `document_chunks`, and `personal_notes`.
- **Docker Compose & Adminer Web UI**: Included [docker-compose.yml](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/docker-compose.yml) with PostgreSQL 15 container and Adminer Web Database Explorer (`http://localhost:8088/`).
- **H2 Fallback**: Provided `application-h2.properties` for zero-setup offline development.

### 📄 7. In-App Document Reader & AI Assistant
- **In-App Reader**: Direct in-app viewing (`View In-App`) for PDFs and text notes without forcing downloads.
- **Device Downloads**: Dedicated download button (`Download`) for saving files to device explorer.
- **Local Ollama AI Chat**: RAG study assistant powered by Llama 3.2 for answering questions directly from uploaded lecture notes.

---

## Architecture & Design Methodology

FOLIO follows strict UX design principles focusing on single-viewport efficiency, soft warm pastel accents for folder interactions, and non-intrusive modal overlays. 
- For detailed UI design principles and palette specifications, see [DESIGN_METHODOLOGY.md](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/DESIGN_METHODOLOGY.md).
- For complete technical implementation, architecture diagrams, and service code structures, see [IMPLEMENTATION_GUIDE.md](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/IMPLEMENTATION_GUIDE.md).

---

## Quick Start

### 1. Frontend (Vite + React + Tailwind)
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173/
```

### 2. Backend (Spring Boot + PostgreSQL 15)
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
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Visx (`@visx/scale`, `@visx/grid`, `@visx/gradient`), Motion (`motion/react`), Lucide Icons
- **Backend**: Java 25 / 17, Spring Boot 3.2, Spring Security + JWT, Apache Tika
- **Database**: PostgreSQL 15 (Production / Primary), H2 Database (Development / Offline Fallback)
- **AI Engine**: Local Ollama AI (Llama 3.2 RAG Vector Query)
- **Containerization**: Docker & Docker Compose

---

## Project Structure

```
FOLIO/
├── backend/                  # Spring Boot REST API Service
│   ├── src/main/java/com/folio/
│   │   ├── controller/      # API Controllers (Auth, Document, Note, Subject)
│   │   ├── model/           # JPA Entities (User, Subject, Document, Note)
│   │   └── service/         # Business Logic & Ollama RAG Integration
│   └── src/main/resources/  # Database schemas & application properties
├── frontend/                 # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/ui/   # Reusable Slate-Gray UI & 3D Folder components
│   │   └── lib/             # Utility helpers & state management
├── mobile/                   # Mobile application codebase
├── docker-compose.yml        # PostgreSQL 15 & Adminer container config
├── DESIGN_METHODOLOGY.md     # UI/UX design specifications & palette guide
├── IMPLEMENTATION_GUIDE.md   # System architecture & component mapping
└── README.md                 # Project Overview & Getting Started
```
'yet to update'

## Documentation
- 🎨 [DESIGN_METHODOLOGY.md](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/DESIGN_METHODOLOGY.md)
- ⚙️ [IMPLEMENTATION_GUIDE.md](file:///c:/Users/yaqub%20ahmed/Desktop/FOLIO/IMPLEMENTATION_GUIDE.md)

