@echo off
echo 🚀 Setting up Grip Invest Mini Platform - Prototype 1
echo ==================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+ and try again.
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create .env file if it doesn't exist
if not exist backend\.env (
    echo 📝 Creating environment file...
    copy backend\env.example backend\.env
    echo ✅ Environment file created at backend\.env
) else (
    echo ✅ Environment file already exists
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)
cd ..

echo ✅ Backend dependencies installed

REM Start services with Docker Compose
echo 🐳 Starting services with Docker Compose...
docker-compose up -d

REM Wait for MySQL to be ready
echo ⏳ Waiting for MySQL to be ready...
timeout /t 15 /nobreak >nul

REM Check if MySQL is ready
echo ⏳ Checking MySQL connection...
docker-compose exec mysql mysqladmin ping -h localhost -u root -proot --silent
if %errorlevel% neq 0 (
    echo ❌ MySQL failed to start properly
    docker-compose logs mysql
    exit /b 1
)

echo ✅ MySQL is ready

REM Run database migrations
echo 🗄️ Running database migrations...
docker-compose exec backend npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ❌ Database migration failed
    docker-compose logs backend
    exit /b 1
)

REM Seed the database
echo 🌱 Seeding database...
docker-compose exec backend npm run db:seed
if %errorlevel% neq 0 (
    echo ❌ Database seeding failed
    docker-compose logs backend
    exit /b 1
)

echo ✅ Database setup complete

REM Wait for backend to be ready
echo ⏳ Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

REM Test the API
echo 🧪 Testing API...
curl -s http://localhost:8080/api/v1/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API health check passed
) else (
    echo ⚠️ API health check failed - service may still be starting
)

echo.
echo 🎉 Setup complete! Your Grip Invest Mini Platform is ready.
echo.
echo 📊 Services:
echo   - Backend API: http://localhost:8080
echo   - Health Check: http://localhost:8080/api/v1/health
echo   - MySQL: localhost:3306
echo.
echo 🧪 Test the API:
echo   - Open frontend-stub.html in your browser
echo   - Or run: node test-api.js
echo.
echo 👤 Default users:
echo   - Admin: admin@gripinvest.com / Admin123!
echo   - User 1: user1@example.com / User123!
echo   - User 2: user2@example.com / User123!
echo.
echo 🛠️ Development commands:
echo   - View logs: docker-compose logs -f
echo   - Stop services: docker-compose down
echo   - Restart: docker-compose restart
echo.
echo 📚 Next steps:
echo   - Review the README.md for detailed documentation
echo   - Check the API endpoints in the architecture spec
echo   - Ready for Prototype 2: Products module

pause
