'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  RefreshCw,
  Settings,
  Table,
  Server
} from 'lucide-react';

interface TestResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  checks: {
    environment: {
      valid: boolean;
      details: {
        NEXT_PUBLIC_SUPABASE_URL: boolean;
        NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
        SUPABASE_SERVICE_ROLE_KEY: boolean;
      };
    };
    connection: {
      successful: boolean;
      error: string | null;
    };
    schema: {
      pta2_accessible: boolean;
      tables: Array<{
        table: string;
        exists: boolean;
        error: string | null;
        count: number;
      }>;
    };
  };
  summary: {
    total_tables: number;
    existing_tables: number;
    missing_tables: string[];
  };
}

export default function TestConnectionPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="mr-3 h-6 w-6" />
            Database Connection Test
          </h1>
          <p className="text-gray-600 mt-2">
            Verify your Supabase connection and pta2 schema setup
          </p>
        </div>
        <Button 
          onClick={runTest} 
          disabled={testing}
          className="flex items-center"
        >
          {testing ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {testing ? 'Testing...' : 'Run Test'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  {getStatusIcon(result.status)}
                  <span className="ml-2">Overall Status</span>
                </span>
                <Badge className={getStatusColor(result.status)}>
                  {result.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{result.message}</p>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(result.checks.environment.details).map(([key, valid]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{key}</span>
                    <div className="flex items-center">
                      {valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="ml-2 text-sm">
                        {valid ? 'Configured' : 'Missing/Invalid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {!result.checks.environment.valid && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Action Required:</strong> Update your <code>.env.local</code> file with actual Supabase credentials.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Connection Status</span>
                <div className="flex items-center">
                  {result.checks.connection.successful ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="ml-2 text-sm">
                    {result.checks.connection.successful ? 'Connected' : 'Failed'}
                  </span>
                </div>
              </div>
              {result.checks.connection.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {result.checks.connection.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schema Tables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Table className="mr-2 h-5 w-5" />
                  PTA2 Schema Tables
                </span>
                <Badge variant="outline">
                  {result.summary.existing_tables}/{result.summary.total_tables} Tables
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.checks.schema.tables.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <span className="font-medium">{table.table}</span>
                      {table.exists && (
                        <p className="text-xs text-gray-500">
                          {table.count} records
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      {table.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.summary.missing_tables.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Missing Tables:</strong> {result.summary.missing_tables.join(', ')}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    Run the SQL script from <code>lib/supabase/setup.ts</code> in your Supabase SQL editor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          {result.status !== 'success' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-blue-800">
                  {!result.checks.environment.valid && (
                    <p>1. Update <code>.env.local</code> with your actual Supabase credentials</p>
                  )}
                  {result.summary.missing_tables.length > 0 && (
                    <p>2. Run the schema setup SQL in your Supabase project</p>
                  )}
                  {!result.checks.connection.successful && (
                    <p>3. Verify your Supabase project URL and keys are correct</p>
                  )}
                  <p>4. Restart your development server after making changes</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}