import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, MousePointerClick, Eye } from 'lucide-react';

const CampaignComparisonModal = ({ open, onClose, campaigns, metrics }) => {
  const [campaign1, setCampaign1] = useState('');
  const [campaign2, setCampaign2] = useState('');

  const getMetricsForCampaign = (campaignId) => {
    const campaignMetrics = metrics.filter(m => m.campaign_id === campaignId);
    const totalCost = campaignMetrics.reduce((sum, m) => sum + m.cost, 0);
    const totalRevenue = campaignMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalConversions = campaignMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalClicks = campaignMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalImpressions = campaignMetrics.reduce((sum, m) => sum + m.impressions, 0);
    
    return {
      cost: totalCost,
      revenue: totalRevenue,
      conversions: totalConversions,
      clicks: totalClicks,
      impressions: totalImpressions,
      roas: totalCost > 0 ? totalRevenue / totalCost : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0,
      cpc: totalClicks > 0 ? totalCost / totalClicks : 0
    };
  };

  const campaign1Data = campaign1 ? campaigns.find(c => c.id === campaign1) : null;
  const campaign2Data = campaign2 ? campaigns.find(c => c.id === campaign2) : null;
  const metrics1 = campaign1 ? getMetricsForCampaign(campaign1) : null;
  const metrics2 = campaign2 ? getMetricsForCampaign(campaign2) : null;

  const MetricComparison = ({ label, value1, value2, format = 'number', icon: Icon }) => {
    const diff = value1 && value2 ? ((value1 - value2) / value2 * 100) : 0;
    const better = value1 > value2;
    
    return (
      <div className="py-3 border-b border-[#27272A] last:border-0">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="h-4 w-4 text-[#3B82F6]" />}
          <span className="text-sm text-[#A1A1AA]">{label}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-xl font-bold text-[#FAFAFA]">
            {format === 'currency' && '$'}{value1?.toFixed(2) || '0'}{format === 'percentage' && '%'}
          </div>
          <div className="text-xl font-bold text-[#FAFAFA]">
            {format === 'currency' && '$'}{value2?.toFixed(2) || '0'}{format === 'percentage' && '%'}
          </div>
        </div>
        {value1 && value2 && (
          <div className={`text-xs mt-1 ${better ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {better ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}% vs comparison
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#18181B] border-[#27272A] text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Campaign Comparison</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#A1A1AA] mb-2 block">Campaign 1</label>
              <Select value={campaign1} onValueChange={setCampaign1}>
                <SelectTrigger className="bg-[#09090B] border-[#27272A] text-[#FAFAFA]">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-[#27272A]">
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {campaign1Data && (
                <div className="mt-2 text-xs text-[#A1A1AA]">
                  Platform: {campaign1Data.platform === 'google_ads' ? 'Google Ads' : 'Facebook Ads'}
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm text-[#A1A1AA] mb-2 block">Campaign 2</label>
              <Select value={campaign2} onValueChange={setCampaign2}>
                <SelectTrigger className="bg-[#09090B] border-[#27272A] text-[#FAFAFA]">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-[#27272A]">
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {campaign2Data && (
                <div className="mt-2 text-xs text-[#A1A1AA]">
                  Platform: {campaign2Data.platform === 'google_ads' ? 'Google Ads' : 'Facebook Ads'}
                </div>
              )}
            </div>
          </div>

          {metrics1 && metrics2 && (
            <Card className="bg-[#09090B] border-[#27272A]">
              <CardHeader>
                <CardTitle className="text-lg">Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricComparison 
                  label="Total Spend" 
                  value1={metrics1.cost} 
                  value2={metrics2.cost} 
                  format="currency"
                  icon={DollarSign}
                />
                <MetricComparison 
                  label="Total Revenue" 
                  value1={metrics1.revenue} 
                  value2={metrics2.revenue} 
                  format="currency"
                  icon={TrendingUp}
                />
                <MetricComparison 
                  label="ROAS" 
                  value1={metrics1.roas} 
                  value2={metrics2.roas}
                  icon={Target}
                />
                <MetricComparison 
                  label="Conversions" 
                  value1={metrics1.conversions} 
                  value2={metrics2.conversions}
                  icon={Target}
                />
                <MetricComparison 
                  label="CTR" 
                  value1={metrics1.ctr} 
                  value2={metrics2.ctr} 
                  format="percentage"
                  icon={MousePointerClick}
                />
                <MetricComparison 
                  label="Conversion Rate" 
                  value1={metrics1.conversionRate} 
                  value2={metrics2.conversionRate} 
                  format="percentage"
                  icon={Target}
                />
                <MetricComparison 
                  label="Impressions" 
                  value1={metrics1.impressions} 
                  value2={metrics2.impressions}
                  icon={Eye}
                />
              </CardContent>
            </Card>
          )}

          {(!campaign1 || !campaign2) && (
            <div className="text-center py-12 text-[#A1A1AA]">
              Select two campaigns to compare their performance
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignComparisonModal;
