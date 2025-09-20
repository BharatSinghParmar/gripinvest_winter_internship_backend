#!/bin/bash

# GripInvest Docker Setup Script
# This script helps manage the Docker deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to start services
start_services() {
    print_status "Starting GripInvest services..."
    docker-compose up -d
    print_success "Services started successfully"
}

# Function to stop services
stop_services() {
    print_status "Stopping GripInvest services..."
    docker-compose down
    print_success "Services stopped successfully"
}

# Function to restart services
restart_services() {
    print_status "Restarting GripInvest services..."
    docker-compose restart
    print_success "Services restarted successfully"
}

# Function to build services
build_services() {
    print_status "Building GripInvest services..."
    docker-compose build --no-cache
    print_success "Services built successfully"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    print_status "Running migrations..."
    docker-compose exec backend npx prisma migrate deploy
    print_status "Seeding database..."
    docker-compose exec backend npx prisma db seed
    print_success "Database setup completed"
}

# Function to show logs
show_logs() {
    print_status "Showing logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream
}

# Function to clean everything
clean_all() {
    print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up everything..."
        docker-compose down -v --rmi all
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    echo "GripInvest Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  build       Build all services"
    echo "  setup       Setup database (migrations + seed)"
    echo "  logs        Show logs"
    echo "  status      Show service status and resource usage"
    echo "  clean       Clean everything (containers, networks, volumes)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start all services"
    echo "  $0 setup    # Setup database after starting services"
    echo "  $0 logs     # View logs"
    echo "  $0 status   # Check status"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_services
            ;;
        setup)
            setup_database
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
