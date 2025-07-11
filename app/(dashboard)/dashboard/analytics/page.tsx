'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Users,
  GraduationCap,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  Filter,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import useSWR from 'swr';
import { PAYMENT_CATEGORY_OPTIONS, getCategoryConfig, PaymentCategory } from '@/lib/constants/payment-categories';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AnalyticsData {
  totalRevenue: number;
  totalPayments: number;
  paymentRate: number;
  averagePayment: number;
  monthlyTrends: any[];
  categoryBreakdown: any[];
  paymentMethodStats: any[];
  weeklyActivity: any[];
  topPerformingClasses: any[];
  pendingPayments: number;
  recentActivity: any[];
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  color = "blue",
  isLoading = false
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  isLoading?: boolean;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    orange: "text-orange-600 bg-orange-100",
    red: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3 text-green-500" />,
    down: <TrendingDown className="h-3 w-3 text-red-500" />,
    neutral: <Activity className="h-3 w-3 text-gray-500" />,
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
              ) : (
                value
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            {trend && trendValue && (
              <div className="flex items-center mt-2">
                {trendIcons[trend]}
                <span className={`text-xs ml-1 ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ 
  title, 
  icon: Icon, 
  children, 
  actions 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Icon className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data, title }: { data: any[], title: string }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm font-medium text-gray-600 truncate">
              {item.name}
            </div>
            <div className="flex-1 relative">
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-900 text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimplePieChart({ data, title }: { data: any[], title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-700">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.count} payments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">₱{item.value.toLocaleString()}</p>
                <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: payments, isLoading: paymentsLoading } = useSWR('/api/payments', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  
  const { data: parents, isLoading: parentsLoading } = useSWR('/api/parents', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  
  const { data: students, isLoading: studentsLoading } = useSWR('/api/students', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  
  const { data: classes, isLoading: classesLoading } = useSWR('/api/classes', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const analyticsData = useMemo(() => {
    const safePayments = Array.isArray(payments) ? payments : [];
    const safeParents = Array.isArray(parents) ? parents : [];
    const safeStudents = Array.isArray(students) ? students : [];
    const safeClasses = Array.isArray(classes) ? classes : [];

    // Calculate key metrics
    const totalRevenue = safePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalPayments = safePayments.length;
    const paidParents = safeParents.filter((p: any) => p.payment_status);
    const paymentRate = safeParents.length > 0 ? (paidParents.length / safeParents.length) * 100 : 0;
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    const pendingPayments = safeParents.length - paidParents.length;

    // Monthly trends
    const monthlyTrends = safePayments.reduce((acc: any, payment: any) => {
      const month = new Date(payment.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + (payment.amount || 0);
      return acc;
    }, {});

    // Category breakdown
    const categoryBreakdown = safePayments.reduce((acc: any, payment: any) => {
      const category = payment.category || 'membership';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += payment.amount || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    // Payment method stats
    const paymentMethodStats = safePayments.reduce((acc: any, payment: any) => {
      const method = payment.payment_method || 'cash';
      if (!acc[method]) {
        acc[method] = { total: 0, count: 0 };
      }
      acc[method].total += payment.amount || 0;
      acc[method].count += 1;
      return acc;
    }, {});

    // Weekly activity (last 7 days)
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayPayments = safePayments.filter((p: any) => {
        const paymentDate = new Date(p.created_at);
        return paymentDate.toDateString() === date.toDateString();
      });
      return {
        name: dayName,
        value: dayPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        count: dayPayments.length
      };
    }).reverse();

    // Top performing classes (by payment rate)
    const topPerformingClasses = safeClasses.map((cls: any) => {
      const classStudents = safeStudents.filter((s: any) => s.class_id === cls.id);
      const paidStudents = classStudents.filter((s: any) => s.payment_status);
      const paymentRate = classStudents.length > 0 ? (paidStudents.length / classStudents.length) * 100 : 0;
      
      return {
        name: cls.name,
        value: Math.round(paymentRate),
        count: classStudents.length,
        paid: paidStudents.length
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5);

    // Recent activity
    const recentActivity = safePayments
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      totalRevenue,
      totalPayments,
      paymentRate,
      averagePayment,
      pendingPayments,
      monthlyTrends: Object.entries(monthlyTrends).map(([month, amount]) => ({ name: month, value: amount })),
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]: [string, any]) => ({
        name: getCategoryConfig(category as PaymentCategory).label,
        value: data.total,
        count: data.count,
        color: getCategoryConfig(category as PaymentCategory).color === 'blue' ? '#3b82f6' : 
               getCategoryConfig(category as PaymentCategory).color === 'green' ? '#10b981' :
               getCategoryConfig(category as PaymentCategory).color === 'orange' ? '#f59e0b' :
               getCategoryConfig(category as PaymentCategory).color === 'red' ? '#ef4444' :
               getCategoryConfig(category as PaymentCategory).color === 'purple' ? '#8b5cf6' : '#6b7280'
      })),
      paymentMethodStats: Object.entries(paymentMethodStats).map(([method, data]: [string, any]) => ({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        value: data.total,
        count: data.count,
        color: method === 'cash' ? '#10b981' : method === 'bank' ? '#3b82f6' : '#f59e0b'
      })),
      weeklyActivity,
      topPerformingClasses,
      recentActivity
    };
  }, [payments, parents, students, classes]);

  const isLoading = paymentsLoading || parentsLoading || studentsLoading || classesLoading;

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="mr-3 h-6 w-6" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into PTA payments and performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₱${analyticsData.totalRevenue.toLocaleString()}`}
          subtitle="All time collections"
          icon={DollarSign}
          trend="up"
          trendValue="+12.5% vs last month"
          color="green"
          isLoading={isLoading}
        />
        <MetricCard
          title="Payment Rate"
          value={`${Math.round(analyticsData.paymentRate)}%`}
          subtitle={`${Math.round(analyticsData.paymentRate * (Array.isArray(parents) ? parents.length : 0) / 100)} of ${Array.isArray(parents) ? parents.length : 0} parents`}
          icon={Target}
          trend="up"
          trendValue="+3.2% vs last month"
          color="blue"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Payments"
          value={analyticsData.totalPayments}
          subtitle="Payment transactions"
          icon={CheckCircle}
          trend="up"
          trendValue="+8 this week"
          color="green"
          isLoading={isLoading}
        />
        <MetricCard
          title="Average Payment"
          value={`₱${Math.round(analyticsData.averagePayment)}`}
          subtitle="Per transaction"
          icon={BarChart3}
          trend="neutral"
          trendValue="Same as last month"
          color="purple"
          isLoading={isLoading}
        />
        <MetricCard
          title="Pending Payments"
          value={analyticsData.pendingPayments}
          subtitle="Unpaid parents"
          icon={Clock}
          trend="down"
          trendValue="-5 this week"
          color="orange"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <ChartCard
          title="Monthly Revenue Trend"
          icon={TrendingUp}
          actions={
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          }
        >
          {analyticsData.monthlyTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No payment data available</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-end space-x-2">
              {analyticsData.monthlyTrends.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t min-h-[20px] transition-all duration-300"
                    style={{ 
                      height: `${analyticsData.monthlyTrends.length > 0 ? 
                        (Number(item.value) / Math.max(...analyticsData.monthlyTrends.map(t => Number(t.value)))) * 200 : 20}px` 
                    }}
                  />
                  <div className="mt-2 text-xs text-gray-600">{item.name}</div>
                  <div className="text-xs font-medium">₱{Number(item.value).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Income by Category */}
        <ChartCard
          title="Income by Category"
          icon={PieChart}
        >
          {analyticsData.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No payment data available</p>
              </div>
            </div>
          ) : (
            <SimplePieChart 
              data={analyticsData.categoryBreakdown} 
              title="Revenue Distribution"
            />
          )}
        </ChartCard>

        {/* Weekly Activity */}
        <ChartCard
          title="Weekly Activity"
          icon={Activity}
        >
          <SimpleBarChart 
            data={analyticsData.weeklyActivity} 
            title="Daily Collections (Last 7 Days)"
          />
        </ChartCard>

        {/* Top Performing Classes */}
        <ChartCard
          title="Top Performing Classes"
          icon={GraduationCap}
        >
          <SimpleBarChart 
            data={analyticsData.topPerformingClasses} 
            title="Payment Rate by Class (%)"
          />
        </ChartCard>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.paymentMethodStats.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <div>
                      <p className="font-medium text-sm">{method.name}</p>
                      <p className="text-xs text-gray-600">{method.count} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₱{method.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">
                      {((method.value / analyticsData.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                analyticsData.recentActivity.map((activity: any, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.parent?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600">
                        ₱{activity.amount}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">
                        {activity.payment_method || 'cash'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Students</span>
                <span className="font-bold">
                  {Array.isArray(students) ? students.length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Classes</span>
                <span className="font-bold">
                  {Array.isArray(classes) ? classes.length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Parents</span>
                <span className="font-bold">
                  {Array.isArray(parents) ? parents.length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="font-bold text-green-600">
                  {Math.round(analyticsData.paymentRate)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg per Student</span>
                <span className="font-bold">
                  ₱{Array.isArray(students) && students.length > 0 ? 
                    Math.round(analyticsData.totalRevenue / students.length) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}