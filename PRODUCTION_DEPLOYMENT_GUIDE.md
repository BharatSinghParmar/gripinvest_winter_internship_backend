# 🚀 GripInvest Production Deployment Guide

## 📋 Overview

This guide provides comprehensive instructions for deploying the GripInvest platform to production using Docker containers. The platform includes a Node.js backend API, React frontend, and MySQL database.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MySQL DB      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 3307    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

### Software Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository

### Installation Commands

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
```

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

#### Windows
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
# Enable WSL2 integration
```

## 📦 Deployment Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd gripinvest_winter_internship_backend
```

### 2. Environment Configuration

#### Backend Environment Variables
Create `backend/.env` file:
```bash
# Database Configuration
DATABASE_URL=mysql://root:rootpassword@mysql:3306/grip

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-2024
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Server Configuration
PORT=8080
NODE_ENV=production
COOKIE_DOMAIN=yourdomain.com

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_WINDOW_MS=300000
OTP_RATE_LIMIT_MAX_REQUESTS=5
```

#### Frontend Environment Variables
Create `frontend/.env` file:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### 3. Production Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.9'

services:
  mysql:
    image: mysql:8.0
    container_name: grip-mysql-prod
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: grip
      MYSQL_USER: gripuser
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql-init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-u', 'root', '-p${MYSQL_ROOT_PASSWORD}']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - grip-network
    restart: unless-stopped

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: grip-backend-prod
    environment:
      DATABASE_URL: mysql://root:${MYSQL_ROOT_PASSWORD}@mysql:3306/grip
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      ACCESS_TOKEN_TTL: 15m
      REFRESH_TOKEN_TTL: 7d
      PORT: 8080
      NODE_ENV: production
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - '8080:8080'
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:8080/api/v1/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - grip-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: grip-frontend-prod
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    ports:
      - '80:80'
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - grip-network
    restart: unless-stopped

volumes:
  mysql_data:
    driver: local

networks:
  grip-network:
    driver: bridge
```

### 4. Production Environment File

Create `.env.production`:
```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password-here
MYSQL_PASSWORD=your-secure-user-password-here

# JWT Secrets (Generate strong secrets)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-2024

# Domain Configuration
COOKIE_DOMAIN=yourdomain.com
CORS_ORIGIN=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### 5. Deploy to Production

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Management Commands

### Service Management
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

### Database Management
```bash
# Access MySQL shell
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# Backup database
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p grip > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p grip < backup.sql
```

### Health Checks
```bash
# Check API health
curl http://localhost:8080/api/v1/health

# Check frontend
curl http://localhost/

# Check database connection
docker-compose -f docker-compose.prod.yml exec mysql mysqladmin ping -h localhost -u root -p
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup (Recommended)

#### Using Nginx Reverse Proxy
Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. Environment Security
- Use strong, unique passwords
- Generate secure JWT secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Use environment variables for sensitive data

## 📊 Monitoring & Logging

### 1. Log Management
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mysql

# Log rotation (add to crontab)
0 0 * * * docker system prune -f
```

### 2. Health Monitoring
```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
API_URL="http://localhost:8080/api/v1/health"
FRONTEND_URL="http://localhost/"

# Check API
if curl -f -s $API_URL > /dev/null; then
    echo "✅ API is healthy"
else
    echo "❌ API is down"
    exit 1
fi

# Check Frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is down"
    exit 1
fi

echo "✅ All services are healthy"
EOF

chmod +x health-check.sh
```

### 3. Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Monitor specific container
docker stats grip-backend-prod
```

## 🔄 Backup & Recovery

### 1. Database Backup
```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="grip_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD grip > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x backup-db.sh
```

### 2. Application Backup
```bash
# Backup application data
tar -czf gripinvest-backup-$(date +%Y%m%d).tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    .
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec mysql mysqladmin ping -h localhost -u root -p

# Check database logs
docker-compose -f docker-compose.prod.yml logs mysql
```

#### 2. Backend API Issues
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Test API endpoint
curl http://localhost:8080/api/v1/health
```

#### 3. Frontend Issues
```bash
# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Test frontend
curl http://localhost/
```

#### 4. Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :80

# Kill conflicting processes
sudo kill -9 <PID>
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_transaction_logs_created_at ON transaction_logs(created_at);
```

#### 2. Application Optimization
```bash
# Increase Node.js memory limit
docker-compose -f docker-compose.prod.yml exec backend node --max-old-space-size=4096 dist/server.js
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Use load balancer (nginx)
# Configure nginx upstream for multiple backend instances
```

### Vertical Scaling
```bash
# Increase container resources
docker-compose -f docker-compose.prod.yml up -d --scale backend=1 --scale frontend=1
```

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database passwords changed
- [ ] JWT secrets generated
- [ ] CORS origins configured
- [ ] Firewall rules applied

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Database accessible
- [ ] Logs being generated
- [ ] Backup scripts working

### Security
- [ ] HTTPS enabled
- [ ] Strong passwords used
- [ ] JWT secrets secure
- [ ] CORS properly configured
- [ ] Firewall active
- [ ] Regular backups scheduled

## 📞 Support

### Logs Location
- **Backend**: `docker-compose logs backend`
- **Frontend**: `docker-compose logs frontend`
- **Database**: `docker-compose logs mysql`

### Health Endpoints
- **API Health**: `http://localhost:8080/api/v1/health`
- **Frontend**: `http://localhost/`

### Default Credentials
- **Admin Email**: `admin@gripinvest.com`
- **Admin Password**: `admin123` (Change in production!)

---

**🎉 Congratulations! Your GripInvest platform is now deployed and ready for production use!**
