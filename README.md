# FOLIO - Smart Student Study Studio & Academic Resource Management System

FOLIO is a modern, high-performance academic file management and AI study studio designed for students. It features an enhanced DashboardKit Slate-Gray UI, local Ollama AI vector search (RAG), and PostgreSQL 15 database persistence.

---

## Key Features & Accomplishments

### 🎨 1. DashboardKit Design System & Clean Layout
- **Slate-Gray Aesthetics**: Professional slate-gray gradient accents (`#1e293b`, `#334155`, `#475569`, `#0f172a`) with crisp contrast and clean Light Mode default.
- **Fixed Sidebar Navigation**: Clean collapsable sidebar menu with unclipped `D` brand logo header and smooth active highlights.

### 🐘 2. PostgreSQL 15 Database Integration
- **Primary Database**: Integrated PostgreSQL 15 (`foliodb` on port `5432`) with Spring Boot JPA entities.
- **Automated DDL Schema**: Complete PostgreSQL DDL initialization script (`schema-postgres.sql`) with tables for `users`, `subjects`, `documents`, `document_chunks`, and `personal_notes`.
- **Docker Compose & Adminer Web UI**: Included `docker-compose.yml` with PostgreSQL 15 container and Adminer Web Database Explorer (`http://localhost:8088/`).
- **H2 Fallback**: Provided `application-h2.properties` for zero-setup offline development.

### 👤 3. Interactive Profile & Account Management
- **Avatar Support**: Profile picture preview with camera file upload trigger.
- **Edit Profile Modal**: Interactive modal to update Name, Email, USN, Role, and Department Branch.
- **Change Password Modal**: Password update section with validation.
- **Account Actions**: Direct Logout and Red Danger Delete Account confirmation modal.

### ⚙️ 4. Full Workspace Settings Suite
- **Default Upload Location**: Configurable default subject folder.
- **Dynamic Sorting**: Instant file sorting by `Date added`, `Name`, `File type`, or `Size`.
- **View Modes**: Switch between `Grid` and `List` view modes.
- **File Toggles**: Options to show/hide file extensions, confirm before deleting files, auto-rename duplicates, auto-organize files, and auto-create folders.

### 📄 5. In-App Document Reader & AI Study Assistant
- **Upload Modal**: File picker with loading spinner, toast notifications, and Apache Tika text extraction.
- **In-App Reader**: Embedded document viewer for PDF and text notes with copy/download options.
- **Local Ollama AI Chat**: RAG study assistant powered by Llama 3.2 for answering questions directly from uploaded lecture notes.

---

## Quick Start

### Frontend (Vite + React + Tailwind)
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5174/
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
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Java 25 / 17, Spring Boot 3.2, Spring Security, Apache Tika
- **Database**: PostgreSQL 15 (Primary), H2 Database (Fallback)
- **Containerization**: Docker & Docker Compose
