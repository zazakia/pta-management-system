'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Download, 
  FileText, 
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  GraduationCap,
  CreditCard,
  DollarSign,
  Database,
  FileSpreadsheet,
  FileJson,
  Mail
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ExportJob {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  file_size?: string;
  download_url?: string;
}

export default function ExportsPage() {
  const [exporting, setExporting] = useState(false);
  const [selectedData, setSelectedData] = useState({
    payments: true,
    parents: true,
    students: true,
    classes: false,
    users: false,
  });
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    to: new Date(), // Today
  });

  // Mock export jobs - in real app, this would come from API
  const [exportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Payment Records Export',
      type: 'payments',
      status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5).toISOString(), // 5 min later
      file_size: '2.4 MB',
      download_url: '/downloads/payments_export.csv',
    },
    {
      id: '2',
      name: 'Parent Directory Export',
      type: 'parents',
      status: 'processing',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
    },
    {
      id: '3',
      name: 'Student Records Export',
      type: 'students',
      status: 'failed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
  ]);

  const { data: stats } = useSWR('/api/reports', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const handleExport = async () => {
    setExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setExporting(false);
      alert('Export job started! You will receive an email when it\'s ready for download.');
    }, 2000);
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payments':
        return <CreditCard className="h-4 w-4" />;
      case 'parents':
        return <Users className="h-4 w-4" />;
      case 'students':
        return <GraduationCap className="h-4 w-4" />;
      case 'classes':
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Eye className="mr-3 h-6 w-6" />
            Data Export
          </h1>
          <p className="text-gray-600 mt-1">
            Export your data for backup, analysis, or reporting
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Create New Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select Data to Export</Label>
                <p className="text-sm text-gray-600 mb-3">Choose which data you want to include</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="payments"
                    checked={selectedData.payments}
                    onCheckedChange={(checked) => 
                      setSelectedData({...selectedData, payments: checked as boolean})
                    }
                  />
                  <Label htmlFor="payments" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Records
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parents"
                    checked={selectedData.parents}
                    onCheckedChange={(checked) => 
                      setSelectedData({...selectedData, parents: checked as boolean})
                    }
                  />
                  <Label htmlFor="parents" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Parent Directory
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="students"
                    checked={selectedData.students}
                    onCheckedChange={(checked) => 
                      setSelectedData({...selectedData, students: checked as boolean})
                    }
                  />
                  <Label htmlFor="students" className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student Records
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="classes"
                    checked={selectedData.classes}
                    onCheckedChange={(checked) => 
                      setSelectedData({...selectedData, classes: checked as boolean})
                    }
                  />
                  <Label htmlFor="classes" className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Class Information
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="users"
                    checked={selectedData.users}
                    onCheckedChange={(checked) => 
                      setSelectedData({...selectedData, users: checked as boolean})
                    }
                  />
                  <Label htmlFor="users" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    User Accounts
                  </Label>
                </div>
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Export Format</Label>
                <p className="text-sm text-gray-600 mb-3">Choose your preferred file format</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="csv"
                    name="format"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <Label htmlFor="csv" className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV (Comma Separated Values)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="excel"
                    name="format"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <Label htmlFor="excel" className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Excel (.xlsx)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="json"
                    name="format"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <Label htmlFor="json" className="flex items-center">
                    <FileJson className="h-4 w-4 mr-2 text-blue-600" />
                    JSON
                  </Label>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Date Range</Label>
                <p className="text-sm text-gray-600 mb-3">Filter data by date range</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <DatePicker
                    date={dateRange.from}
                    onDateChange={(date) => setDateRange({...dateRange, from: date || new Date()})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <DatePicker
                    date={dateRange.to}
                    onDateChange={(date) => setDateRange({...dateRange, to: date || new Date()})}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button 
              onClick={handleExport} 
              disabled={exporting || !Object.values(selectedData).some(Boolean)}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Creating Export...' : 'Start Export'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Export History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exportJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No export jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exportJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(job.type)}
                      <div>
                        <h4 className="font-medium">{job.name}</h4>
                        <p className="text-sm text-gray-600">
                          Created {new Date(job.created_at).toLocaleDateString()} at{' '}
                          {new Date(job.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    
                    {job.file_size && (
                      <span className="text-sm text-gray-600">{job.file_size}</span>
                    )}
                    
                    {job.status === 'completed' && job.download_url && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    
                    {job.status === 'failed' && (
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalPayments || 0}
            </div>
            <div className="text-sm text-gray-600">Payment Records</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalParents || 0}
            </div>
            <div className="text-sm text-gray-600">Parent Records</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.totalStudents || 0}
            </div>
            <div className="text-sm text-gray-600">Student Records</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.totalClasses || 0}
            </div>
            <div className="text-sm text-gray-600">Class Records</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}