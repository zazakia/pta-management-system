#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DocumentationGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.docsDir = path.join(this.projectRoot, 'docs');
    this.generatedDir = path.join(this.docsDir, 'generated');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      docs: '📚',
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async ensureDirectories() {
    const dirs = [
      this.docsDir,
      this.generatedDir,
      path.join(this.docsDir, 'testing'),
      path.join(this.docsDir, 'deployment'),
      path.join(this.docsDir, 'development'),
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`Created directory: ${path.relative(this.projectRoot, dir)}`, 'success');
      }
    });
  }

  async generateAPIEndpointsDoc() {
    this.log('Generating API endpoints documentation...', 'docs');
    
    const apiDir = path.join(this.projectRoot, 'app', 'api');
    const endpoints = this.scanAPIEndpoints(apiDir);
    
    const doc = `# API Endpoints Reference

Auto-generated documentation of all API endpoints in the PTA Management System.

*Generated on: ${new Date().toISOString()}*

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
${endpoints.map(ep => `| ${ep.methods.join(', ')} | \`${ep.path}\` | ${ep.description} |`).join('\n')}

## Detailed Endpoints

${endpoints.map(ep => this.generateEndpointSection(ep)).join('\n\n')}

## HTTP Status Codes

- \`200\` - OK: Request successful
- \`201\` - Created: Resource created successfully
- \`400\` - Bad Request: Invalid request data
- \`401\` - Unauthorized: Authentication required
- \`403\` - Forbidden: Insufficient permissions
- \`404\` - Not Found: Resource not found
- \`500\` - Internal Server Error: Server error
- \`503\` - Service Unavailable: Database error

## Authentication

All endpoints require authentication via Supabase JWT token:

\`\`\`
Authorization: Bearer <supabase_jwt_token>
\`\`\`

## Rate Limiting

- Read operations: 100 requests per minute
- Write operations: 30 requests per minute
- Authentication: 10 requests per minute
`;
    
    const outputPath = path.join(this.generatedDir, 'api-endpoints.md');
    fs.writeFileSync(outputPath, doc);
    this.log('Generated API endpoints documentation', 'success');
  }

  scanAPIEndpoints(dir, basePath = '/api') {
    const endpoints = [];
    
    if (!fs.existsSync(dir)) return endpoints;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        const subEndpoints = this.scanAPIEndpoints(itemPath, `${basePath}/${item}`);
        endpoints.push(...subEndpoints);
      } else if (item === 'route.ts') {
        // Found an API route
        const endpoint = this.analyzeRouteFile(itemPath, basePath);
        if (endpoint) {
          endpoints.push(endpoint);
        }
      }
    }
    
    return endpoints;
  }

  analyzeRouteFile(filePath, routePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const methods = [];
    
    // Extract HTTP methods
    const methodPattern = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
    let match;
    while ((match = methodPattern.exec(content)) !== null) {
      methods.push(match[1]);
    }
    
    if (methods.length === 0) return null;
    
    // Try to extract description from comments
    let description = this.extractDescription(content, routePath);
    
    return {
      path: routePath,
      methods,
      description,
      file: path.relative(this.projectRoot, filePath)
    };
  }

  extractDescription(content, routePath) {
    // Try to extract description from comments
    const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    if (commentMatch) {
      return commentMatch[1];
    }
    
    // Generate description based on route path
    const pathParts = routePath.split('/').filter(part => part);
    if (pathParts.length >= 2) {
      const resource = pathParts[1];
      if (routePath.includes('[id]')) {
        return `Manage individual ${resource} by ID`;
      } else {
        return `Manage ${resource} collection`;
      }
    }
    
    return 'API endpoint';
  }

  generateEndpointSection(endpoint) {
    return `### ${endpoint.methods.join(', ')} ${endpoint.path}

**Description**: ${endpoint.description}

**File**: \`${endpoint.file}\`

**Methods**: ${endpoint.methods.map(method => `\`${method}\``).join(', ')}`;
  }

  async generateComponentsDoc() {
    this.log('Generating components documentation...', 'docs');
    
    const componentsDir = path.join(this.projectRoot, 'components');
    const components = this.scanComponents(componentsDir);
    
    const doc = `# Components Reference

