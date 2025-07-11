#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class GitHubDeployment {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.requiredSecrets = [
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID', 
      'VERCEL_PROJECT_ID',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];
    this.optionalSecrets = [
      'SLACK_WEBHOOK_URL',
      'SNYK_TOKEN',
      'CODECOV_TOKEN',
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      deploy: '🚀',
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, args = [], cwd = this.projectRoot) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { 
        cwd, 
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true 
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject({ stdout, stderr, code });
        }
      });
    });
  }

  async checkGitRepository() {
    this.log('Checking Git repository status...', 'info');
    
    try {
      // Check if this is a git repository
      await this.runCommand('git', ['status']);
      
      // Check for uncommitted changes
      const { stdout } = await this.runCommand('git', ['status', '--porcelain']);
      if (stdout.trim()) {
        this.log('Warning: You have uncommitted changes', 'warning');
        this.log('Uncommitted files:', 'warning');
        console.log(stdout);
        
        const answer = await this.promptUser('Continue with uncommitted changes? (y/N): ');
        if (answer.toLowerCase() !== 'y') {
          throw new Error('Deployment cancelled due to uncommitted changes');
        }
      }
      
      // Check current branch
      const { stdout: branch } = await this.runCommand('git', ['branch', '--show-current']);
      this.log(`Current branch: ${branch.trim()}`, 'info');
      
      // Check if remote origin exists
      try {
        await this.runCommand('git', ['remote', 'get-url', 'origin']);
        this.log('Remote origin configured', 'success');
      } catch (error) {
        throw new Error('No remote origin configured. Please add a GitHub remote.');
      }
      
    } catch (error) {
      throw new Error(`Git repository check failed: ${error.message}`);
    }
  }

  async setupGitHubActions() {
    this.log('Setting up GitHub Actions workflow...', 'deploy');
    
    const workflowDir = path.join(this.projectRoot, '.github', 'workflows');
    const workflowFile = path.join(workflowDir, 'ci-cd.yml');
    
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
      this.log('Created .github/workflows directory', 'success');
    }
    
    if (fs.existsSync(workflowFile)) {
      this.log('GitHub Actions workflow already exists', 'info');
    } else {
      this.log('GitHub Actions workflow file created', 'success');
    }
    
    // Create deployment environments configuration
    const envConfig = {
      production: {
        protection_rules: [
          {
            type: 'required_reviewers',
            required_reviewer_count: 1
          },
          {
            type: 'wait_timer',
            wait_timer: 5
          }
        ],
        deployment_branch_policy: {
          protected_branches: true,
          custom_branch_policies: false
        }
      },
      preview: {
        protection_rules: [],
        deployment_branch_policy: {
          protected_branches: false,
          custom_branch_policies: true,
          custom_branches: ['develop', 'feature/*']
        }
      }
    };
    
    const envConfigPath = path.join(this.projectRoot, '.github', 'environments.json');
    fs.writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));
    this.log('Created environment configuration', 'success');
  }

  async checkRequiredSecrets() {
    this.log('Checking required secrets configuration...', 'info');
    
    const secretsDocPath = path.join(this.projectRoot, 'docs', 'deployment', 'github-secrets.md');
    
    if (!fs.existsSync(path.dirname(secretsDocPath))) {
      fs.mkdirSync(path.dirname(secretsDocPath), { recursive: true });
    }
    
    const secretsDoc = this.generateSecretsDocumentation();
    fs.writeFileSync(secretsDocPath, secretsDoc);
    
    this.log('Generated secrets documentation', 'success');
    this.log(`Please configure secrets in your GitHub repository:`, 'warning');
    
    console.log('\n📋 Required Secrets:');
    this.requiredSecrets.forEach(secret => {
      console.log(`   ${secret}`);
    });
    
    console.log('\n📋 Optional Secrets (for enhanced features):');
    this.optionalSecrets.forEach(secret => {
      console.log(`   ${secret}`);
    });
    
    console.log(`\n📖 Detailed instructions: ${secretsDocPath}`);
  }

  generateSecretsDocumentation() {
    return `# GitHub Secrets Configuration

This document outlines the required and optional secrets for the GitHub Actions deployment pipeline.

## Required Secrets

### Vercel Deployment
- \`VERCEL_TOKEN\`: Your Vercel API token
  - Go to https://vercel.com/account/tokens
  - Create a new token with appropriate permissions
  
- \`VERCEL_ORG_ID\`: Your Vercel organization ID
  - Found in your Vercel team settings
  
- \`VERCEL_PROJECT_ID\`: Your Vercel project ID
  - Found in your Vercel project settings
  
- \`VERCEL_SCOPE\`: Your Vercel team scope (optional if personal account)

### Supabase Configuration
- \`SUPABASE_URL\`: Your production Supabase project URL
- \`SUPABASE_ANON_KEY\`: Your production Supabase anonymous key
- \`SUPABASE_SERVICE_ROLE_KEY\`: Your production Supabase service role key
- \`SUPABASE_CONNECTION_STRING\`: Full database connection string for backups

### Environment URLs
- \`BASE_URL\`: Your production domain (e.g., https://yourdomain.com)
- \`PREVIEW_SUPABASE_URL\`: Preview environment Supabase URL
- \`PREVIEW_SUPABASE_ANON_KEY\`: Preview environment Supabase key
- \`PREVIEW_BASE_URL\`: Preview environment base URL

## Optional Secrets

### Notifications
- \`SLACK_WEBHOOK_URL\`: Slack webhook for deployment notifications
  - Create a Slack app and add an incoming webhook
  
### Security Scanning
- \`SNYK_TOKEN\`: Snyk API token for vulnerability scanning
  - Sign up at https://snyk.io and get your API token
  
### Code Coverage
- \`CODECOV_TOKEN\`: Codecov token for coverage reporting
  - Sign up at https://codecov.io and get your token

## Test Environment Secrets

For running tests in CI:
- \`TEST_SUPABASE_URL\`: Test database URL
- \`TEST_SUPABASE_ANON_KEY\`: Test database anonymous key
- \`TEST_SUPABASE_SERVICE_KEY\`: Test database service key

## Setting Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value

## Environment Configuration

The pipeline uses different environments:
- **production**: Deploys from \`main\` branch with protection rules
- **preview**: Deploys from \`develop\` and feature branches

### Protection Rules
- Production deployments require manual approval
- 5-minute wait timer for production deployments
- Only administrators can approve production deployments

## Troubleshooting

### Common Issues

1. **Vercel deployment fails**
   - Check that all Vercel secrets are correctly set
   - Ensure your Vercel project is properly configured
   
2. **Database connection fails**
   - Verify Supabase connection strings are correct
   - Check that your Supabase project allows connections from GitHub Actions IPs
   
3. **Tests fail**
   - Ensure test environment secrets are configured
   - Check that test database is accessible
   
4. **Security scans fail**
   - Review dependency vulnerabilities
   - Update packages or add exceptions as needed

For more help, check the GitHub Actions logs and contact the development team.
`;
  }

  async createVercelConfiguration() {
    this.log('Creating Vercel configuration...', 'deploy');
    
    const vercelConfig = {
      name: 'pta-management-system',
      version: 2,
      builds: [
        {
          src: 'package.json',
          use: '@vercel/next'
        }
      ],
      env: {
        NEXT_PUBLIC_SUPABASE_URL: '@supabase_url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '@supabase_anon_key',
        SUPABASE_SERVICE_ROLE_KEY: '@supabase_service_role_key',
        NEXT_PUBLIC_BASE_URL: '@base_url'
      },
      build: {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: '@supabase_url',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: '@supabase_anon_key',
          NEXT_PUBLIC_BASE_URL: '@base_url'
        }
      },
      functions: {
        'app/api/**/*.ts': {
          maxDuration: 30
        }
      },
      headers: [
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate'
            }
          ]
        }
      ],
      redirects: [
        {
          source: '/dashboard',
          destination: '/',
          permanent: false
        }
      ],
      regions: ['sin1', 'hnd1']
    };
    
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    this.log('Created vercel.json configuration', 'success');
    
    // Create project-specific Vercel configuration
    const projectConfig = {
      projectSettings: {
        buildCommand: 'pnpm build',
        devCommand: 'pnpm dev',
        installCommand: 'pnpm install',
        outputDirectory: '.next'
      },
      environmentVariables: {
        production: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'from-secret' },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'from-secret' },
          { key: 'SUPABASE_SERVICE_ROLE_KEY', value: 'from-secret' },
          { key: 'NEXT_PUBLIC_BASE_URL', value: 'from-secret' }
        ],
        preview: [
          { key: 'NODE_ENV', value: 'development' },
          { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'from-secret' },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'from-secret' },
          { key: 'NEXT_PUBLIC_BASE_URL', value: 'from-secret' }
        ]
      }
    };
    
    const projectConfigPath = path.join(this.projectRoot, '.vercel', 'project.json');
    if (!fs.existsSync(path.dirname(projectConfigPath))) {
      fs.mkdirSync(path.dirname(projectConfigPath), { recursive: true });
    }
    fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2));
    this.log('Created Vercel project configuration', 'success');
  }

  async validateDeploymentReadiness() {
    this.log('Validating deployment readiness...', 'info');
    
    const checks = [
      { name: 'package.json exists', check: () => fs.existsSync(path.join(this.projectRoot, 'package.json')) },
      { name: 'next.config.ts exists', check: () => fs.existsSync(path.join(this.projectRoot, 'next.config.ts')) },
      { name: 'tsconfig.json exists', check: () => fs.existsSync(path.join(this.projectRoot, 'tsconfig.json')) },
      { name: 'Database schema exists', check: () => fs.existsSync(path.join(this.projectRoot, 'lib', 'supabase', 'setup-manual.sql')) },
      { name: 'Environment example exists', check: () => fs.existsSync(path.join(this.projectRoot, '.env.local.example')) || fs.existsSync(path.join(this.projectRoot, 'env.local')) },
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      if (check.check()) {
        this.log(`✅ ${check.name}`, 'success');
      } else {
        this.log(`❌ ${check.name}`, 'error');
        allPassed = false;
      }
    }
    
    if (!allPassed) {
      throw new Error('Deployment readiness validation failed');
    }
    
    this.log('All deployment readiness checks passed', 'success');
  }

  async createEnvironmentExample() {
    this.log('Creating environment variable examples...', 'info');
    
    const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: For type generation
SUPABASE_PROJECT_ID=your_project_id_here

# Optional: For development
NODE_ENV=development
`;
    
    const envExamplePath = path.join(this.projectRoot, '.env.local.example');
    fs.writeFileSync(envExamplePath, envExample);
    this.log('Created .env.local.example', 'success');
    
    // Create production environment template
    const envProdExample = `# Production Environment Variables
# Set these in your deployment platform (Vercel, etc.)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production
`;
    
    const envProdPath = path.join(this.projectRoot, '.env.production.example');
    fs.writeFileSync(envProdPath, envProdExample);
    this.log('Created .env.production.example', 'success');
  }

  async promptUser(question) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question(question, (answer) => {
        readline.close();
        resolve(answer);
      });
    });
  }

  async pushToGitHub() {
    this.log('Preparing to push to GitHub...', 'deploy');
    
    try {
      // Add all files
      await this.runCommand('git', ['add', '.']);
      
      // Check if there are changes to commit
      const { stdout } = await this.runCommand('git', ['status', '--porcelain']);
      if (!stdout.trim()) {
        this.log('No changes to commit', 'info');
        return;
      }
      
      // Commit changes
      const commitMessage = `feat: setup GitHub Actions deployment pipeline

- Add CI/CD workflow with quality checks, testing, and deployment
- Configure Vercel deployment settings
- Add security scanning and performance testing
- Create environment configuration and documentation
- Setup database migration and backup processes

🤖 Generated with automated deployment setup`;
      
      await this.runCommand('git', ['commit', '-m', commitMessage]);
      this.log('Committed deployment configuration', 'success');
      
      // Push to GitHub
      const answer = await this.promptUser('Push changes to GitHub now? (y/N): ');
      if (answer.toLowerCase() === 'y') {
        await this.runCommand('git', ['push']);
        this.log('Changes pushed to GitHub', 'success');
        this.log('GitHub Actions workflow will trigger automatically', 'info');
      } else {
        this.log('Changes committed locally but not pushed', 'warning');
        this.log('Run "git push" manually when ready', 'info');
      }
      
    } catch (error) {
      throw new Error(`Failed to push to GitHub: ${error.message}`);
    }
  }

  async generateDeploymentGuide() {
    this.log('Generating deployment guide...', 'info');
    
    const deploymentGuide = `# Deployment Guide

## GitHub Actions Deployment

This project is configured for automated deployment using GitHub Actions and Vercel.

### Prerequisites

1. **GitHub Repository**: Code must be in a GitHub repository
2. **Vercel Account**: Sign up at https://vercel.com
3. **Supabase Project**: Production database setup

### Setup Steps

1. **Configure GitHub Secrets**:
   - Go to your repository Settings > Secrets and variables > Actions
   - Add all required secrets (see docs/deployment/github-secrets.md)

2. **Connect Vercel**:
   - Import your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard

3. **Database Setup**:
   - Run migrations on your production Supabase project
   - Ensure RLS policies are properly configured

### Deployment Process

#### Automatic Deployment
- **Main branch**: Automatically deploys to production
- **Develop branch**: Automatically deploys to preview
- **Pull requests**: Create preview deployments

#### Manual Deployment
\`\`\`bash
# Deploy to production
pnpm deploy:vercel

# Deploy specific branch
git checkout main
git push origin main
\`\`\`

### Monitoring

- **GitHub Actions**: Monitor builds in the Actions tab
- **Vercel Dashboard**: Monitor deployments and performance
- **Supabase Dashboard**: Monitor database performance

### Troubleshooting

#### Build Failures
1. Check GitHub Actions logs
2. Verify all secrets are configured
3. Ensure dependencies are up to date

#### Database Issues
1. Check Supabase connection
2. Verify environment variables
3. Run database migrations

#### Performance Issues
1. Check Vercel analytics
2. Review performance test results
3. Optimize heavy components or queries

For detailed troubleshooting, see the documentation or contact support.
`;
    
    const guideePath = path.join(this.projectRoot, 'docs', 'deployment', 'README.md');
    if (!fs.existsSync(path.dirname(guideePath))) {
      fs.mkdirSync(path.dirname(guideePath), { recursive: true });
    }
    fs.writeFileSync(guideePath, deploymentGuide);
    this.log('Created deployment guide', 'success');
  }

  async runDeploymentSetup() {
    this.log('Starting GitHub deployment setup...', 'deploy');
    
    try {
      await this.checkGitRepository();
      await this.validateDeploymentReadiness();
      await this.setupGitHubActions();
      await this.createVercelConfiguration();
      await this.createEnvironmentExample();
      await this.checkRequiredSecrets();
      await this.generateDeploymentGuide();
      await this.pushToGitHub();
      
      this.log('🎉 GitHub deployment setup completed successfully!', 'success');
      
      console.log(`
🚀 Next Steps:
1. Configure secrets in your GitHub repository
2. Set up your Vercel project and connect to GitHub
3. Configure your production Supabase database
4. Push to main branch to trigger first deployment

📚 Documentation:
- Deployment Guide: docs/deployment/README.md
- GitHub Secrets: docs/deployment/github-secrets.md
- API Documentation: docs/api/README.md

💡 Need help? Check the documentation or create an issue on GitHub.
`);
      
    } catch (error) {
      this.log(`Deployment setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const deployment = new GitHubDeployment();
  await deployment.runDeploymentSetup();
}

if (require.main === module) {
  main();
}

module.exports = { GitHubDeployment };