# MyPOS System - Complete Setup Guide

This guide provides detailed instructions for setting up the MyPOS system for development and production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended
- **Storage**: 10GB+ free space

### Software Dependencies

#### Required
- **Node.js**: 18.17.0+ (LTS)
  ```bash
  # Download from https://nodejs.org/
  node --version  # Should show 18.17.0+
  ```
- **Docker**: 24.0+
  ```bash
  docker --version  # Should show 24.0+
  docker compose version  # Should show 2.0+
  ```
- **Git**: 2.30+
  ```bash
  git --version  # Should show 2.30+
  ```

#### Optional (for specific services)
- **Flutter SDK**: 3.10+ (for POS app development)
- **Python**: 3.9+ (for AI service development)
- **MySQL Client**: For direct database access

### Network Requirements

- **Ports**: Ensure these ports are available:
  - 3000 (Next.js web app)
  - 4000 (NestJS API)
  - 3306 (MySQL database)
  - 6379 (Redis cache)
  - 8001 (FastAPI AI service)

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd myPosSystem
```

### 2. Environment Configuration

#### Main Monorepo Environment

```bash
# Copy main environment file
cp .env.example .env

# Edit with your values
nano .env  # or code .env
```

**Required variables:**
```env
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1

MYSQL_ROOT_PASSWORD=your_secure_mysql_password
DATABASE_URL=mysql://root:your_secure_mysql_password@localhost:3306/mypos_system
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_256_bit_jwt_access_secret
JWT_REFRESH_SECRET=your_256_bit_jwt_refresh_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

CORS_ORIGIN=http://localhost:3000
SUPER_ADMIN_EMAIL=superadmin@mypos.local
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

#### API Service Environment

```bash
cp apps/api-nest/.env.example apps/api-nest/.env
# Usually inherits from main .env
```

#### Web Dashboard Environment

```bash
cp apps/web-next/.env.example apps/web-next/.env.local

# Edit with your values
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

#### AI Service Environment

```bash
cp apps/ai-fastapi/.env.example apps/ai-fastapi/.env

# Edit with your values
DATABASE_URL=mysql://root:your_secure_mysql_password@localhost:3306/mypos_system
JWT_SECRET_KEY=your_jwt_secret_key
```

#### Flutter App Environment

```bash
cp apps/pos-flutter/.env.example apps/pos-flutter/.env

# Edit with your values
API_BASE_URL=http://localhost:4000/api/v1
```

### 3. Start Infrastructure

```bash
# Start MySQL and Redis
docker compose -f infra/docker/docker-compose.yml up -d mysql redis

# Wait for services to be ready (30-60 seconds)
docker compose -f infra/docker/docker-compose.yml ps

# Check logs if needed
docker compose -f infra/docker/docker-compose.yml logs mysql
docker compose -f infra/docker/docker-compose.yml logs redis
```

### 4. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm ls --depth=0
```

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed

# Verify database
docker exec -it mypos_mysql mysql -u root -p -e "SHOW DATABASES;"
```

### 6. Start Development Servers

#### Terminal 1: API Server
```bash
npm run dev:api
# Should show: "Nest application successfully started"
# Access: http://localhost:4000/api/v1/health
```

#### Terminal 2: Web Dashboard
```bash
npm run dev:web
# Should show: "Ready - started server on 0.0.0.0:3000"
# Access: http://localhost:3000
```

#### Terminal 3: AI Service (Optional)
```bash
cd apps/ai-fastapi
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
# Access: http://localhost:8001/docs
```

#### Terminal 4: Flutter App (Optional)
```bash
cd apps/pos-flutter
flutter pub get
flutter run
# Requires Android/iOS emulator or device
```

### 7. Verify Setup

```bash
# Check all services are running
curl http://localhost:4000/api/v1/health
curl http://localhost:3000/api/health  # If implemented
curl http://localhost:8001/health     # If running

# Check database connection
docker exec -it mypos_mysql mysql -u root -p mypos_system -e "SHOW TABLES;"
```

## Production Deployment

### 1. Security First

#### Change All Default Secrets

**NEVER use these in production:**
- `change_me_access_secret`
- `change_me_refresh_secret`
- `ChangeMe123!`
- `Dulaj@`
- `your_mysql_password_here`

**Generate secure secrets:**
```bash
# Generate JWT secrets (256-bit)
openssl rand -hex 32

# Generate secure passwords
openssl rand -base64 24
```

#### Environment Variables

Create production `.env` files with:
- Strong database passwords
- Secure JWT secrets
- Production database URLs
- HTTPS URLs for CORS
- Proper logging levels

### 2. Database Production Setup

```bash
# For production database (AWS RDS, Google Cloud SQL, etc.)
# Update DATABASE_URL in .env
DATABASE_URL=mysql://user:password@production-db-host:3306/mypos_system

# Run migrations
npm run db:push

# Seed production data (if needed)
npm run db:seed
```

### 3. Build Applications

```bash
# Build all applications
npm run build

