# Deployment Guide

This guide explains how to deploy the PTA Management System to various platforms using the automated deployment script.

## Quick Start

1. **Setup deployment configurations:**
   ```bash
   ./deploy.sh --setup
   ```

2. **Deploy to a specific platform:**
   ```bash
   ./deploy.sh github     # Deploy to GitHub
   ./deploy.sh netlify    # Deploy to Netlify
   ./deploy.sh vercel     # Deploy to Vercel
   ./deploy.sh all        # Deploy to all platforms
   ```

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git initialized in the project

## Environment Variables

### For Netlify Deployment
```bash
export NETLIFY_AUTH_TOKEN="your_netlify_token"
export NETLIFY_SITE_ID="your_site_id"
```

### For Vercel Deployment
```bash
export VERCEL_TOKEN="your_vercel_token"
export VERCEL_ORG_ID="your_org_id"          # Optional
export VERCEL_PROJECT_ID="your_project_id"  # Optional
```

## Getting Tokens

### Netlify
1. Go to [Netlify](https://app.netlify.com/user/applications#personal-access-tokens)
2. Generate a new Personal Access Token
3. Create a new site or get existing site ID from site settings

### Vercel
1. Go to [Vercel](https://vercel.com/account/tokens)
2. Generate a new token
3. Get org ID and project ID from your project settings (optional)

## Deployment Options

### Command Line Options

```bash
./deploy.sh [OPTIONS] [PLATFORM]

Options:
  -h, --help     Show help message
  -s, --setup    Setup deployment configurations
  -t, --test     Run tests before deployment
  -b, --build    Build project only

Platforms:
  github         Deploy to GitHub (git push)
  netlify        Deploy to Netlify
  vercel         Deploy to Vercel
  all            Deploy to all platforms
```

### Examples

```bash
# Setup all deployment configurations
./deploy.sh --setup

# Run tests and deploy to GitHub
./deploy.sh --test github

# Build only (no deployment)
./deploy.sh --build

# Deploy to all platforms
./deploy.sh all
```

## GitHub Actions Workflows

The setup creates the following GitHub Actions workflows:

### CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- Runs on push to main/develop branches
- Runs tests, linting, and builds
- Deploys to Netlify and Vercel on main branch

### Security Scan (`.github/workflows/security.yml`)
- Runs security audits
- Performs CodeQL analysis
- Runs weekly on schedule

### Dependabot (`.github/dependabot.yml`)
- Automatically updates dependencies
- Creates pull requests for security updates

## Configuration Files

### Netlify (`netlify.toml`)
- Build settings and redirects
- Security headers
- Cache optimization
- Environment variables

### Vercel (`vercel.json`)
- Build configuration
- Security headers
- Function settings
- Environment variables

## Manual Deployment

### GitHub Pages
```bash
# After building
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=out
```

### Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Ensure all dependencies are installed
   - Verify Next.js configuration

2. **Deployment Failures**
   - Check authentication tokens
   - Verify site/project IDs
   - Check network connectivity

3. **Runtime Errors**
   - Check environment variables on deployment platform
   - Verify database connections
   - Check API endpoints

### Debug Mode
```bash
# Run with verbose output
DEBUG=1 ./deploy.sh github
```

### Log Files
- Build logs: `.next/build.log`
- Deployment logs: Check platform dashboards

## Security Considerations

- Keep tokens secure and rotate regularly
- Use environment variables for sensitive data
- Enable security headers (included in configs)
- Regular security audits via GitHub Actions

## Performance Optimization

- Static site generation for better performance
- CDN caching configured
- Image optimization enabled
- Bundle size monitoring

## Monitoring

- Set up error monitoring (Sentry, LogRocket)
- Monitor performance metrics
- Set up uptime monitoring
- Configure alerts for failures

## Rollback Strategy

### Netlify
```bash
# Rollback to previous deployment
netlify api listSiteDeploys --site-id=YOUR_SITE_ID
netlify api restoreSiteDeploy --site-id=YOUR_SITE_ID --deploy-id=DEPLOY_ID
```

### Vercel
```bash
# Rollback via CLI
vercel rollback [deployment-url]
```

### GitHub
```bash
# Revert commit
git revert HEAD
git push origin main
```

## Support

For issues with the deployment script or configurations:
1. Check the logs for error messages
2. Verify environment variables
3. Test locally first
4. Check platform status pages
5. Consult platform documentation

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domains
3. Set up SSL certificates
4. Configure backup strategies
5. Set up staging environments