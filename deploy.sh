#!/bin/bash

# Deploy Script for PTA Management System
# Supports GitHub, Netlify, and Vercel deployments with workflow updates

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pta-management-system"
BUILD_DIR=".next"
DIST_DIR="out"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check environment variables
check_env_vars() {
    local platform=$1
    case $platform in
        "netlify")
            if [[ -z "$NETLIFY_AUTH_TOKEN" || -z "$NETLIFY_SITE_ID" ]]; then
                print_error "Netlify deployment requires NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID environment variables"
                echo "Set them with:"
                echo "export NETLIFY_AUTH_TOKEN=your_token_here"
                echo "export NETLIFY_SITE_ID=your_site_id_here"
                return 1
            fi
            ;;
        "vercel")
            if [[ -z "$VERCEL_TOKEN" ]]; then
                print_error "Vercel deployment requires VERCEL_TOKEN environment variable"
                echo "Set it with:"
                echo "export VERCEL_TOKEN=your_token_here"
                return 1
            fi
            ;;
    esac
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    if command_exists pnpm; then
        pnpm install
    elif command_exists npm; then
        npm install
    else
        print_error "Neither pnpm nor npm found. Please install Node.js and npm/pnpm."
        exit 1
    fi
    print_success "Dependencies installed"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        if command_exists pnpm; then
            pnpm test -- --passWithNoTests
        else
            npm test -- --passWithNoTests
        fi
        print_success "Tests passed"
    else
        print_warning "No tests found, skipping..."
    fi
}

# Function to build the project
build_project() {
    print_status "Building project..."
    if command_exists pnpm; then
        pnpm build
    else
        npm run build
    fi
    print_success "Project built successfully"
}

# Function to create GitHub workflow files
create_github_workflows() {
    print_status "Creating GitHub workflow files..."
    
    # Create .github/workflows directory
    mkdir -p .github/workflows
    
    # CI/CD workflow
    cat > .github/workflows/ci-cd.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test -- --passWithNoTests
    
    - name: Build project
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: .next/

  deploy-netlify:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build
    
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './out'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
        enable-pull-request-comment: false
        enable-commit-comment: true
        overwrites-pull-request-comment: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-vercel:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
EOF

    # Security workflow
    cat > .github/workflows/security.yml << 'EOF'
name: Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/init@v2
      with:
        languages: 'javascript'
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
EOF

    # Dependabot configuration
    cat > .github/dependabot.yml << 'EOF'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "maintainer-username"
    assignees:
      - "maintainer-username"
    commit-message:
      prefix: "chore"
      include: "scope"
EOF

    print_success "GitHub workflows created"
}

# Function to deploy to GitHub
deploy_github() {
    print_status "Deploying to GitHub..."
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
        print_status "Initializing git repository..."
        git init
        git branch -M main
    fi
    
    # Add all files
    git add .
    
    # Commit changes
    if git diff --cached --quiet; then
        print_warning "No changes to commit"
    else
        git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
        print_success "Changes committed"
    fi
    
    # Push to remote if exists
    if git remote get-url origin >/dev/null 2>&1; then
        git push origin main
        print_success "Pushed to GitHub"
    else
        print_warning "No remote origin found. Add remote with:"
        print_warning "git remote add origin https://github.com/username/repo.git"
    fi
}

# Function to deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    check_env_vars "netlify"
    
    # Install Netlify CLI if not present
    if ! command_exists netlify; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Build for static export
    print_status "Building for static export..."
    if command_exists pnpm; then
        pnpm build
    else
        npm run build
    fi
    
    # Deploy to Netlify
    netlify deploy --prod --dir=out --auth="$NETLIFY_AUTH_TOKEN" --site="$NETLIFY_SITE_ID"
    
    print_success "Deployed to Netlify"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    check_env_vars "vercel"
    
    # Install Vercel CLI if not present
    if ! command_exists vercel; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Login to Vercel
    vercel login --token="$VERCEL_TOKEN"
    
    # Deploy to Vercel
    vercel --prod --token="$VERCEL_TOKEN"
    
    print_success "Deployed to Vercel"
}

