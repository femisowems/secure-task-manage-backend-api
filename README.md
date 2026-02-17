# Secure Task Management App Angular

A premium, enterprise-grade **Secure Task Management Application** featuring a modern Angular frontend and a robust NestJS backend. This project demonstrates advanced security patterns, including Supabase JWT integration, hierarchical Role-Based Access Control (RBAC), and multi-tenant Organization Scoping.

## 🚀 Key Features

- **Enterprise Security**: 
  - **Supabase Auth Integration**: Secure token exchange using Supabase JWTs with ES256 signature validation via JWKS.
  - **Hierarchical RBAC**: Granular permission system (`Owner` > `Admin` > `Viewer`).
  - **Multi-Tenant Scoping**: Strict organization isolation with parent-child relationship support.
  - **Compliance Logging**: Automated audit tracking for all sensitive operations (Create, Update, Delete).
- **Modern Angular Frontend**:
  - **Angular Dashboard**: Modern Angular 19+ app utilizing **Signals**, **Angular CDK (Kanban Board)**, and premium Tailwind v4 styling.
- **Premium Design**:
  - **Interactive Kanban**: Drag-and-drop task management with real-time status updates.
  - **Aesthetics**: Glassmorphism UI with Lucide icons and Inter typography.

## 🔑 Test Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Owner** | `admin@test.com` | `password123` | Full system access & Audit logs |
| **Viewer** | `user@test.com` | `password123` | Read-only access to specific org |

## 🛠️ Setup & Installation

### 1. Prerequisites
Ensure you have a [Supabase](https://supabase.com) project created.

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend Configuration
SUPABASE_URL=https://your-project.supabase.co
PORT=3001
VITE_API_URL=http://localhost:3001/api
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Servers

| Command | Action | URL |
| :--- | :--- | :--- |
| `npm run start:angular` | Start Angular Dashboard | [http://localhost:4200](http://localhost:4200) |
| `npm run start:api` | Start NestJS Backend | [http://localhost:3001/api](http://localhost:3001/api) |
| `npm run start:all` | Start EVERYTHING | (All of the above) |

## 🏗️ Architecture Detail

### Backend (NestJS)
- **`SupabaseJwtStrategy`**: Validates incoming JWTs against Supabase's public keys (`ES256`).
- **`RbacService`**: Centralized logic for role inheritance and permission checks.
- **`OrgScopeService`**: Handles parent/child organization visibility logic.

### Angular Dashboard (Modern)
- **`Signals`**: state management for high-performance reactive updates.
- **`CDK Drag & Drop`**: Interactive Kanban board for task management.
- **`Tailwind v4`**: Automated CLI build for premium styling.

## 📂 Project Structure

```text
├── apps/api/src/app/       # Backend (NestJS)
├── apps/dashboard/         # Modern Angular Dashboard (v19)
│   ├── src/app/core/       # Signals-based Stores & Interceptors
│   └── src/app/features/   # Kanban Board & Audit Components
├── libs/                   # Shared Business Logic (RBAC/Org Scoping)
├── scripts/                # Database migration & utility scripts
└── database.sqlite         # Local SQLite storage
```

## 📄 License
MIT