Auto-generated documentation of all React components in the PTA Management System.

*Generated on: ${new Date().toISOString()}*

## Components Overview

${components.map(comp => `- **${comp.name}**: ${comp.description} (\`${comp.file}\`)`).join('\n')}

## Component Details

${components.map(comp => this.generateComponentSection(comp)).join('\n\n')}
`;
    
    const outputPath = path.join(this.generatedDir, 'components.md');
    fs.writeFileSync(outputPath, doc);
    this.log('Generated components documentation', 'success');
  }

  scanComponents(dir, components = []) {
    if (!fs.existsSync(dir)) return components;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        this.scanComponents(itemPath, components);
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        const component = this.analyzeComponent(itemPath);
        if (component) {
          components.push(component);
        }
      }
    }
    
    return components;
  }

  analyzeComponent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Extract component name
    const componentMatch = content.match(/(?:export\s+default\s+function|function|const)\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : fileName;
    
    // Extract props interface
    const propsMatch = content.match(/interface\s+(\w*Props\w*)\s*{([^}]+)}/);
    const props = propsMatch ? this.extractProps(propsMatch[2]) : [];
    
    // Extract description from comments
    const description = this.extractComponentDescription(content);
    
    return {
      name: componentName,
      file: path.relative(this.projectRoot, filePath),
      description,
      props
    };
  }

  extractProps(propsString) {
    const props = [];
    const lines = propsString.split('\n');
    
    for (const line of lines) {
      const propMatch = line.match(/(\w+)(\?)?\s*:\s*([^;]+)/);
      if (propMatch) {
        props.push({
          name: propMatch[1],
          optional: !!propMatch[2],
          type: propMatch[3].trim()
        });
      }
    }
    
    return props;
  }

  extractComponentDescription(content) {
    // Try to extract description from JSDoc comments
    const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    if (jsdocMatch) {
      return jsdocMatch[1];
    }
    
    // Try to extract from regular comments
    const commentMatch = content.match(/\/\/\s*(.+)/);
    if (commentMatch) {
      return commentMatch[1];
    }
    
    return 'React component';
  }

  generateComponentSection(component) {
    let section = `### ${component.name}

**Description**: ${component.description}

**File**: \`${component.file}\``;

    if (component.props.length > 0) {
      section += `

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
${component.props.map(prop => 
  `| ${prop.name} | \`${prop.type}\` | ${prop.optional ? 'No' : 'Yes'} | - |`
).join('\n')}`;
    }

    return section;
  }

  async generateDatabaseDoc() {
    this.log('Generating database documentation...', 'docs');
    
    const schemaPath = path.join(this.projectRoot, 'lib', 'supabase', 'setup-manual.sql');
    
    if (!fs.existsSync(schemaPath)) {
      this.log('Database schema file not found', 'warning');
      return;
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const tables = this.extractTables(schemaContent);
    const triggers = this.extractTriggers(schemaContent);
    const policies = this.extractPolicies(schemaContent);
    
    const doc = `# Database Schema Documentation

Auto-generated documentation of the PTA2 database schema.

*Generated on: ${new Date().toISOString()}*

## Schema Overview

The PTA Management System uses a PostgreSQL database with the \`pta2\` schema. The database includes:

- **Tables**: ${tables.length} main data tables
- **Triggers**: ${triggers.length} automatic triggers
- **RLS Policies**: ${policies.length} row-level security policies

## Tables

${tables.map(table => this.generateTableSection(table)).join('\n\n')}

## Triggers

${triggers.map(trigger => `### ${trigger.name}\n\n**Function**: \`${trigger.function}\`\n\n**Description**: ${trigger.description}`).join('\n\n')}

## Row Level Security Policies

