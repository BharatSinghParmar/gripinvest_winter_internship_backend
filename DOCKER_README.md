# GripInvest - Docker Deployment Guide

This guide provides instructions for running the complete GripInvest platform using Docker containers.

## 🐳 Architecture

The application consists of three main services:

- **MySQL Database** (Port 3306) - Data persistence
- **Backend API** (Port 8080) - Node.js/Express server
- **Frontend** (Port 3000) - React application served by Nginx

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.9+
- At least 4GB RAM available for containers

### 1. Clone and Setup

```bash
git clone <repository-url>
cd gripinvest_winter_internship_backend
```

### 2. Environment Configuration

The application uses default environment variables. For production, create environment files:

**Backend (.env in backend/ directory):**
```env
DATABASE_URL=mysql://root:rootpassword@mysql:3306/grip
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
PORT=8080
NODE_ENV=production
COOKIE_DOMAIN=localhost
```

**Frontend (.env in frontend/ directory):**
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 3. Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Initialize Database

```bash
# Run database migrations and seed data
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **API Health Check**: http://localhost:8080/api/v1/health
- **Database**: localhost:3306 (root/rootpassword)

## 🔧 Management Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Database Operations
```bash
# Access MySQL shell
docker-compose exec mysql mysql -u root -prootpassword grip

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Reset database
docker-compose exec backend npx prisma migrate reset
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

## 🏥 Health Checks

All services include health checks:

- **MySQL**: `mysqladmin ping`
- **Backend**: HTTP GET `/api/v1/health`
- **Frontend**: HTTP GET `/health`

Check health status:
```bash
docker-compose ps
```

## 📊 Monitoring

### Service Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Container Logs
```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8080
   netstat -tulpn | grep :3306
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check MySQL logs
   docker-compose logs mysql
   
   # Restart MySQL
   docker-compose restart mysql
   ```

3. **Backend Build Failures**
   ```bash
   # Clean build
   docker-compose build --no-cache backend
   
   # Check backend logs
   docker-compose logs backend
   ```

4. **Frontend Build Failures**
   ```bash
   # Clean build
   docker-compose build --no-cache frontend
   
   # Check frontend logs
   docker-compose logs frontend
   ```

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## 🔒 Security Notes

- Change default passwords in production
- Use environment variables for secrets
- Enable SSL/TLS in production
- Regularly update base images
- Use Docker secrets for sensitive data

## 📝 Development

### Local Development with Docker
```bash
# Start only database
docker-compose up -d mysql

# Run backend locally
cd backend
npm install
npm run dev

# Run frontend locally
cd frontend
npm install
npm run dev
```

### Adding New Dependencies
```bash
# Backend
cd backend
npm install <package>
docker-compose build backend

# Frontend
cd frontend
npm install <package>
docker-compose build frontend
```

## 🎯 Production Deployment

1. **Update Environment Variables**
2. **Use Production Database**
3. **Enable SSL/TLS**
4. **Set up Monitoring**
5. **Configure Logging**
6. **Set up Backup Strategy**

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify health checks: `docker-compose ps`
3. Check resource usage: `docker stats`
4. Review this documentation

## 🏆 Success Indicators

When everything is working correctly:
- All services show "healthy" status
- Frontend loads at http://localhost:3000
- Backend API responds at http://localhost:8080/api/v1/health
- Database is accessible and seeded with data
- No error messages in logs
