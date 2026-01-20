import { useEffect, useState } from 'react';
import { campaignsAPI, performanceAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, GitCompare } from 'lucide-react';
import CampaignComparisonModal from '@/components/CampaignComparisonModal';
import ExportButton from '@/components/ExportButton';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComparison, setShowComparison] = useState(false);

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
      toast.error('Failed to load campaigns');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesPlatform = selectedPlatform === 'all' || c.platform === selectedPlatform;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const getStatusColor = (status) => {
    if (status === 'ACTIVE' || status === 'ENABLED') return 'bg-[#10B981]';
    if (status === 'PAUSED') return 'bg-[#FBBF24]';
    return 'bg-[#71717A]';
  };

  const getPlatformColor = (platform) => {
    return platform === 'google_ads' ? 'bg-[#4285F4]' : 'bg-[#1877F2]';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[#A1A1AA]">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="campaigns-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#FAFAFA] tracking-tight">Campaign Management</h1>
          <p className="text-[#A1A1AA] mt-1">View and manage all your advertising campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowComparison(true)}
            variant="outline"
            className="bg-[#18181B] border-[#27272A] text-[#FAFAFA] hover:bg-[#09090B]"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Compare Campaigns
          </Button>
          <ExportButton data={filteredCampaigns} filename="campaigns" type="campaigns" />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#18181B] border-[#27272A] text-[#FAFAFA]"
          />
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedPlatform}>
        <TabsList className="bg-[#18181B] border border-[#27272A]">
          <TabsTrigger value="all" data-testid="tab-all">All Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="google_ads" data-testid="tab-google">
            Google Ads ({campaigns.filter(c => c.platform === 'google_ads').length})
          </TabsTrigger>
          <TabsTrigger value="facebook_ads" data-testid="tab-facebook">
            Facebook Ads ({campaigns.filter(c => c.platform === 'facebook_ads').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPlatform} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card 
                key={campaign.id} 
                className="bg-[#18181B] border-[#27272A] hover:border-[#3B82F6] transition-colors"
                data-testid={`campaign-card-${campaign.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-[#FAFAFA] text-lg mb-2">
                        {campaign.name}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge 
                          className={`${getPlatformColor(campaign.platform)} text-white text-xs`}
                          data-testid="campaign-platform-badge"
                        >
                          {campaign.platform === 'google_ads' ? 'Google Ads' : 'Facebook Ads'}
                        </Badge>
                        <Badge 
                          className={`${getStatusColor(campaign.status)} text-white text-xs`}
                          data-testid="campaign-status-badge"
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#A1A1AA]">Budget</span>
                      <span className="text-sm font-medium text-[#FAFAFA]" data-testid="campaign-budget">
                        ${campaign.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#A1A1AA]">Campaign ID</span>
                      <span className="text-xs font-mono text-[#71717A]" data-testid="campaign-id">
                        {campaign.external_id.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12" data-testid="no-campaigns-message">
              <p className="text-[#A1A1AA]">
                {searchQuery ? 'No campaigns match your search' : 'No campaigns found'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CampaignComparisonModal
        open={showComparison}
        onClose={() => setShowComparison(false)}
        campaigns={campaigns}
        metrics={metrics}
      />
    </div>
  );
};

export default Campaigns;
