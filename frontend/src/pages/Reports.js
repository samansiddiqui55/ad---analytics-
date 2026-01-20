import { useEffect, useState } from 'react';
import { performanceAPI, campaignsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, metricsRes, campaignsRes] = await Promise.all([
        campaignsAPI.getSummary(),
        performanceAPI.getMetrics({ days: 30 }),
        campaignsAPI.getAll()
      ]);
      setSummary(summaryRes.data);
      setMetrics(metricsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      toast.error('Failed to load reports data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = () => {
    const recommendations = [];

    // Analyze ROAS
    if (summary && summary.total_roas < 2) {
      recommendations.push({
        type: 'warning',
        title: 'Low ROAS Alert',
        description: `Current ROAS is ${summary.total_roas.toFixed(2)}x. Consider optimizing ad targeting and bidding strategies to improve return on ad spend.`,
        priority: 'high'
      });
    } else if (summary && summary.total_roas > 3) {
      recommendations.push({
        type: 'success',
        title: 'Excellent ROAS Performance',
        description: `Current ROAS is ${summary.total_roas.toFixed(2)}x. Your campaigns are performing well. Consider scaling up budget on top performers.`,
        priority: 'low'
      });
    }

    // Analyze campaign performance by platform
    const platformPerformance = {};
    metrics.forEach(metric => {
      if (!platformPerformance[metric.platform]) {
        platformPerformance[metric.platform] = { revenue: 0, cost: 0, conversions: 0 };
      }
      platformPerformance[metric.platform].revenue += metric.revenue;
      platformPerformance[metric.platform].cost += metric.cost;
      platformPerformance[metric.platform].conversions += metric.conversions;
    });

    Object.entries(platformPerformance).forEach(([platform, data]) => {
      const roas = data.cost > 0 ? data.revenue / data.cost : 0;
      const platformName = platform === 'google_ads' ? 'Google Ads' : 'Facebook Ads';
      
      if (roas < 1.5) {
        recommendations.push({
          type: 'warning',
          title: `${platformName} Underperforming`,
          description: `${platformName} ROAS is ${roas.toFixed(2)}x. Review ad creatives, audience targeting, and bidding strategies for this platform.`,
          priority: 'medium'
        });
      }
    });

    // Check for campaigns with low conversions
    const campaignMetrics = {};
    metrics.forEach(metric => {
      if (!campaignMetrics[metric.campaign_id]) {
        campaignMetrics[metric.campaign_id] = {
          name: metric.campaign_name,
          conversions: 0,
          clicks: 0
        };
      }
      campaignMetrics[metric.campaign_id].conversions += metric.conversions;
      campaignMetrics[metric.campaign_id].clicks += metric.clicks;
    });

    Object.values(campaignMetrics).forEach(campaign => {
      const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks * 100) : 0;
      if (conversionRate < 5 && campaign.clicks > 100) {
        recommendations.push({
          type: 'info',
          title: `Optimize ${campaign.name}`,
          description: `Conversion rate is ${conversionRate.toFixed(2)}%. Consider improving landing page experience and ad relevance.`,
          priority: 'medium'
        });
      }
    });

    // General recommendation if doing well
    if (summary && summary.total_roas > 2.5 && recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Strong Overall Performance',
        description: 'Your campaigns are performing well across all metrics. Continue monitoring and consider incrementally increasing budgets on top performers.',
        priority: 'low'
      });
    }

    return recommendations.slice(0, 5);
  };

  const getCampaignInsights = () => {
    return campaigns.map(campaign => {
      const campaignMetrics = metrics.filter(m => m.campaign_id === campaign.id);
      const totalCost = campaignMetrics.reduce((sum, m) => sum + m.cost, 0);
      const totalRevenue = campaignMetrics.reduce((sum, m) => sum + m.revenue, 0);
      const totalConversions = campaignMetrics.reduce((sum, m) => sum + m.conversions, 0);
      const totalClicks = campaignMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const totalImpressions = campaignMetrics.reduce((sum, m) => sum + m.impressions, 0);
      
      const roas = totalCost > 0 ? totalRevenue / totalCost : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;

      return {
        ...campaign,
        totalCost,
        totalRevenue,
        totalConversions,
        roas,
        ctr,
        conversionRate,
        performance: roas > 2 ? 'excellent' : roas > 1.5 ? 'good' : roas > 1 ? 'average' : 'poor'
      };
    }).sort((a, b) => b.roas - a.roas);
  };

  const handleDownloadReport = () => {
    toast.success('Report download started');
    // In a real app, this would generate and download a PDF/CSV
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#A1A1AA]">Loading reports...</div>
      </div>
    );
  }

  const recommendations = generateRecommendations();
  const campaignInsights = getCampaignInsights();

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#FAFAFA] tracking-tight">Performance Reports</h1>
          <p className="text-[#A1A1AA] mt-1">AI-powered insights and recommendations</p>
        </div>
        <Button
          onClick={handleDownloadReport}
          className="bg-[#3B82F6] hover:bg-[#2563EB]"
          data-testid="download-report-button"
          style={{ boxShadow: '0 0 15px rgba(59,130,246,0.4)' }}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      <Card className="bg-[#18181B] border-[#27272A]" data-testid="recommendations-card">
        <CardHeader>
          <CardTitle className="text-[#FAFAFA]">AI-Powered Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const Icon = rec.type === 'warning' ? AlertCircle : 
                          rec.type === 'success' ? CheckCircle : TrendingUp;
              const iconColor = rec.type === 'warning' ? 'text-[#FBBF24]' : 
                               rec.type === 'success' ? 'text-[#10B981]' : 'text-[#3B82F6]';
              const borderColor = rec.type === 'warning' ? 'border-l-[#FBBF24]' : 
                                 rec.type === 'success' ? 'border-l-[#10B981]' : 'border-l-[#3B82F6]';
              
              return (
                <div
                  key={index}
                  className={`p-4 bg-[#09090B] border-l-4 ${borderColor} rounded-md`}
                  data-testid={`recommendation-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#FAFAFA] mb-1">{rec.title}</h3>
                      <p className="text-sm text-[#A1A1AA]">{rec.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'high' ? 'bg-[#EF4444] text-white' :
                      rec.priority === 'medium' ? 'bg-[#FBBF24] text-[#09090B]' :
                      'bg-[#10B981] text-white'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#18181B] border-[#27272A]" data-testid="campaign-insights-card">
        <CardHeader>
          <CardTitle className="text-[#FAFAFA]">Campaign Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#A1A1AA]">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#A1A1AA]">Platform</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#A1A1AA]">Spend</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#A1A1AA]">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#A1A1AA]">ROAS</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#A1A1AA]">CTR</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#A1A1AA]">Conv Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-[#A1A1AA]">Performance</th>
                </tr>
              </thead>
              <tbody>
                {campaignInsights.map((campaign, index) => (
                  <tr key={campaign.id} className="border-b border-[#27272A] hover:bg-[#09090B]" data-testid={`insight-row-${index}`}>
                    <td className="py-3 px-4 text-sm text-[#FAFAFA]">{campaign.name}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs text-white ${
                        campaign.platform === 'google_ads' ? 'bg-[#4285F4]' : 'bg-[#1877F2]'
                      }`}>
                        {campaign.platform === 'google_ads' ? 'Google' : 'Facebook'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-[#FAFAFA]">${campaign.totalCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right text-[#FAFAFA]">${campaign.totalRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={campaign.roas > 2 ? 'text-[#10B981]' : campaign.roas > 1 ? 'text-[#FBBF24]' : 'text-[#EF4444]'}>
                        {campaign.roas.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-[#A1A1AA]">{campaign.ctr.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-sm text-right text-[#A1A1AA]">{campaign.conversionRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        campaign.performance === 'excellent' ? 'bg-[#10B981] text-white' :
                        campaign.performance === 'good' ? 'bg-[#22D3EE] text-[#09090B]' :
                        campaign.performance === 'average' ? 'bg-[#FBBF24] text-[#09090B]' :
                        'bg-[#EF4444] text-white'
                      }`}>
                        {campaign.performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
