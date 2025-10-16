#!/bin/bash

###############################################################################
# DAWG AI - Redis Setup Script
#
# This script sets up Redis for job queue and WebSocket clustering
#
# Usage:
#   ./scripts/setup-redis.sh [local|docker|railway|aws]
#
# Options:
#   local   - Install Redis locally (macOS/Linux)
#   docker  - Run Redis in Docker container
#   railway - Set up Redis on Railway
#   aws     - Set up Redis on AWS ElastiCache
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup local Redis (macOS/Linux)
setup_local() {
    print_info "Setting up Redis locally..."

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_info "Detected macOS"

        # Check if Homebrew is installed
        if ! command_exists brew; then
            print_error "Homebrew is not installed. Install from https://brew.sh"
            exit 1
        fi

        # Install Redis
        if ! command_exists redis-server; then
            print_info "Installing Redis via Homebrew..."
            brew install redis
        else
            print_info "Redis is already installed"
        fi

        # Start Redis service
        print_info "Starting Redis service..."
        brew services start redis

        # Wait for Redis to start
        sleep 2

    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        print_info "Detected Linux"

        # Check for package manager
        if command_exists apt-get; then
            # Debian/Ubuntu
            print_info "Installing Redis via apt-get..."
            sudo apt-get update
            sudo apt-get install -y redis-server
            sudo systemctl start redis-server
            sudo systemctl enable redis-server
        elif command_exists yum; then
            # CentOS/RHEL
            print_info "Installing Redis via yum..."
            sudo yum install -y redis
            sudo systemctl start redis
            sudo systemctl enable redis
        else
            print_error "Unsupported package manager. Please install Redis manually."
            exit 1
        fi
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi

    # Test connection
    print_info "Testing Redis connection..."
    if redis-cli ping | grep -q PONG; then
        print_success "Redis is running and responding to commands"
    else
        print_error "Redis is not responding. Check logs with: brew services log redis (macOS) or journalctl -u redis (Linux)"
        exit 1
    fi

    # Get Redis info
    print_info "Redis Configuration:"
    echo "  URL: redis://localhost:6379"
    echo "  Version: $(redis-cli --version | awk '{print $2}')"
    echo "  Memory: $(redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"

    # Update .env file
    print_info "Updating .env file..."
    if [ -f .env ]; then
        if grep -q "^REDIS_URL=" .env; then
            # Update existing entry
            sed -i.bak 's|^REDIS_URL=.*|REDIS_URL=redis://localhost:6379|' .env
        else
            # Add new entry
            echo "REDIS_URL=redis://localhost:6379" >> .env
        fi
        print_success ".env file updated with REDIS_URL=redis://localhost:6379"
    else
        print_warning ".env file not found. Please manually add: REDIS_URL=redis://localhost:6379"
    fi

    print_success "Redis setup complete!"
}

# Setup Redis in Docker
setup_docker() {
    print_info "Setting up Redis in Docker..."

    # Check if Docker is installed
    if ! command_exists docker; then
        print_error "Docker is not installed. Install from https://www.docker.com/get-started"
        exit 1
    fi

    # Check if container already exists
    if docker ps -a | grep -q dawg-redis; then
        print_warning "Redis container 'dawg-redis' already exists"
        read -p "Remove and recreate? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Stopping and removing existing container..."
            docker stop dawg-redis 2>/dev/null || true
            docker rm dawg-redis 2>/dev/null || true
        else
            print_info "Using existing container..."
            docker start dawg-redis
            print_success "Redis container started"
            return 0
        fi
    fi

    # Run Redis container
    print_info "Running Redis container..."
    docker run -d \
        --name dawg-redis \
        -p 6379:6379 \
        -v dawg-redis-data:/data \
        redis:7-alpine redis-server --appendonly yes

    # Wait for Redis to start
    print_info "Waiting for Redis to start..."
    sleep 3

    # Test connection
    print_info "Testing Redis connection..."
    if docker exec dawg-redis redis-cli ping | grep -q PONG; then
        print_success "Redis is running in Docker"
    else
        print_error "Redis is not responding. Check logs with: docker logs dawg-redis"
        exit 1
    fi

    # Get Redis info
    print_info "Redis Configuration:"
    echo "  URL: redis://localhost:6379"
    echo "  Container: dawg-redis"
    echo "  Version: $(docker exec dawg-redis redis-cli --version | awk '{print $2}')"

    # Update .env file
    print_info "Updating .env file..."
    if [ -f .env ]; then
        if grep -q "^REDIS_URL=" .env; then
            sed -i.bak 's|^REDIS_URL=.*|REDIS_URL=redis://localhost:6379|' .env
        else
            echo "REDIS_URL=redis://localhost:6379" >> .env
        fi
        print_success ".env file updated"
    fi

    # Show useful commands
    print_info "Useful Docker commands:"
    echo "  Start:   docker start dawg-redis"
    echo "  Stop:    docker stop dawg-redis"
    echo "  Logs:    docker logs -f dawg-redis"
    echo "  Shell:   docker exec -it dawg-redis redis-cli"

    print_success "Redis setup complete!"
}

