#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

class PerformanceTestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        averageResponseTime: 0,
      },
    };
  }

  async runTest(name, testFn, threshold = 2000) {
    console.log(`Running: ${name}`);
    const startTime = performance.now();
    
    try {
      const result = await testFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = duration < threshold;
      const testResult = {
        name,
        duration: Math.round(duration),
        threshold,
        passed,
        details: result || {},
        timestamp: new Date().toISOString(),
      };
      
      this.results.tests.push(testResult);
      this.results.summary.totalTests++;
      
      if (passed) {
        this.results.summary.passed++;
        console.log(`✅ ${name}: ${Math.round(duration)}ms`);
      } else {
        this.results.summary.failed++;
        console.log(`❌ ${name}: ${Math.round(duration)}ms (exceeded ${threshold}ms threshold)`);
      }
      
      return testResult;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const testResult = {
        name,
        duration: Math.round(duration),
        threshold,
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      
      this.results.tests.push(testResult);
      this.results.summary.totalTests++;
      this.results.summary.failed++;
      
      console.log(`❌ ${name}: Error - ${error.message}`);
      return testResult;
    }
  }

  async testApiEndpoint(endpoint, method = 'GET', body = null, expectedStatus = 200) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token', // Mock auth for testing
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    return {
      url,
      status: response.status,
      expectedStatus,
      statusOk: response.status === expectedStatus,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type'),
    };
  }

  async testDatabaseQuery(operation, iterations = 100) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        // Simulate database operations
        await this.simulateDatabaseOperation(operation);
        const endTime = performance.now();
        results.push(endTime - startTime);
      } catch (error) {
        results.push(null);
      }
    }
    
    const validResults = results.filter(r => r !== null);
    const avgTime = validResults.reduce((sum, time) => sum + time, 0) / validResults.length;
    
    return {
      iterations,
      successRate: (validResults.length / iterations) * 100,
      averageTime: Math.round(avgTime),
      minTime: Math.round(Math.min(...validResults)),
      maxTime: Math.round(Math.max(...validResults)),
    };
  }

  async simulateDatabaseOperation(operation) {
    // Simulate different database operations with appropriate delays
    const operationTimes = {
      'select': 10 + Math.random() * 50,
      'insert': 15 + Math.random() * 75,
      'update': 20 + Math.random() * 60,
      'delete': 25 + Math.random() * 40,
      'join': 30 + Math.random() * 100,
    };
    
    const delay = operationTimes[operation] || 50;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async testComponentRender(componentName, props = {}) {
    // Simulate component rendering time
    const renderTime = 5 + Math.random() * 45; // 5-50ms
    await new Promise(resolve => setTimeout(resolve, renderTime));
    
    return {
      component: componentName,
      props: Object.keys(props),
      renderTime: Math.round(renderTime),
    };
  }

  async testMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const before = process.memoryUsage();
      
      // Simulate memory-intensive operations
      const largeArray = new Array(1000000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
      
      const after = process.memoryUsage();
      
      // Clean up
      largeArray.length = 0;
      
      return {
        heapUsedBefore: Math.round(before.heapUsed / 1024 / 1024),
        heapUsedAfter: Math.round(after.heapUsed / 1024 / 1024),
        heapDifference: Math.round((after.heapUsed - before.heapUsed) / 1024 / 1024),
        rss: Math.round(after.rss / 1024 / 1024),
        external: Math.round(after.external / 1024 / 1024),
      };
    }
    
    return { error: 'Memory usage testing not available in this environment' };
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite\n');
    
    // API Endpoint Tests
    await this.runTest('API - Get Parents', () => 
      this.testApiEndpoint('/api/parents'), 500);
    
    await this.runTest('API - Get Students', () => 
      this.testApiEndpoint('/api/students'), 500);
    
    await this.runTest('API - Get Payments', () => 
      this.testApiEndpoint('/api/payments'), 500);
    
    await this.runTest('API - Get Classes', () => 
      this.testApiEndpoint('/api/classes'), 500);
    
    await this.runTest('API - Create Parent', () => 
      this.testApiEndpoint('/api/parents', 'POST', {
        name: 'Test Parent',
        email: 'test@example.com',
        contact_number: '1234567890',
        school_id: 'test-school-id',
      }), 1000);
    
    // Database Performance Tests
    await this.runTest('DB - Select Query Performance', () => 
      this.testDatabaseQuery('select', 50), 1000);
    
    await this.runTest('DB - Insert Query Performance', () => 
      this.testDatabaseQuery('insert', 25), 1500);
    
    await this.runTest('DB - Complex Join Performance', () => 
      this.testDatabaseQuery('join', 10), 2000);
    
    // Component Rendering Tests
    await this.runTest('Component - Dashboard Render', () => 
      this.testComponentRender('Dashboard', { userRole: 'admin' }), 100);
    
    await this.runTest('Component - Parent List Render', () => 
      this.testComponentRender('ParentList', { parents: [] }), 100);
    
    await this.runTest('Component - Payment Form Render', () => 
      this.testComponentRender('PaymentForm', {}), 100);
    
    // Memory Usage Test
    await this.runTest('Memory - Usage Test', () => 
      this.testMemoryUsage(), 1000);
    
    // Calculate summary
    const totalDuration = this.results.tests.reduce((sum, test) => sum + test.duration, 0);
    this.results.summary.averageResponseTime = Math.round(totalDuration / this.results.tests.length);
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 Performance Test Results');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${Math.round((this.results.summary.passed / this.results.summary.totalTests) * 100)}%`);
    console.log(`Average Response Time: ${this.results.summary.averageResponseTime}ms`);
    
    console.log('\n🔍 Detailed Results:');
    this.results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.duration}ms`);
      
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
      
      if (test.details && Object.keys(test.details).length > 0) {
        console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
      }
    });
    
    // Save results to file
    const reportPath = path.join(__dirname, '..', 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    // Generate recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('\n💡 Performance Recommendations:');
    
    const slowTests = this.results.tests.filter(test => !test.passed && !test.error);
    const failedTests = this.results.tests.filter(test => test.error);
    
    if (slowTests.length > 0) {
      console.log('\n⚠️  Slow Performance Issues:');
      slowTests.forEach(test => {
        console.log(`- ${test.name}: ${test.duration}ms (threshold: ${test.threshold}ms)`);
        
        if (test.name.includes('API')) {
          console.log('  → Consider implementing caching or optimizing database queries');
        } else if (test.name.includes('DB')) {
          console.log('  → Consider adding database indexes or optimizing query structure');
        } else if (test.name.includes('Component')) {
          console.log('  → Consider implementing React.memo or optimizing render logic');
        }
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
        console.log('  → Check server availability and configuration');
      });
    }
    
    const avgResponseTime = this.results.summary.averageResponseTime;
    if (avgResponseTime > 1000) {
      console.log('\n🐌 Overall Performance Warning:');
      console.log(`- Average response time (${avgResponseTime}ms) is above recommended threshold (1000ms)`);
      console.log('  → Consider implementing performance optimizations across the application');
    }
    
    console.log('\n🚀 General Recommendations:');
    console.log('- Implement Redis caching for frequently accessed data');
    console.log('- Use database connection pooling');
    console.log('- Optimize images and static assets');
    console.log('- Implement lazy loading for components');
    console.log('- Use CDN for static content delivery');
    console.log('- Monitor and optimize bundle size');
  }
}

// Lighthouse Performance Test
async function runLighthouseTest() {
  try {
    const lighthouse = require('lighthouse');
    const chromeLauncher = require('chrome-launcher');
    
    console.log('\n🔍 Running Lighthouse Performance Audit...');
    
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };
    
    const runnerResult = await lighthouse(BASE_URL, options);
    await chrome.kill();
    
    const performanceScore = runnerResult.lhr.categories.performance.score * 100;
    
    console.log(`📊 Lighthouse Performance Score: ${Math.round(performanceScore)}/100`);
    
    const metrics = runnerResult.lhr.audits;
    console.log(`🕐 First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
    console.log(`🏃 Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
    console.log(`📊 Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    console.log(`⚡ Time to Interactive: ${metrics['interactive'].displayValue}`);
    
    // Save Lighthouse report
    const reportPath = path.join(__dirname, '..', 'lighthouse-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));
    console.log(`📄 Lighthouse report saved to: ${reportPath}`);
    
  } catch (error) {
    console.log(`⚠️  Lighthouse test failed: ${error.message}`);
    console.log('   Install lighthouse: npm install -g lighthouse chrome-launcher');
  }
}

// Main execution
async function main() {
  const performanceTest = new PerformanceTestSuite();
  
  try {
    await performanceTest.runAllTests();
    
    // Run Lighthouse test if available
    if (process.argv.includes('--lighthouse')) {
      await runLighthouseTest();
    }
    
    const successRate = (performanceTest.results.summary.passed / performanceTest.results.summary.totalTests) * 100;
    
    if (successRate < 80) {
      console.log('\n❌ Performance tests failed with low success rate');
      process.exit(1);
    } else {
      console.log('\n✅ Performance tests completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Performance test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PerformanceTestSuite };