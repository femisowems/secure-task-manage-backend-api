# Secure Task Management API

A robust, enterprise-grade **Secure Task Management API** built with **NestJS**. This project demonstrates advanced security patterns, including Supabase JWT integration, hierarchical Role-Based Access Control (RBAC), multi-tenant Organization Scoping, and comprehensive audit logging.

## 🚀 Key Features

- **Enterprise Security**:
  - **Supabase Auth Integration**: Secure token exchange using Supabase JWTs with ES256 signature validation via JWKS.
  - **Hierarchical RBAC**: Granular permission system (`Owner` > `Admin` > `Viewer`).
  - **Multi-Tenant Scoping**: Strict organization isolation with parent-child relationship support.
  - **Compliance Logging**: Automated audit tracking for all sensitive operations (Create, Update, Delete).
  - **Security Best Practices**: Implements `helmet` for security headers and `throttler` for rate limiting.

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (v11)
- **Database**: SQLite (via [TypeORM](https://typeorm.io/))
- **Authentication**: [Supabase Auth](https://supabase.com/auth) & [Passport](http://www.passportjs.org/)
- **Security**: [Helmet](https://helmetjs.github.io/), [Throttler](https://github.com/nestjs/throttler)
- **Environment**: Node.js

## 📋 Prerequisites

- **Node.js**: v18 or later
- **Supabase Project**: You need a valid Supabase project for authentication.

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:4200,https://your-frontend-domain.com

# Database Configuration
# Uses local SQLite file by default
DATABASE_URL=database.sqlite

# Supabase Configuration
# Required for JWT validation
SUPABASE_URL=https://your-project.supabase.co
```

## 📦 Installation

```bash
# Install dependencies
npm install
```

## 🏃 running the API

```bash
# Development mode
npm run start

# Watch mode (recommended for dev)
npm run start:dev

# Production mode
npm run start:prod
```

The API will start at `http://localhost:3001/api`.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔌 API Endpoints

### Authentication (`/auth`)
- `GET /auth/me` - Get current user profile (requires valid JWT).

### Tasks (`/tasks`)
- `GET /tasks` - List all tasks for the user's organization.
- `POST /tasks` - Create a new task.
- `PUT /tasks/:id` - Update a task.
- `DELETE /tasks/:id` - Delete a task.

> **Note**: All task endpoints are protected by `JwtAuthGuard` and `RolesGuard`.

## 📄 License

MIT