# Function to create Netlify config
create_netlify_config() {
    print_status "Creating Netlify configuration..."
    
    cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"
  NEXT_TELEMETRY_DISABLED = "1"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
EOF

    print_success "Netlify configuration created"
}

# Function to create Vercel config
create_vercel_config() {
    print_status "Creating Vercel configuration..."
    
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "functions": {
    "app/**/*.js": {
      "runtime": "@vercel/node"
    }
  }
}
EOF

    print_success "Vercel configuration created"
}

# Function to update package.json scripts
update_package_scripts() {
    print_status "Updating package.json scripts..."
    
    # Create a temporary file with updated scripts
    cat > temp_package.json << 'EOF'
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest --passWithNoTests",
    "export": "next export",
    "deploy": "./deploy.sh",
    "deploy:github": "./deploy.sh github",
    "deploy:netlify": "./deploy.sh netlify", 
    "deploy:vercel": "./deploy.sh vercel",
    "deploy:all": "./deploy.sh all"
  }
}
EOF

    # Merge with existing package.json
    if command_exists jq; then
        jq -s '.[0] * .[1]' package.json temp_package.json > package_new.json
        mv package_new.json package.json
    else
        print_warning "jq not found. Please manually add deploy scripts to package.json"
    fi
    
    rm -f temp_package.json
    print_success "Package.json scripts updated"
}

# Function to show help
show_help() {
    cat << EOF
Deploy Script for PTA Management System

Usage: $0 [OPTION] [PLATFORM]

Options:
  -h, --help     Show this help message
  -s, --setup    Setup deployment configurations
  -t, --test     Run tests before deployment
  -b, --build    Build project only

Platforms:
  github         Deploy to GitHub (git push)
  netlify        Deploy to Netlify
  vercel         Deploy to Vercel
  all            Deploy to all platforms

Examples:
  $0 --setup           Setup all deployment configs
  $0 github            Deploy to GitHub only
  $0 netlify           Deploy to Netlify only
  $0 vercel            Deploy to Vercel only
  $0 all               Deploy to all platforms
  $0 --test github     Run tests then deploy to GitHub

Environment Variables:
  NETLIFY_AUTH_TOKEN   - Netlify authentication token
  NETLIFY_SITE_ID      - Netlify site ID
  VERCEL_TOKEN         - Vercel authentication token
  VERCEL_ORG_ID        - Vercel organization ID
  VERCEL_PROJECT_ID    - Vercel project ID

EOF
}

# Main execution
main() {
    print_status "Starting deployment process..."
    
    # Parse command line arguments
    SETUP=false
    RUN_TESTS=false
    BUILD_ONLY=false
    PLATFORM=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -s|--setup)
                SETUP=true
                shift
                ;;
            -t|--test)
                RUN_TESTS=true
                shift
                ;;
            -b|--build)
                BUILD_ONLY=true
                shift
                ;;
            github|netlify|vercel|all)
                PLATFORM=$1
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Setup mode
    if [ "$SETUP" = true ]; then
        print_status "Setting up deployment configurations..."
        create_github_workflows
        create_netlify_config
        create_vercel_config
        update_package_scripts
        print_success "Setup complete! Don't forget to set environment variables."
        exit 0
    fi
    
    # Check if platform is specified (unless build-only mode)
    if [ -z "$PLATFORM" ] && [ "$BUILD_ONLY" = false ]; then
        print_error "Platform not specified. Use --help for usage information."
        exit 1
    fi
    
    # Install dependencies
    install_dependencies
    
    # Run tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # Build project
    build_project
    
    # Exit if build only
    if [ "$BUILD_ONLY" = true ]; then
        print_success "Build complete"
        exit 0
    fi
    
    # Deploy based on platform
    case $PLATFORM in
        github)
            deploy_github
            ;;
        netlify)
            deploy_netlify
            ;;
        vercel)
            deploy_vercel
            ;;
        all)
            deploy_github
            deploy_netlify
            deploy_vercel
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            exit 1
            ;;
    esac
    
    print_success "Deployment complete!"
}

# Run main function
main "$@"