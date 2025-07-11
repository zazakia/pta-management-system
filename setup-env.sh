#!/bin/bash

# Environment Variables Setup Script
# This script helps you set up environment variables for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to prompt for input
prompt_input() {
    local var_name=$1
    local description=$2
    local is_secret=${3:-false}
    
    echo -e "${BLUE}Enter $description:${NC}"
    if [ "$is_secret" = true ]; then
        read -s value
        echo
    else
        read value
    fi
    
    if [ -n "$value" ]; then
        export $var_name="$value"
        echo "export $var_name=\"$value\"" >> ~/.bashrc
        print_success "$var_name set successfully"
    else
        print_warning "$var_name skipped"
    fi
}

# Main setup function
setup_environment() {
    print_status "Setting up environment variables for deployment..."
    
    # Backup existing .bashrc
    if [ -f ~/.bashrc ]; then
        cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)
        print_status "Backed up existing .bashrc"
    fi
    
    echo -e "\n# PTA Management System Deployment Variables" >> ~/.bashrc
    echo -e "# Added on $(date)" >> ~/.bashrc
    
    # Netlify setup
    echo -e "\n${YELLOW}=== Netlify Setup ===${NC}"
    echo "Get your tokens from: https://app.netlify.com/user/applications#personal-access-tokens"
    prompt_input "NETLIFY_AUTH_TOKEN" "Netlify Auth Token" true
    prompt_input "NETLIFY_SITE_ID" "Netlify Site ID" false
    
    # Vercel setup
    echo -e "\n${YELLOW}=== Vercel Setup ===${NC}"
    echo "Get your tokens from: https://vercel.com/account/tokens"
    prompt_input "VERCEL_TOKEN" "Vercel Token" true
    prompt_input "VERCEL_ORG_ID" "Vercel Organization ID (optional)" false
    prompt_input "VERCEL_PROJECT_ID" "Vercel Project ID (optional)" false
    
    # Supabase setup
    echo -e "\n${YELLOW}=== Supabase Setup ===${NC}"
    echo "Get your keys from: https://app.supabase.com/project/_/settings/api"
    prompt_input "NEXT_PUBLIC_SUPABASE_URL" "Supabase URL" false
    prompt_input "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon Key" true
    prompt_input "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key" true
    
    # Base URL setup
    echo -e "\n${YELLOW}=== Application URL ===${NC}"
    prompt_input "NEXT_PUBLIC_BASE_URL" "Application Base URL (e.g., https://yourapp.vercel.app)" false
    
    # Reload environment
    source ~/.bashrc
    
    print_success "Environment variables setup complete!"
    print_status "Run 'source ~/.bashrc' or restart your terminal to apply changes"
}

# Function to check current environment
check_environment() {
    print_status "Checking current environment variables..."
    
    local vars=("NETLIFY_AUTH_TOKEN" "NETLIFY_SITE_ID" "VERCEL_TOKEN" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
    
    for var in "${vars[@]}"; do
        if [ -n "${!var}" ]; then
            if [[ $var == *"TOKEN"* ]] || [[ $var == *"KEY"* ]]; then
                print_success "$var is set (hidden)"
            else
                print_success "$var is set: ${!var}"
            fi
        else
            print_warning "$var is not set"
        fi
    done
}

# Function to load from .env file
load_from_env() {
    local env_file=${1:-.env.deploy}
    
    if [ -f "$env_file" ]; then
        print_status "Loading environment variables from $env_file..."
        
        # Load and export variables
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ $line =~ ^#.*$ ]] || [[ -z "$line" ]]; then
                continue
            fi
            
            # Export the variable
            if [[ $line =~ ^[A-Z_]+=.* ]]; then
                export "$line"
                var_name=$(echo "$line" | cut -d'=' -f1)
                echo "export $line" >> ~/.bashrc
                print_success "Loaded $var_name"
            fi
        done < "$env_file"
        
        source ~/.bashrc
        print_success "Environment variables loaded from $env_file"
    else
        print_error "Environment file $env_file not found"
        print_status "Copy .env.deploy.example to .env.deploy and fill in your values"
    fi
}

# Function to show help
show_help() {
    cat << EOF
Environment Variables Setup Script

Usage: $0 [OPTION]

Options:
  -h, --help      Show this help message
  -s, --setup     Interactive setup of environment variables
  -c, --check     Check current environment variables
  -l, --load      Load from .env.deploy file

Examples:
  $0 --setup      Interactive setup
  $0 --check      Check current variables
  $0 --load       Load from .env.deploy file

Required Variables:
  NETLIFY_AUTH_TOKEN      - Netlify authentication token
  NETLIFY_SITE_ID         - Netlify site ID
  VERCEL_TOKEN            - Vercel authentication token
  NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key

EOF
}

# Main execution
case "${1:-}" in
    -h|--help)
        show_help
        ;;
    -s|--setup)
        setup_environment
        ;;
    -c|--check)
        check_environment
        ;;
    -l|--load)
        load_from_env "${2:-}"
        ;;
    *)
        echo "Usage: $0 [--setup|--check|--load|--help]"
        echo "Run '$0 --help' for more information"
        ;;
esac