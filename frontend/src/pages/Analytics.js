import { useEffect, useState } from 'react';
import { performanceAPI, campaignsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Analytics = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [campaignsRes, metricsRes] = await Promise.all([
        campaignsAPI.getAll(),
        performanceAPI.getMetrics({ days: 30 })
      ]);
      setCampaigns(campaignsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      toast.error('Failed to load analytics data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMetrics = selectedCampaign === 'all' 
    ? metrics 
    : metrics.filter(m => m.campaign_id === selectedCampaign);

  const aggregateByDate = () => {
    const dateMap = {};
    filteredMetrics.forEach(metric => {
      if (!dateMap[metric.date]) {
        dateMap[metric.date] = {
          date: metric.date,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          cost: 0,
          revenue: 0
        };
      }
      dateMap[metric.date].impressions += metric.impressions;
      dateMap[metric.date].clicks += metric.clicks;
      dateMap[metric.date].conversions += metric.conversions;
      dateMap[metric.date].cost += metric.cost;
      dateMap[metric.date].revenue += metric.revenue;
    });
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getPlatformDistribution = () => {
    const platformData = {};
    filteredMetrics.forEach(metric => {
      if (!platformData[metric.platform]) {
        platformData[metric.platform] = 0;
      }
      platformData[metric.platform] += metric.cost;
    });
    return [
      { name: 'Google Ads', value: platformData.google_ads || 0, color: '#4285F4' },
      { name: 'Facebook Ads', value: platformData.facebook_ads || 0, color: '#1877F2' }
    ];
  };

  const getTopCampaigns = () => {
    const campaignData = {};
    filteredMetrics.forEach(metric => {
      if (!campaignData[metric.campaign_name]) {
        campaignData[metric.campaign_name] = {
          name: metric.campaign_name,
          revenue: 0,
          cost: 0
        };
      }
      campaignData[metric.campaign_name].revenue += metric.revenue;
      campaignData[metric.campaign_name].cost += metric.cost;
    });
    
    return Object.values(campaignData)
      .map(c => ({ ...c, roi: c.cost > 0 ? ((c.revenue - c.cost) / c.cost * 100) : 0 }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#A1A1AA]">Loading analytics...</div>
      </div>
    );
  }

  const timeSeriesData = aggregateByDate();
  const platformData = getPlatformDistribution();
  const topCampaigns = getTopCampaigns();

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#FAFAFA] tracking-tight">Performance Analytics</h1>
          <p className="text-[#A1A1AA] mt-1">Deep dive into campaign performance metrics</p>
        </div>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[250px] bg-[#18181B] border-[#27272A] text-[#FAFAFA]" data-testid="campaign-select">
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent className="bg-[#18181B] border-[#27272A]">
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map(campaign => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#18181B] border-[#27272A]" data-testid="performance-trend-chart">
          <CardHeader>
            <CardTitle className="text-[#FAFAFA]">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                />
                <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="cost" stroke="#EF4444" fillOpacity={1} fill="url(#colorCost)" name="Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#18181B] border-[#27272A]" data-testid="platform-distribution-chart">
          <CardHeader>
            <CardTitle className="text-[#FAFAFA]">Spend by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181B', 
                    border: '1px solid #27272A',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#18181B] border-[#27272A]" data-testid="conversions-chart">
          <CardHeader>
            <CardTitle className="text-[#FAFAFA]">Conversions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.3} />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} />
                <YAxis stroke="#A1A1AA" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181B', 
                    border: '1px solid #27272A',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                <Line type="monotone" dataKey="conversions" stroke="#A78BFA" strokeWidth={2} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#18181B] border-[#27272A]" data-testid="top-campaigns-chart">
          <CardHeader>
            <CardTitle className="text-[#FAFAFA]">Top Performing Campaigns (ROI %)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCampaigns} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.3} />
                <XAxis type="number" stroke="#A1A1AA" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#A1A1AA" fontSize={12} width={150} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181B', 
                    border: '1px solid #27272A',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="roi" fill="#3B82F6" name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