${policies.map(policy => `### ${policy.name}\n\n**Table**: \`${policy.table}\`\n\n**Type**: ${policy.type}\n\n**Description**: ${policy.description}`).join('\n\n')}

## Relationships

The database follows these key relationships:

- Schools have many Classes
- Classes have many Students
- Parents have many Students
- Payments belong to Parents
- User Profiles link to Auth Users

## Data Types

- **UUID**: Primary keys and foreign keys
- **TEXT**: Names, descriptions, and variable-length text
- **BOOLEAN**: Status flags (payment_status, etc.)
- **TIMESTAMP WITH TIME ZONE**: All datetime fields
- **NUMERIC**: Amounts and calculations
`;
    
    const outputPath = path.join(this.generatedDir, 'database-schema.md');
    fs.writeFileSync(outputPath, doc);
    this.log('Generated database documentation', 'success');
  }

  extractTables(content) {
    const tables = [];
    const tablePattern = /CREATE TABLE pta2\.(\w+)\s*\(([^;]+)\);/g;
    let match;
    
    while ((match = tablePattern.exec(content)) !== null) {
      const tableName = match[1];
      const columnsText = match[2];
      const columns = this.parseColumns(columnsText);
      
      tables.push({
        name: tableName,
        columns
      });
    }
    
    return tables;
  }

  parseColumns(columnsText) {
    const columns = [];
    const lines = columnsText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('CONSTRAINT')) {
        const columnMatch = trimmed.match(/(\w+)\s+([^,]+)/);
        if (columnMatch) {
          columns.push({
            name: columnMatch[1],
            type: columnMatch[2].replace(/,$/, '').trim()
          });
        }
      }
    }
    
    return columns;
  }

  extractTriggers(content) {
    const triggers = [];
    const triggerPattern = /CREATE TRIGGER (\w+)[^;]+EXECUTE FUNCTION (\w+)\(\)/g;
    let match;
    
    while ((match = triggerPattern.exec(content)) !== null) {
      triggers.push({
        name: match[1],
        function: match[2],
        description: 'Database trigger function'
      });
    }
    
    return triggers;
  }

  extractPolicies(content) {
    const policies = [];
    const policyPattern = /CREATE POLICY "([^"]+)"\s*ON pta2\.(\w+)\s*FOR (\w+)/g;
    let match;
    
    while ((match = policyPattern.exec(content)) !== null) {
      policies.push({
        name: match[1],
        table: match[2],
        type: match[3],
        description: 'Row Level Security policy'
      });
    }
    
    return policies;
  }

  generateTableSection(table) {
    return `### ${table.name}

| Column | Type | Description |
|--------|------|-------------|
${table.columns.map(col => `| ${col.name} | \`${col.type}\` | - |`).join('\n')}`;
  }

  async generateTestingDoc() {
    this.log('Generating testing documentation...', 'docs');
    
    const testsDir = path.join(this.projectRoot, '__tests__');
    const testFiles = this.scanTestFiles(testsDir);
    
    const doc = `# Testing Documentation

Auto-generated documentation of the test suite for the PTA Management System.

*Generated on: ${new Date().toISOString()}*

## Test Overview

The project includes comprehensive testing with:

- **Unit Tests**: ${testFiles.unit.length} test files
- **Integration Tests**: ${testFiles.integration.length} test files  
- **Component Tests**: ${testFiles.components.length} test files
- **Performance Tests**: ${testFiles.performance.length} test files

## Running Tests

\`\`\`bash
# Run all tests
pnpm test

# Run specific test types
pnpm test --testPathPattern=unit
pnpm test --testPathPattern=integration
pnpm test --testPathPattern=components

# Run with coverage
pnpm test:coverage

# Run performance tests
pnpm test:performance
\`\`\`

## Test Files

### Unit Tests
${testFiles.unit.map(file => `- \`${file}\``).join('\n')}

### Integration Tests
${testFiles.integration.map(file => `- \`${file}\``).join('\n')}

