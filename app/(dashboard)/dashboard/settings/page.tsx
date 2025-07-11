'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  User, 
  Bell, 
  Shield,
  Database,
  Palette,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile Settings
    schoolName: 'Demo Elementary School',
    schoolAddress: '123 Education St, City, State',
    adminEmail: 'admin@school.edu',
    adminName: 'Admin User',
    
    // Notification Settings
    emailNotifications: true,
    paymentAlerts: true,
    weeklyReports: false,
    systemUpdates: true,
    
    // Security Settings
    requireStrongPasswords: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
    
    // System Settings
    defaultPaymentAmount: 250,
    currency: 'PHP',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'Asia/Manila',
    
    // Appearance Settings
    theme: 'light',
    primaryColor: '#3b82f6',
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1500);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      // Reset to default values
      setSettings({
        schoolName: 'Demo Elementary School',
        schoolAddress: '123 Education St, City, State',
        adminEmail: 'admin@school.edu',
        adminName: 'Admin User',
        emailNotifications: true,
        paymentAlerts: true,
        weeklyReports: false,
        systemUpdates: true,
        requireStrongPasswords: true,
        sessionTimeout: 30,
        twoFactorAuth: false,
        defaultPaymentAmount: 250,
        currency: 'PHP',
        dateFormat: 'MM/DD/YYYY',
        timezone: 'Asia/Manila',
        theme: 'light',
        primaryColor: '#3b82f6',
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 30,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 h-6 w-6" />
            System Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure your PTA management system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={settings.schoolName}
                  onChange={(e) => setSettings({...settings, schoolName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">School Address</Label>
                <Textarea
                  id="schoolAddress"
                  value={settings.schoolAddress}
                  onChange={(e) => setSettings({...settings, schoolAddress: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminName">Administrator Name</Label>
                <Input
                  id="adminName"
                  value={settings.adminName}
                  onChange={(e) => setSettings({...settings, adminName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Administrator Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive email alerts for important events</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="paymentAlerts">Payment Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified when payments are received</p>
                </div>
                <Switch
                  id="paymentAlerts"
                  checked={settings.paymentAlerts}
                  onCheckedChange={(checked) => setSettings({...settings, paymentAlerts: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  <p className="text-sm text-gray-600">Receive weekly payment summaries</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => setSettings({...settings, weeklyReports: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemUpdates">System Updates</Label>
                  <p className="text-sm text-gray-600">Notifications about system updates</p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={settings.systemUpdates}
                  onCheckedChange={(checked) => setSettings({...settings, systemUpdates: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireStrongPasswords">Strong Passwords</Label>
                  <p className="text-sm text-gray-600">Require complex passwords for all users</p>
                </div>
                <Switch
                  id="requireStrongPasswords"
                  checked={settings.requireStrongPasswords}
                  onCheckedChange={(checked) => setSettings({...settings, requireStrongPasswords: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  min="5"
                  max="120"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add extra security to user accounts</p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPaymentAmount">Default Payment Amount</Label>
                <Input
                  id="defaultPaymentAmount"
                  type="number"
                  value={settings.defaultPaymentAmount}
                  onChange={(e) => setSettings({...settings, defaultPaymentAmount: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <select
                  id="dateFormat"
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Asia/Manila">Asia/Manila</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => setSettings({...settings, theme: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Backup & Recovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Automatic Backup</Label>
                  <p className="text-sm text-gray-600">Enable automatic data backups</p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <select
                  id="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!settings.autoBackup}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retentionDays">Retention Period (days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                  min="1"
                  max="365"
                  disabled={!settings.autoBackup}
                />
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Create Backup Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Service</span>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600">Pending</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">System Version</span>
                <span className="text-sm text-gray-600">v2.1.0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}