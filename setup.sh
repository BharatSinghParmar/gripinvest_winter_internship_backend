#!/bin/bash

echo "🚀 Setting up Grip Invest Mini Platform - Prototype 1"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment file..."
    cp backend/env.example backend/.env
    echo "✅ Environment file created at backend/.env"
else
    echo "✅ Environment file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

echo "✅ Backend dependencies installed"

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 10

# Check if MySQL is ready
for i in {1..30}; do
    if docker-compose exec mysql mysqladmin ping -h localhost -u root -proot --silent; then
        echo "✅ MySQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MySQL failed to start within 5 minutes"
        docker-compose logs mysql
        exit 1
    fi
    echo "⏳ Waiting for MySQL... ($i/30)"
    sleep 10
done

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    docker-compose logs backend
    exit 1
fi

# Seed the database
echo "🌱 Seeding database..."
docker-compose exec backend npm run db:seed
if [ $? -ne 0 ]; then
    echo "❌ Database seeding failed"
    docker-compose logs backend
    exit 1
fi

echo "✅ Database setup complete"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Test the API
echo "🧪 Testing API..."
if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/v1/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo "✅ API health check passed"
    else
        echo "❌ API health check failed"
        echo "Response: $HEALTH_RESPONSE"
    fi
else
    echo "⚠️ curl not available, skipping API test"
fi

echo ""
echo "🎉 Setup complete! Your Grip Invest Mini Platform is ready."
echo ""
echo "📊 Services:"
echo "  - Backend API: http://localhost:8080"
echo "  - Health Check: http://localhost:8080/api/v1/health"
echo "  - MySQL: localhost:3306"
echo ""
echo "🧪 Test the API:"
echo "  - Open frontend-stub.html in your browser"
echo "  - Or run: node test-api.js"
echo ""
echo "👤 Default users:"
echo "  - Admin: admin@gripinvest.com / Admin123!"
echo "  - User 1: user1@example.com / User123!"
echo "  - User 2: user2@example.com / User123!"
echo ""
echo "🛠️ Development commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo "📚 Next steps:"
echo "  - Review the README.md for detailed documentation"
echo "  - Check the API endpoints in the architecture spec"
echo "  - Ready for Prototype 2: Products module"
