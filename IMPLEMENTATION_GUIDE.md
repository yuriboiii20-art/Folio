# FOLIO - Technical Implementation Guide

## 1. System Architecture & Tech Stack

### Frontend Architecture
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens
- **Visualizations**: `@visx/scale`, `@visx/grid`, `@visx/gradient`, `@visx/responsive`, `motion/react`, `react-use-measure`
- **Iconography**: `lucide-react`

### Backend Architecture
- **Framework**: Spring Boot 3.2 (Java 25 / 17)
- **Security**: Spring Security + JWT Authentication
- **Document Processing**: Apache Tika (text extraction from PDF / Word)
- **Database**: PostgreSQL 15 (Production / Primary) & H2 Database (Development / Offline Fallback)
- **AI RAG Vector Engine**: Local Ollama AI (Llama 3.2)

---

## 2. Key Modules & Component Mapping

### 🖥️ Frontend Structure (`frontend/src/components/ui/`)
1. **`dashboard-sidebar.tsx`**: Main application shell containing:
   - Dashboard Overview (Resource & Activity box, Starred items)
   - Subject Folders (Compact 4-column 3D grid view & single folder inspection)
   - Analytics Studio (Subject Activity & AI Usage graphs with animated width transitions)
   - Profile & Workspace Settings Modals
   - Full In-App Document Reader & Global Universal Dialogs
2. **`folder.tsx`**: 3D animated folder component with pastel styling, paper stack layers, and subject badge labels.
3. **`bar-chart.tsx`**: visx SVG bar chart wrapper supporting custom gradients, indicators, and tooltips.
4. **`search-input.tsx`**: Custom styled omni-search input component.

### ⚙️ Backend Structure (`backend/src/main/java/com/folio/`)
1. **`controller/`**:
   - `ApiController.java`: Handles subject folders, documents, and search API endpoints.
   - `AuthController.java`: Handles user authentication and JWT token issuance.
   - `NoteController.java`: API for student personal notes and to-dos.
2. **`service/`**:
   - `DocumentService.java`: File ingestion, storage, and text chunking.
   - `OllamaService.java`: Local Llama 3.2 vector query and response generation.
3. **`model/`**: JPA Entities mapping `User`, `Subject`, `Document`, `DocumentChunk`, and `PersonalNote`.

---

## 3. Database Schema & Persistence

### Primary Database: PostgreSQL 15 (`foliodb`)
Defined in `backend/src/main/resources/schema-postgres.sql`:
- **`users`**: `id`, `name`, `email`, `usn`, `password_hash`, `role`, `department`
- **`subjects`**: `id`, `name`, `code`, `description`, `color_hex`, `user_id`
- **`documents`**: `id`, `title`, `subject_id`, `source`, `size_bytes`, `file_type`, `file_url`, `content_snippet`, `created_at`
- **`document_chunks`**: `id`, `document_id`, `chunk_index`, `content`, `vector_embedding`
- **`personal_notes`**: `id`, `user_id`, `title`, `content`, `updated_at`

---

## 4. Execution & Setup Commands

### Running Frontend
```powershell
npm --prefix frontend run dev
```

### Running Backend
```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"
```

### Running Local PostgreSQL via Docker
```powershell
docker compose up -d
```
