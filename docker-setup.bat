@echo off
REM GripInvest Docker Setup Script for Windows
REM This script helps manage the Docker deployment

setlocal enabledelayedexpansion

REM Function to print colored output
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker Desktop and try again."
    exit /b 1
)
call :print_success "Docker is running"
goto :eof

REM Function to start services
:start_services
call :print_status "Starting GripInvest services..."
docker-compose up -d
if errorlevel 1 (
    call :print_error "Failed to start services"
    exit /b 1
)
call :print_success "Services started successfully"
goto :eof

REM Function to stop services
:stop_services
call :print_status "Stopping GripInvest services..."
docker-compose down
call :print_success "Services stopped successfully"
goto :eof

REM Function to restart services
:restart_services
call :print_status "Restarting GripInvest services..."
docker-compose restart
call :print_success "Services restarted successfully"
goto :eof

REM Function to build services
:build_services
call :print_status "Building GripInvest services..."
docker-compose build --no-cache
if errorlevel 1 (
    call :print_error "Failed to build services"
    exit /b 1
)
call :print_success "Services built successfully"
goto :eof

REM Function to setup database
:setup_database
call :print_status "Setting up database..."
call :print_status "Running migrations..."
docker-compose exec backend npx prisma migrate deploy
if errorlevel 1 (
    call :print_error "Failed to run migrations"
    exit /b 1
)
call :print_status "Seeding database..."
docker-compose exec backend npx prisma db seed
if errorlevel 1 (
    call :print_error "Failed to seed database"
    exit /b 1
)
call :print_success "Database setup completed"
goto :eof

REM Function to show logs
:show_logs
call :print_status "Showing logs (Press Ctrl+C to exit)..."
docker-compose logs -f
goto :eof

REM Function to show status
:show_status
call :print_status "Service Status:"
docker-compose ps
echo.
call :print_status "Resource Usage:"
docker stats --no-stream
goto :eof

REM Function to clean everything
:clean_all
call :print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
set /p response=
if /i "%response%"=="y" (
    call :print_status "Cleaning up everything..."
    docker-compose down -v --rmi all
    call :print_success "Cleanup completed"
) else (
    call :print_status "Cleanup cancelled"
)
goto :eof

REM Function to show help
:show_help
echo GripInvest Docker Management Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   start       Start all services
echo   stop        Stop all services
echo   restart     Restart all services
echo   build       Build all services
echo   setup       Setup database (migrations + seed)
echo   logs        Show logs
echo   status      Show service status and resource usage
echo   clean       Clean everything (containers, networks, volumes)
echo   help        Show this help message
echo.
echo Examples:
echo   %0 start    # Start all services
echo   %0 setup    # Setup database after starting services
echo   %0 logs     # View logs
echo   %0 status   # Check status
goto :eof

REM Main script logic
:main
call :check_docker
if errorlevel 1 exit /b 1

if "%1"=="start" (
    call :start_services
) else if "%1"=="stop" (
    call :stop_services
) else if "%1"=="restart" (
    call :restart_services
) else if "%1"=="build" (
    call :build_services
) else if "%1"=="setup" (
    call :setup_database
) else if "%1"=="logs" (
    call :show_logs
) else if "%1"=="status" (
    call :show_status
) else if "%1"=="clean" (
    call :clean_all
) else if "%1"=="help" (
    call :show_help
) else if "%1"=="--help" (
    call :show_help
) else if "%1"=="-h" (
    call :show_help
) else if "%1"=="" (
    call :show_help
) else (
    call :print_error "Unknown command: %1"
    call :show_help
    exit /b 1
)

goto :eof

REM Run main function
call :main %*