# Setup Redis on Railway
setup_railway() {
    print_info "Setting up Redis on Railway..."

    # Check if Railway CLI is installed
    if ! command_exists railway; then
        print_error "Railway CLI is not installed."
        print_info "Install with: npm install -g @railway/cli"
        exit 1
    fi

    # Check if logged in
    print_info "Checking Railway authentication..."
    if ! railway whoami &>/dev/null; then
        print_warning "Not logged in to Railway"
        print_info "Logging in..."
        railway login
    fi

    # Check if project is linked
    if ! railway status &>/dev/null; then
        print_warning "No Railway project linked"
        print_info "Please link a project first with: railway link"
        exit 1
    fi

    # Add Redis service
    print_info "Adding Redis service to Railway project..."
    railway add redis

    # Wait for service to be provisioned
    print_info "Waiting for Redis to be provisioned (this may take a minute)..."
    sleep 10

    # Get Redis URL
    print_info "Fetching Redis URL..."
    REDIS_URL=$(railway variables get REDIS_URL 2>/dev/null || railway variables | grep REDIS_URL | cut -d= -f2-)

    if [ -z "$REDIS_URL" ]; then
        print_error "Could not retrieve REDIS_URL from Railway"
        print_info "Please run: railway variables"
        exit 1
    fi

    print_success "Redis service created on Railway"
    print_info "Redis URL: $REDIS_URL"

    # Update .env file
    print_info "Updating .env file..."
    if [ -f .env ]; then
        if grep -q "^REDIS_URL=" .env; then
            sed -i.bak "s|^REDIS_URL=.*|REDIS_URL=$REDIS_URL|" .env
        else
            echo "REDIS_URL=$REDIS_URL" >> .env
        fi
        print_success ".env file updated"
    fi

    # Test connection (if redis-cli is available locally)
    if command_exists redis-cli; then
        print_info "Testing connection..."
        if redis-cli -u "$REDIS_URL" ping | grep -q PONG; then
            print_success "Connection successful"
        else
            print_warning "Connection test failed. This is normal if connecting from outside Railway network."
        fi
    fi

    print_success "Railway Redis setup complete!"
    print_info "View in dashboard: railway open"
}

# Setup Redis on AWS ElastiCache
setup_aws() {
    print_info "Setting up Redis on AWS ElastiCache..."

    # Check if AWS CLI is installed
    if ! command_exists aws; then
        print_error "AWS CLI is not installed."
        print_info "Install from: https://aws.amazon.com/cli/"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        print_error "AWS credentials not configured."
        print_info "Run: aws configure"
        exit 1
    fi

    # Get AWS account info
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=${AWS_REGION:-us-east-1}

    print_info "AWS Account: $ACCOUNT_ID"
    print_info "Region: $REGION"

    # Create cluster
    CLUSTER_ID="dawg-ai-redis-$(date +%Y%m%d)"

    print_info "Creating ElastiCache Redis cluster: $CLUSTER_ID..."

    aws elasticache create-cache-cluster \
        --cache-cluster-id "$CLUSTER_ID" \
        --engine redis \
        --engine-version 7.0 \
        --cache-node-type cache.t3.micro \
        --num-cache-nodes 1 \
        --region "$REGION" \
        --tags Key=Project,Value=DAWG-AI Key=Environment,Value=Production

    print_info "Waiting for cluster to be available (this may take 5-10 minutes)..."
    aws elasticache wait cache-cluster-available \
        --cache-cluster-id "$CLUSTER_ID" \
        --region "$REGION"

    # Get endpoint
    ENDPOINT=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "$CLUSTER_ID" \
        --show-cache-node-info \
        --region "$REGION" \
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
        --output text)

    PORT=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "$CLUSTER_ID" \
        --show-cache-node-info \
        --region "$REGION" \
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Port' \
        --output text)

    REDIS_URL="redis://$ENDPOINT:$PORT"

    print_success "ElastiCache Redis cluster created!"
    print_info "Cluster ID: $CLUSTER_ID"
    print_info "Endpoint: $ENDPOINT:$PORT"
    print_info "Redis URL: $REDIS_URL"

    # Update .env file
    print_info "Updating .env file..."
    if [ -f .env ]; then
        if grep -q "^REDIS_URL=" .env; then
            sed -i.bak "s|^REDIS_URL=.*|REDIS_URL=$REDIS_URL|" .env
        else
            echo "REDIS_URL=$REDIS_URL" >> .env
        fi
        print_success ".env file updated"
    fi

    print_warning "IMPORTANT: Configure security groups to allow access from your application servers"
    print_info "See AWS Console → ElastiCache → $CLUSTER_ID → Modify → Security Groups"

    print_success "AWS ElastiCache setup complete!"
}

# Show usage
show_usage() {
    echo "Usage: $0 [local|docker|railway|aws]"
    echo ""
    echo "Options:"
    echo "  local    - Install and run Redis locally (macOS/Linux)"
    echo "  docker   - Run Redis in Docker container"
    echo "  railway  - Set up Redis on Railway platform"
    echo "  aws      - Set up Redis on AWS ElastiCache"
    echo ""
    echo "Examples:"
    echo "  $0 local       # For local development"
    echo "  $0 docker      # For local development with Docker"
    echo "  $0 railway     # For production on Railway"
    echo "  $0 aws         # For production on AWS"
}

# Main script
main() {
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║   DAWG AI - Redis Setup Script       ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""

    # Check argument
    if [ $# -eq 0 ]; then
        print_error "No setup option specified"
        echo ""
        show_usage
        exit 1
    fi

    SETUP_TYPE=$1

    case $SETUP_TYPE in
        local)
            setup_local
            ;;
        docker)
            setup_docker
            ;;
        railway)
            setup_railway
            ;;
        aws)
            setup_aws
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Invalid setup option: $SETUP_TYPE"
            echo ""
            show_usage
            exit 1
            ;;
    esac

    echo ""
    print_success "✓ Redis is ready for DAWG AI!"
    echo ""
    print_info "Next steps:"
    echo "  1. Verify REDIS_URL in .env file"
    echo "  2. Start your application: npm run dev:server"
    echo "  3. Check Redis connection in application logs"
    echo ""
}

# Run main function
main "$@"
