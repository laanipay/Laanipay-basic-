#!/bin/bash

# LPN PRO Binary MLM Platform Setup Script
# This script automates the installation and setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node -v)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 16
        if node -pe "parseInt(process.version.slice(1)) >= 16"; then
            return 0
        else
            print_error "Node.js version 16 or higher is required"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        return 1
    fi
}

# Check if MongoDB is running
check_mongodb() {
    if command -v mongosh >/dev/null 2>&1; then
        print_status "MongoDB CLI tools found"
        
        # Try to connect to MongoDB
        if mongosh --eval "db.runCommand('ismaster')" >/dev/null 2>&1; then
            print_status "MongoDB is running and accessible"
            return 0
        else
            print_warning "MongoDB is not running. Please start MongoDB service."
            print_status "You can also use MongoDB Atlas cloud database"
            return 1
        fi
    else
        print_warning "MongoDB CLI tools not found locally"
        print_status "You can use MongoDB Atlas cloud database"
        return 1
    fi
}

# Setup backend
setup_backend() {
    print_header "Setting up Backend"
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Install development dependencies
    print_status "Installing development dependencies..."
    npm install --save-dev nodemon jest eslint
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cp .env.example .env
        print_warning "Please update the .env file with your configuration"
    else
        print_status ".env file already exists"
    fi
    
    # Create uploads directory
    mkdir -p uploads
    
    print_status "Backend setup completed!"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_header "Setting up Frontend"
    
    cd frontend
    
    # Install additional dependencies if needed
    print_status "Installing any missing frontend dependencies..."
    
    # Create .env file for frontend
    if [ ! -f .env ]; then
        print_status "Creating frontend .env file..."
        echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    else
        print_status "Frontend .env file already exists"
    fi
    
    print_status "Frontend setup completed!"
    cd ..
}

# Initialize database
init_database() {
    print_header "Initializing Database"
    
    cd backend
    
    print_status "Running database initialization script..."
    node scripts/init-database.js
    
    print_status "Database initialization completed!"
    cd ..
}

# Create start scripts
create_start_scripts() {
    print_header "Creating Start Scripts"
    
    # Create start-backend script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting LPN PRO Backend Server..."
cd backend
npm run dev
EOF
    chmod +x start-backend.sh
    
    # Create start-frontend script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting LPN PRO Frontend..."
cd frontend
npm start
EOF
    chmod +x start-frontend.sh
    
    # Create start-all script
    cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting LPN PRO Full Stack Application..."

# Function to start backend in background
start_backend() {
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    sleep 5  # Wait for backend to start
    cd frontend
    npm start
}

# Trap to kill background processes on exit
trap 'kill $BACKEND_PID' EXIT

echo "Starting backend..."
start_backend

echo "Starting frontend..."
start_frontend
EOF
    chmod +x start-all.sh
    
    print_status "Start scripts created successfully!"
}

# Display usage instructions
show_usage_instructions() {
    print_header "Setup Completed Successfully! 🎉"
    
    echo ""
    echo -e "${GREEN}Your LPN PRO MLM Platform is ready to use!${NC}"
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo "  1. Start the full application:"
    echo -e "     ${YELLOW}./start-all.sh${NC}"
    echo ""
    echo "  2. Or start services individually:"
    echo -e "     Backend: ${YELLOW}./start-backend.sh${NC}"
    echo -e "     Frontend: ${YELLOW}./start-frontend.sh${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  • Frontend: http://localhost:3000"
    echo "  • Backend API: http://localhost:5000/api"
    echo "  • Admin Panel: http://localhost:3000/admin"
    echo ""
    echo -e "${BLUE}Default Admin Credentials:${NC}"
    echo "  • Email: admin@lpnpro.com"
    echo "  • Password: admin123456"
    echo ""
    echo -e "${BLUE}Sample User Credentials (Development):${NC}"
    echo "  • Member: john@example.com / password123"
    echo "  • Coordinator: jane@example.com / password123"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "  • Update backend/.env with your configuration"
    echo "  • Configure payment gateway credentials"
    echo "  • Set up email service for notifications"
    echo "  • Change default admin password"
    echo ""
    echo -e "${GREEN}Documentation:${NC} Check README.md for detailed instructions"
    echo ""
}

# Main setup function
main() {
    print_header "LPN PRO Binary MLM Platform Setup"
    
    print_status "Starting setup process..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_nodejs; then
        print_error "Node.js requirement not met. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    check_mongodb  # This is a warning, not a failure
    
    # Setup backend
    setup_backend
    
    # Setup frontend  
    setup_frontend
    
    # Initialize database
    print_status "Initializing database..."
    if init_database; then
        print_status "Database initialized successfully"
    else
        print_warning "Database initialization failed. You may need to set it up manually."
    fi
    
    # Create convenience scripts
    create_start_scripts
    
    # Show final instructions
    show_usage_instructions
}

# Run main function
main "$@"