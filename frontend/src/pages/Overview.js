import { useEffect, useState } from 'react';
import { campaignsAPI, performanceAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DateRangePicker from '@/components/DateRangePicker';
import ExportButton from '@/components/ExportButton';
import RealtimeIndicator from '@/components/RealtimeIndicator';
import RealtimeUpdatesFeed from '@/components/RealtimeUpdatesFeed';

const Overview = () => {
  const [summary, setSummary] = useState(null);
  const [recentMetrics, setRecentMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // useEffect(() => {
  //   generateAlerts();
  // }, [summary, recentMetrics]);

  useEffect(() => {
  generateAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, metricsRes] = await Promise.all([
        campaignsAPI.getSummary(),
        performanceAPI.getMetrics({ days: 7 })
      ]);
      setSummary(summaryRes.data);
      setRecentMetrics(metricsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await performanceAPI.sync();
      toast.success('Data synced successfully!');
      await fetchData();
    } catch (error) {
      toast.error('Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const generateAlerts = () => {
    const newAlerts = [];
    
    if (summary && summary.total_roas < 1.5) {
      newAlerts.push({
        type: 'warning',
        message: `Low ROAS Alert: Current ROAS is ${summary.total_roas.toFixed(2)}x. Consider optimizing campaigns.`,
        priority: 'high'
      });
    }
    
    if (summary && summary.total_spend > 100000) {
      newAlerts.push({
        type: 'info',
        message: `High spend detected: $${summary.total_spend.toLocaleString()} in the last 30 days.`,
        priority: 'medium'
      });
    }
    
    setAlerts(newAlerts);
  };

  const aggregateByDate = () => {
    const dateMap = {};
    recentMetrics.forEach(metric => {
      if (!dateMap[metric.date]) {
        dateMap[metric.date] = {
          date: metric.date,
          google_ads: 0,
          facebook_ads: 0,
          total: 0
        };
      }
      dateMap[metric.date][metric.platform] += metric.cost;
      dateMap[metric.date].total += metric.cost;
    });
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getROIByPlatform = () => {
    const platformData = {};
    recentMetrics.forEach(metric => {
      if (!platformData[metric.platform]) {
        platformData[metric.platform] = { revenue: 0, cost: 0 };
      }
      platformData[metric.platform].revenue += metric.revenue;
      platformData[metric.platform].cost += metric.cost;
    });

    return Object.entries(platformData).map(([platform, data]) => ({
      platform: platform === 'google_ads' ? 'Google Ads' : 'Facebook Ads',
      roi: data.cost > 0 ? ((data.revenue - data.cost) / data.cost * 100) : 0
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#A1A1AA]">Loading...</div>
      </div>
    );
  }

  const chartData = aggregateByDate();
  const roiData = getROIByPlatform();

  return (
    <div className="space-y-6" data-testid="overview-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#FAFAFA] tracking-tight">Dashboard Overview</h1>
          <p className="text-[#A1A1AA] mt-1">Real-time campaign performance at a glance</p>
        </div>
        <div className="flex gap-2 items-center">
          <RealtimeIndicator />
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onDateChange={(start, end) => setDateRange({ start, end })}
          />
          <ExportButton data={recentMetrics} filename="overview-metrics" type="metrics" />
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-[#3B82F6] hover:bg-[#2563EB]"
            data-testid="sync-button"
            style={{ boxShadow: '0 0 15px rgba(59,130,246,0.4)' }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-md border ${
                alert.type === 'warning' ? 'bg-[#FBBF24]/10 border-[#FBBF24]' : 'bg-[#3B82F6]/10 border-[#3B82F6]'
              }`}
            >
              <AlertTriangle className={`h-5 w-5 ${alert.type === 'warning' ? 'text-[#FBBF24]' : 'text-[#3B82F6]'}`} />
              <span className="text-sm text-[#FAFAFA]">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#18181B] border-[#27272A]" data-testid="total-campaigns-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#A1A1AA]">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-[#3B82F6]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FAFAFA]">{summary.total_campaigns}</div>
              <p className="text-xs text-[#71717A] mt-1">
                Google: {summary.google_ads_campaigns} | Facebook: {summary.facebook_ads_campaigns}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-[#27272A]" data-testid="total-spend-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#A1A1AA]">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-[#EF4444]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FAFAFA]">${summary.total_spend.toLocaleString()}</div>
              <p className="text-xs text-[#71717A] mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-[#27272A]" data-testid="total-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#A1A1AA]">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#10B981]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FAFAFA]">${summary.total_revenue.toLocaleString()}</div>
              <p className="text-xs text-[#10B981] mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {summary.total_roas.toFixed(2)}x ROAS
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#18181B] border-[#27272A]" data-testid="total-conversions-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#A1A1AA]">Total Conversions</CardTitle>
              <Target className="h-4 w-4 text-[#A78BFA]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FAFAFA]">{summary.total_conversions.toLocaleString()}</div>
              <p className="text-xs text-[#71717A] mt-1">
                {summary.total_clicks.toLocaleString()} clicks from {summary.total_impressions.toLocaleString()} impressions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#18181B] border-[#27272A]" data-testid="spend-trend-chart">
          <CardHeader>
            <CardTitle className="text-[#FAFAFA]">Spend Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.3} />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} />
                <YAxis stroke="#A1A1AA" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181B', 
                    border: '1px solid #27272A',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#FAFAFA' }}
                  itemStyle={{ color: '#A1A1AA' }}
                />
                <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                <Line type="monotone" dataKey="google_ads" stroke="#4285F4" strokeWidth={2} name="Google Ads" />
                <Line type="monotone" dataKey="facebook_ads" stroke="#1877F2" strokeWidth={2} name="Facebook Ads" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <RealtimeUpdatesFeed />
      </div>

      <Card className="bg-[#18181B] border-[#27272A]" data-testid="roi-comparison-chart">
        <CardHeader>
          <CardTitle className="text-[#FAFAFA]">ROI by Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.3} />
              <XAxis dataKey="platform" stroke="#A1A1AA" fontSize={12} />
              <YAxis stroke="#A1A1AA" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181B', 
                  border: '1px solid #27272A',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#FAFAFA' }}
                itemStyle={{ color: '#A1A1AA' }}
              />
              <Bar dataKey="roi" fill="#3B82F6" name="ROI %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