### Component Tests
${testFiles.components.map(file => `- \`${file}\``).join('\n')}

### Performance Tests
${testFiles.performance.map(file => `- \`${file}\``).join('\n')}

## Test Configuration

Tests are configured using Jest with the following setup:

- **Test Environment**: jsdom for React components
- **Setup File**: \`jest.setup.js\`
- **Mock Strategy**: Comprehensive mocking of external dependencies
- **Coverage**: Collected from app/ and lib/ directories

## Writing Tests

### Unit Test Example

\`\`\`typescript
import { functionToTest } from '@/lib/utils';

describe('functionToTest', () => {
  test('should return expected result', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });
});
\`\`\`

### Component Test Example

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import Component from '@/components/Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
\`\`\`

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%
`;
    
    const outputPath = path.join(this.docsDir, 'testing', 'README.md');
    fs.writeFileSync(outputPath, doc);
    this.log('Generated testing documentation', 'success');
  }

  scanTestFiles(dir) {
    const testFiles = {
      unit: [],
      integration: [],
      components: [],
      performance: []
    };
    
    if (!fs.existsSync(dir)) return testFiles;
    
    const scanDirectory = (dirPath, category) => {
      if (!fs.existsSync(dirPath)) return;
      
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isFile() && (item.endsWith('.test.ts') || item.endsWith('.test.tsx'))) {
          testFiles[category].push(path.relative(this.projectRoot, itemPath));
        }
      }
    };
    
    scanDirectory(path.join(dir, 'unit'), 'unit');
    scanDirectory(path.join(dir, 'integration'), 'integration');
    scanDirectory(path.join(dir, 'components'), 'components');
    scanDirectory(path.join(dir, 'performance'), 'performance');
    
    return testFiles;
  }

  async generateDeploymentDoc() {
    this.log('Generating deployment documentation...', 'docs');
    
    const workflowPath = path.join(this.projectRoot, '.github', 'workflows', 'ci-cd.yml');
    const hasWorkflow = fs.existsSync(workflowPath);
    
    const doc = `# Deployment Documentation

Auto-generated deployment guide for the PTA Management System.

*Generated on: ${new Date().toISOString()}*

## Deployment Options

### 1. Vercel (Recommended)

The project is optimized for Vercel deployment with:

- **Framework**: Next.js 15 with App Router
- **Build Command**: \`pnpm build\`
- **Output Directory**: \`.next\`
- **Install Command**: \`pnpm install\`

### 2. GitHub Actions ${hasWorkflow ? '✅' : '❌'}

${hasWorkflow ? 
`Automated CI/CD pipeline configured with:

- **Quality Checks**: TypeScript, ESLint, auto-fixing
- **Testing**: Unit, integration, component, and performance tests
- **Security**: Vulnerability scanning and dependency auditing
- **Deployment**: Automatic deployment to Vercel
- **Monitoring**: Performance monitoring and error tracking` :
`GitHub Actions workflow not found. Run \`pnpm deploy:github\` to set up automated deployment.`}

## Environment Variables

