#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutoFixingSystem {
  constructor() {
    this.fixes = [];
    this.errors = [];
    this.projectRoot = path.join(__dirname, '..');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧',
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

  async checkAndFixTSErrors() {
    this.log('Checking for TypeScript errors...', 'info');
    
    try {
      await this.runCommand('npx', ['tsc', '--noEmit']);
      this.log('No TypeScript errors found', 'success');
    } catch (result) {
      const errors = result.stderr || result.stdout;
      this.log('TypeScript errors detected, attempting fixes...', 'warning');
      
      await this.fixCommonTSErrors(errors);
    }
  }

  async fixCommonTSErrors(errors) {
    const errorLines = errors.split('\n').filter(line => line.includes('error TS'));
    
    for (const errorLine of errorLines) {
      // Fix missing import errors
      if (errorLine.includes("Cannot find name") || errorLine.includes("Cannot find module")) {
        await this.fixMissingImports(errorLine);
      }
      
      // Fix type annotation errors
      if (errorLine.includes("Parameter") && errorLine.includes("implicitly has an 'any' type")) {
        await this.fixImplicitAnyTypes(errorLine);
      }
      
      // Fix unused variable errors
      if (errorLine.includes("is declared but its value is never read")) {
        await this.fixUnusedVariables(errorLine);
      }
      
      // Fix React component prop errors
      if (errorLine.includes("Property") && errorLine.includes("does not exist on type")) {
        await this.fixReactPropErrors(errorLine);
      }
    }
  }

  async fixMissingImports(errorLine) {
    const match = errorLine.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS\d+: Cannot find name '(.+)'/);
    if (!match) return;
    
    const [, filePath, line, col, missingName] = match;
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) return;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Common React/Next.js imports
    const commonImports = {
      'React': "import React from 'react';",
      'useState': "import { useState } from 'react';",
      'useEffect': "import { useEffect } from 'react';",
      'Link': "import Link from 'next/link';",
      'useRouter': "import { useRouter } from 'next/navigation';",
      'Image': "import Image from 'next/image';",
    };
    
    if (commonImports[missingName]) {
      // Check if import already exists
      if (!content.includes(commonImports[missingName])) {
        lines.unshift(commonImports[missingName]);
        fs.writeFileSync(fullPath, lines.join('\n'));
        this.log(`Added missing import for ${missingName} in ${filePath}`, 'fix');
        this.fixes.push(`Added import: ${missingName} in ${filePath}`);
      }
    }
  }

  async fixImplicitAnyTypes(errorLine) {
    const match = errorLine.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS\d+: Parameter '(.+)' implicitly has an 'any' type/);
    if (!match) return;
    
    const [, filePath, line, col, paramName] = match;
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) return;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const lineIndex = parseInt(line) - 1;
    
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    
    const currentLine = lines[lineIndex];
    
    // Common type annotations
    const typeAnnotations = {
      'event': 'React.ChangeEvent<HTMLInputElement>',
      'e': 'React.MouseEvent',
      'error': 'Error',
      'data': 'any',
      'props': 'any',
      'params': 'any',
    };
    
    if (typeAnnotations[paramName]) {
      const newLine = currentLine.replace(
        new RegExp(`\\b${paramName}\\b`),
        `${paramName}: ${typeAnnotations[paramName]}`
      );
      
      if (newLine !== currentLine) {
        lines[lineIndex] = newLine;
        fs.writeFileSync(fullPath, lines.join('\n'));
        this.log(`Added type annotation for ${paramName} in ${filePath}`, 'fix');
        this.fixes.push(`Added type annotation: ${paramName} in ${filePath}`);
      }
    }
  }

  async fixUnusedVariables(errorLine) {
    const match = errorLine.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS\d+: '(.+)' is declared but its value is never read/);
    if (!match) return;
    
    const [, filePath, line, col, varName] = match;
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) return;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const lineIndex = parseInt(line) - 1;
    
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    
    const currentLine = lines[lineIndex];
    
    // Add underscore prefix to unused variables
    const newLine = currentLine.replace(
      new RegExp(`\\b${varName}\\b`),
      `_${varName}`
    );
    
    if (newLine !== currentLine) {
      lines[lineIndex] = newLine;
      fs.writeFileSync(fullPath, lines.join('\n'));
      this.log(`Prefixed unused variable ${varName} with underscore in ${filePath}`, 'fix');
      this.fixes.push(`Fixed unused variable: ${varName} in ${filePath}`);
    }
  }

  async fixReactPropErrors(errorLine) {
    const match = errorLine.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS\d+: Property '(.+)' does not exist on type/);
    if (!match) return;
    
    const [, filePath, line, col, propName] = match;
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) return;
    
    // Check if this is a component file that needs prop interface
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes('interface Props') || content.includes('type Props')) return;
    
    // Add basic Props interface
    const lines = content.split('\n');
    const importIndex = lines.findIndex(line => line.includes('import React'));
    
    if (importIndex >= 0) {
      const propsInterface = `
interface Props {
  ${propName}?: any;
  [key: string]: any;
}
`;
      lines.splice(importIndex + 1, 0, propsInterface);
      fs.writeFileSync(fullPath, lines.join('\n'));
      this.log(`Added Props interface with ${propName} in ${filePath}`, 'fix');
      this.fixes.push(`Added Props interface: ${propName} in ${filePath}`);
    }
  }

  async checkAndFixESLintErrors() {
    this.log('Checking for ESLint errors...', 'info');
    
    try {
      await this.runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx,.js,.jsx']);
      this.log('No ESLint errors found', 'success');
    } catch (result) {
      const errors = result.stdout || result.stderr;
      this.log('ESLint errors detected, attempting fixes...', 'warning');
      
      // Try auto-fix first
      try {
        await this.runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx,.js,.jsx', '--fix']);
        this.log('Applied ESLint auto-fixes', 'fix');
        this.fixes.push('Applied ESLint auto-fixes');
      } catch (fixError) {
        this.log('Some ESLint errors could not be auto-fixed', 'warning');
      }
    }
  }

  async checkAndFixDependencies() {
    this.log('Checking for dependency issues...', 'info');
    
    try {
      // Check for security vulnerabilities
      const auditResult = await this.runCommand('npm', ['audit', '--audit-level', 'moderate']);
      this.log('No security vulnerabilities found', 'success');
    } catch (result) {
      this.log('Security vulnerabilities detected, attempting fixes...', 'warning');
      
      try {
        await this.runCommand('npm', ['audit', 'fix']);
        this.log('Applied security fixes', 'fix');
        this.fixes.push('Applied npm security fixes');
      } catch (fixError) {
        this.log('Some security issues could not be auto-fixed', 'warning');
      }
    }
    
    // Check for outdated packages
    try {
      const outdatedResult = await this.runCommand('npm', ['outdated']);
    } catch (result) {
      if (result.stdout) {
        this.log('Outdated packages detected', 'warning');
        // Note: We don't auto-update as it might break things
        this.log('Run "npm update" manually to update packages', 'info');
      }
    }
  }

  async checkAndFixDatabaseConnection() {
    this.log('Checking database connection...', 'info');
    
    // Check if environment variables are set
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      this.log(`Missing environment variables: ${missingEnvVars.join(', ')}`, 'warning');
      
      // Create .env.local template if it doesn't exist
      const envPath = path.join(this.projectRoot, '.env.local');
      if (!fs.existsSync(envPath)) {
        const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_PROJECT_ID=your_project_id_here
`;
        fs.writeFileSync(envPath, envTemplate);
        this.log('Created .env.local template', 'fix');
        this.fixes.push('Created .env.local template');
      }
    }
  }

  async fixFilePermissions() {
    this.log('Checking file permissions...', 'info');
    
    const scriptFiles = [
      'scripts/auto-fix.js',
      'scripts/performance-test.js',
      'scripts/deploy-github.js',
      'scripts/generate-docs.js',
      'scripts/migrate-db.js'
    ];
    
    for (const scriptFile of scriptFiles) {
      const scriptPath = path.join(this.projectRoot, scriptFile);
      if (fs.existsSync(scriptPath)) {
        try {
          fs.chmodSync(scriptPath, '755');
          this.log(`Made ${scriptFile} executable`, 'fix');
          this.fixes.push(`Fixed permissions: ${scriptFile}`);
        } catch (error) {
          this.log(`Could not fix permissions for ${scriptFile}: ${error.message}`, 'warning');
        }
      }
    }
  }

  async checkAndCreateMissingDirectories() {
    this.log('Checking for missing directories...', 'info');
    
    const requiredDirs = [
      'components/ui',
      '__tests__/unit',
      '__tests__/integration',
      '__tests__/components',
      '__tests__/performance',
      'docs',
      'scripts',
      'public/images',
      'lib/supabase'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.log(`Created missing directory: ${dir}`, 'fix');
        this.fixes.push(`Created directory: ${dir}`);
      }
    }
  }

  async validateDatabaseSchema() {
    this.log('Validating database schema...', 'info');
    
    const schemaPath = path.join(this.projectRoot, 'lib/supabase/setup-manual.sql');
    if (!fs.existsSync(schemaPath)) {
      this.log('Database schema file not found', 'warning');
      return;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for common schema issues
    const requiredTables = ['schools', 'user_profiles', 'classes', 'parents', 'students', 'payments', 'expenses'];
    const missingTables = requiredTables.filter(table => !schema.includes(`CREATE TABLE pta2.${table}`));
    
    if (missingTables.length > 0) {
      this.log(`Missing database tables: ${missingTables.join(', ')}`, 'warning');
    }
    
    // Check for RLS policies
    if (!schema.includes('ENABLE ROW LEVEL SECURITY')) {
      this.log('Row Level Security policies may be missing', 'warning');
    }
  }

  async fixCommonConfigIssues() {
    this.log('Checking configuration files...', 'info');
    
    // Check Next.js config
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    if (fs.existsSync(nextConfigPath)) {
      const config = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Ensure experimental features are properly configured
      if (!config.includes('serverComponentsExternalPackages')) {
        this.log('Missing serverComponentsExternalPackages config', 'warning');
      }
    }
    
    // Check TypeScript config
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      try {
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
        
        // Ensure strict mode is enabled
        if (!tsConfig.compilerOptions?.strict) {
          tsConfig.compilerOptions = tsConfig.compilerOptions || {};
          tsConfig.compilerOptions.strict = true;
          fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
          this.log('Enabled TypeScript strict mode', 'fix');
          this.fixes.push('Enabled TypeScript strict mode');
        }
      } catch (error) {
        this.log('Could not parse tsconfig.json', 'warning');
      }
    }
  }

  async generateFixReport() {
    const reportPath = path.join(this.projectRoot, 'auto-fix-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalFixes: this.fixes.length,
      fixes: this.fixes,
      errors: this.errors,
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Auto-fix report saved to: ${reportPath}`, 'success');
  }

  async runAllFixes() {
    this.log('Starting Auto-Fixing System...', 'info');
    
    try {
      await this.checkAndCreateMissingDirectories();
      await this.fixFilePermissions();
      await this.checkAndFixDatabaseConnection();
      await this.fixCommonConfigIssues();
      await this.validateDatabaseSchema();
      await this.checkAndFixDependencies();
      await this.checkAndFixTSErrors();
      await this.checkAndFixESLintErrors();
      
      await this.generateFixReport();
      
      this.log(`Auto-fixing completed! Applied ${this.fixes.length} fixes.`, 'success');
      
      if (this.fixes.length > 0) {
        this.log('Applied fixes:', 'info');
        this.fixes.forEach(fix => this.log(`  - ${fix}`, 'info'));
      }
      
      if (this.errors.length > 0) {
        this.log('Errors encountered:', 'warning');
        this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
      }
      
    } catch (error) {
      this.log(`Auto-fixing failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const autoFixer = new AutoFixingSystem();
  await autoFixer.runAllFixes();
}

if (require.main === module) {
  main();
}

module.exports = { AutoFixingSystem };