# Build individual services
cd apps/api-nest && npm run build
cd apps/web-next && npm run build
```

### 4. Docker Production Deployment

```bash
# Build production images
docker compose -f infra/docker/docker-compose.yml build

# Start production stack
docker compose -f infra/docker/docker-compose.yml up -d

# Scale services if needed
docker compose -f infra/docker/docker-compose.yml up -d --scale api=3
```

### 5. SSL/TLS Configuration

```bash
# Use reverse proxy (nginx, traefik) for SSL termination
# Configure HTTPS certificates
# Update CORS_ORIGIN to use https:// URLs
```

### 6. Monitoring & Logging

```bash
# Enable production logging
# Set up monitoring (Prometheus, Grafana)
# Configure health checks
# Set up alerts
```

## Environment Configuration

### Environment Variables Reference

#### Core Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | API server port | `4000` |
| `API_PREFIX` | API route prefix | `api/v1` |

#### Database
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database URL | `mysql://user:pass@host:3306/db` |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `StrongPass123!` |

#### Authentication
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_ACCESS_SECRET` | JWT access token secret | `256-bit-hex-string` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `256-bit-hex-string` |
| `JWT_ACCESS_TTL` | Access token TTL | `15m` |
| `JWT_REFRESH_TTL` | Refresh token TTL | `7d` |

#### External Services
| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://myapp.com` |

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

#### Staging
```env
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
CORS_ORIGIN=https://staging.myapp.com
```

#### Production
```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
CORS_ORIGIN=https://myapp.com
```

## Database Setup

### Local Development

```bash
# Start MySQL container
docker compose -f infra/docker/docker-compose.yml up -d mysql

# Wait for MySQL to be ready
sleep 30

# Push schema
npm run db:push

# Seed data
npm run db:seed
```

### Production Database

```bash
# For managed databases (RDS, Cloud SQL, etc.)
# Update DATABASE_URL
export DATABASE_URL="mysql://user:pass@prod-db-host:3306/mypos_system"

# Push schema
npm run db:push

# Create backup before seeding
mysqldump -h prod-db-host -u user -p mypos_system > backup.sql

# Seed if needed
npm run db:seed
```

### Database Migrations

```bash
# Development workflow
npm run db:push  # For schema changes during development

# Production workflow
# 1. Test migrations in staging
# 2. Backup production database
# 3. Apply migrations
npm run db:push
# 4. Verify application works
# 5. Monitor for issues
```

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run API tests
cd apps/api-nest && npm run test

# Run with coverage
npm run test:cov
```

### Integration Tests

```bash
# Start test database
docker compose -f infra/docker/docker-compose.test.yml up -d

# Run integration tests
npm run test:e2e

# Clean up
docker compose -f infra/docker/docker-compose.test.yml down
```

### Manual Testing

```bash
# API endpoints
curl http://localhost:4000/api/v1/health
curl http://localhost:4000/api/v1/auth/login -X POST -d '{"email":"test","password":"test"}'

# Database queries
docker exec -it mypos_mysql mysql -u root -p mypos_system -e "SELECT * FROM users LIMIT 5;"
```

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Symptoms:**
- API fails to start with Prisma errors
- "Can't reach database server" errors

**Solutions:**
```bash
# Check if MySQL is running
docker ps | grep mysql

# Check MySQL logs
docker logs mypos_mysql

# Test connection
docker exec -it mypos_mysql mysql -u root -p -e "SELECT 1;"

# Verify DATABASE_URL
echo $DATABASE_URL
```

#### Port Already in Use

**Symptoms:**
- "Port 4000 already in use" errors

**Solutions:**
```bash
# Find process using port
netstat -tulpn | grep :4000
lsof -i :4000

# Kill process or change port in .env
PORT=4001
```

#### Node Modules Issues

**Symptoms:**
- "Cannot find module" errors
- Build failures

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### Docker Issues

**Symptoms:**
- Container fails to start
- "no space left on device"

**Solutions:**
```bash
# Check disk space
df -h

# Clean Docker
docker system prune -a

# Rebuild containers
docker compose -f infra/docker/docker-compose.yml build --no-cache
```

### Getting Help

1. Check application logs
2. Review environment variables
3. Test individual components
4. Check GitHub issues
5. Review documentation

### Performance Issues

```bash
# Monitor resource usage
docker stats

# Check database performance
docker exec -it mypos_mysql mysql -u root -p -e "SHOW PROCESSLIST;"

# Profile Node.js application
npm install -g clinic
clinic doctor -- node dist/main.js
```

---

## Next Steps

After completing setup:

1. **Explore the codebase** - Review each service's structure
2. **Run the test suite** - Ensure everything works
3. **Customize the application** - Add your business logic
4. **Set up CI/CD** - Automate testing and deployment
5. **Configure monitoring** - Set up logging and alerts
6. **Security audit** - Review and harden security settings

For detailed API documentation, see [API Overview](../docs/api-overview.md).