### Required Variables

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_BASE_URL=your_domain
\`\`\`

### Optional Variables

\`\`\`env
VERCEL_ANALYTICS_ID=analytics_id
SENTRY_DSN=error_tracking_dsn
SMTP_HOST=email_host
\`\`\`

## Database Setup

1. **Create Supabase Project**
2. **Run Migrations**: \`pnpm db:setup\`
3. **Seed Data**: \`pnpm db:seed\`
4. **Sync Users**: \`pnpm db:sync-users\`

## Deployment Steps

### Manual Deployment

\`\`\`bash
# 1. Build the application
pnpm build

# 2. Deploy to Vercel
pnpm deploy:vercel
\`\`\`

### Automated Deployment

1. Push to \`main\` branch for production
2. Push to \`develop\` branch for staging
3. Create PR for preview deployment

## Post-Deployment

1. **Test API endpoints**: \`/api/test-db\`
2. **Verify authentication**: Sign in functionality
3. **Check database**: RLS policies and data access
4. **Monitor performance**: Vercel analytics

## Troubleshooting

### Common Issues

1. **Build failures**: Check TypeScript errors
2. **Environment variables**: Verify all secrets are set
3. **Database connection**: Check Supabase configuration
4. **Authentication**: Verify JWT configuration

### Monitoring

- **Uptime**: Monitor \`/api/health\` endpoint
- **Performance**: Use Vercel Analytics
- **Errors**: Configure Sentry or similar service
- **Database**: Monitor Supabase dashboard
`;
    
    const outputPath = path.join(this.docsDir, 'deployment', 'README.md');
    fs.writeFileSync(outputPath, doc);
    this.log('Generated deployment documentation', 'success');
  }

  async generateChangelog() {
    this.log('Generating changelog...', 'docs');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const version = packageJson.version || '1.0.0';
    
    const changelog = `# Changelog

All notable changes to the PTA Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [${version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Complete PTA Management System with role-based access control
- Parent-Teacher Association payment tracking (PHP 250 per family)
- Role-based dashboards for parents, teachers, treasurers, and administrators
- Student and class management with automatic payment status updates
- Real-time reporting and analytics
- Comprehensive test suite with unit, integration, and performance tests
- Auto-fixing system for common development issues
- GitHub Actions CI/CD pipeline with automated deployment
- Database migration system with rollback support
- API documentation generation
- Security scanning and vulnerability monitoring

### Technical Features
- Next.js 15 with App Router and React 19
- Supabase backend with PostgreSQL and Row Level Security
- TypeScript for type safety
- Tailwind CSS and shadcn/ui for styling
- SWR for client-side data fetching
- Jest and React Testing Library for testing
- Playwright for end-to-end testing
- ESLint and Prettier for code quality
- Vercel deployment configuration
- Database schema with automatic triggers

### Security
- Row Level Security (RLS) policies for data protection
- JWT-based authentication via Supabase Auth
- Input validation and sanitization
- SQL injection prevention
- Environment variable protection
- HTTPS enforcement in production

### Performance
- Automated performance testing with Lighthouse
- Bundle optimization and code splitting
- Database query optimization
- CDN configuration for static assets
- Server-side rendering and static generation

### Documentation
- Comprehensive API documentation
- Deployment guides for GitHub Actions and Vercel
- Database schema documentation
- Testing documentation and examples
- Development setup guides

## [Unreleased]

### Planned Features
- Email notifications for payment reminders
- Bulk import/export functionality
- Advanced reporting with charts and graphs
- Mobile app development
- Multi-language support
- Integration with popular accounting software

---

*This changelog is automatically updated as part of the build process.*
`;
    
    const outputPath = path.join(this.projectRoot, 'CHANGELOG.md');
    fs.writeFileSync(outputPath, changelog);
    this.log('Generated changelog', 'success');
  }

  async generateAllDocumentation() {
    this.log('Starting documentation generation...', 'docs');
    
    try {
      await this.ensureDirectories();
      await this.generateAPIEndpointsDoc();
      await this.generateComponentsDoc();
      await this.generateDatabaseDoc();
      await this.generateTestingDoc();
      await this.generateDeploymentDoc();
      await this.generateChangelog();
      
      this.log('Documentation generation completed successfully!', 'success');
      
      console.log(`
📚 Generated Documentation:
- API Endpoints: docs/generated/api-endpoints.md
- Components: docs/generated/components.md
- Database Schema: docs/generated/database-schema.md
- Testing Guide: docs/testing/README.md
- Deployment Guide: docs/deployment/README.md
- Changelog: CHANGELOG.md

🔍 View all documentation in the docs/ directory.
      `);
      
    } catch (error) {
      this.log(`Documentation generation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const generator = new DocumentationGenerator();
  await generator.generateAllDocumentation();
}

if (require.main === module) {
  main();
}

module.exports = { DocumentationGenerator };