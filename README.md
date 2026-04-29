# MyPOS System - SaaS Inventory + POS Platform

Production-oriented SaaS Inventory + POS platform built with modern technologies and best practices.

## 🏗️ Architecture Overview

This monorepo contains a complete SaaS POS system with multi-tenant architecture:

- **Backend API**: NestJS + TypeScript + Prisma + MySQL + Redis + WebSocket
- **Admin Dashboard**: Next.js + TypeScript + Tailwind CSS
- **POS Application**: Flutter (Mobile/Tablet POS interface)
- **AI Service**: FastAPI (Analytics, forecasting, ML models)
- **Database**: MySQL with Prisma ORM
- **Cache**: Redis for sessions and real-time features

## 📁 Project Structure

```
myPosSystem/
├── apps/
│   ├── api-nest/          # Main backend API (NestJS)
│   ├── web-next/          # Admin dashboard (Next.js)
│   ├── pos-flutter/       # POS application (Flutter)
│   └── ai-fastapi/        # AI/analytics service (FastAPI)
├── packages/
│   └── db-prisma/         # Database schema & migrations
├── infra/
│   └── docker/            # Docker infrastructure
├── docs/                  # Documentation
└── package.json           # Monorepo configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **Docker & Docker Compose**: For local infrastructure
- **Git**: For version control
- **Flutter SDK**: 3.0+ (for POS app development)
- **Python**: 3.9+ (for AI service)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd myPosSystem

# Copy environment files
cp .env.example .env
cp apps/api-nest/.env.example apps/api-nest/.env
cp apps/web-next/.env.example apps/web-next/.env.local
cp apps/ai-fastapi/.env.example apps/ai-fastapi/.env
cp apps/pos-flutter/.env.example apps/pos-flutter/.env

# Edit .env files with your actual values
```

### 2. Start Infrastructure

```bash
# Start MySQL and Redis
docker compose -f infra/docker/docker-compose.yml up -d mysql redis

# Wait for services to be healthy
docker compose -f infra/docker/docker-compose.yml ps
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install per workspace
npm install --workspace=@mypos/api
npm install --workspace=@mypos/web
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### 5. Run Applications

```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start web dashboard
npm run dev:web

# Terminal 3: Start AI service (optional)
cd apps/ai-fastapi && python -m uvicorn app.main:app --reload

# Terminal 4: Run Flutter app (optional)
cd apps/pos-flutter && flutter run
```

### 6. Access Applications

- **API**: http://localhost:4000/api/v1
- **API Docs**: http://localhost:4000/api/v1/docs
- **Web Dashboard**: http://localhost:3000
- **AI Service**: http://localhost:8001

## 🔧 Development Commands

### Monorepo Commands

```bash
# Install all dependencies
npm install

# Build all workspaces
npm run build

# Run tests across all workspaces
npm run test

# Lint all workspaces
npm run lint

# Format code
npm run format
```

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

### API Commands

```bash
cd apps/api-nest

# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint
```

### Web Dashboard Commands

```bash
cd apps/web-next

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## 🐳 Docker Development

### Full Stack with Docker

```bash
# Build and start all services
docker compose -f infra/docker/docker-compose.yml up --build -d

# View logs
docker compose -f infra/docker/docker-compose.yml logs -f

# Stop all services
docker compose -f infra/docker/docker-compose.yml down
```

### Individual Services

```bash
# API only
docker compose -f infra/docker/docker-compose.yml up --build api

# Web only
docker compose -f infra/docker/docker-compose.yml up --build web
```

## 🔒 Security Notes

⚠️ **IMPORTANT**: Before deploying to production:

1. **Change all default secrets** in `.env` files
2. **Use strong passwords** for database and Redis
3. **Configure proper CORS** settings
4. **Enable HTTPS** in production
5. **Set up proper logging** and monitoring
6. **Configure firewall rules**
7. **Use environment-specific configurations**

## 📚 Documentation

- [API Documentation](./docs/api-overview.md)
- [Architecture Overview](./docs/architecture.md)
- [Super Admin Workflow](./docs/super-admin-workflow.md)
- [Database Schema](./packages/db-prisma/README.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run API tests only
cd apps/api-nest && npm run test

# Run with coverage
npm run test:cov
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run linting: `npm run lint`
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Ensure Docker containers are running: `docker ps`
- Check database logs: `docker logs mypos_mysql`
- Verify `.env` DATABASE_URL is correct

**API Won't Start**
- Check if port 4000 is available
- Verify all environment variables are set
- Check API logs for specific errors

**Web App Won't Load**
- Ensure API is running on port 4000
- Check browser console for CORS errors
- Verify NEXT_PUBLIC_API_BASE_URL in `.env.local`

### Getting Help

- Check the [troubleshooting guide](./docs/troubleshooting.md)
- Review [API documentation](./docs/api-overview.md)
- Check GitHub issues for similar problems
   - `docker compose -f infra/docker/docker-compose.yml down`

## Docker Run (Full Stack)

1. Copy `.env.example` to `.env` in root.
2. Start all services:
   - `docker compose -f infra/docker/docker-compose.yml up --build -d`
3. Access services:
   - Web: `http://localhost:3000`
   - API: `http://localhost:4000/api/v1/health`
   - API Docs: `http://localhost:4000/api/v1/docs`
   - AI Service: `http://localhost:8001/health`
4. Stop services:
   - `docker compose -f infra/docker/docker-compose.yml down`

## Core Modules Implemented in API

- Auth and RBAC (JWT + roles)
- Tenant registration + super admin approval/rejection
- Inventory (category, product, supplier, purchase, stock ledger)
- POS (order create, checkout, payment, stock deduction)
- Settings request review flow (tenant -> super admin)
- Audit log, idempotency keys, websocket realtime notifications

## Important Production Notes

- Enforce HTTPS and secure secret management before production
- Enable DB backups, read replicas, and observability tooling
- Add automated tests before release
- Keep Prisma migrations as the single source of schema changes
