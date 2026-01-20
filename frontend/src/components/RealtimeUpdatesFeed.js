import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RealtimeUpdatesFeed = () => {
  const { realtimeUpdates } = useWebSocket();
  const [visible, setVisible] = useState(true);

  return (
    <Card className="bg-[#18181B] border-[#27272A]" data-testid="realtime-feed">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-[#FAFAFA] flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#3B82F6]" />
            Live Updates
          </CardTitle>
          <span className="text-xs text-[#A1A1AA]">
            {realtimeUpdates.length} recent
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {realtimeUpdates.length === 0 ? (
            <div className="text-center py-8 text-[#A1A1AA]">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for real-time updates...</p>
            </div>
          ) : (
            realtimeUpdates.map((update, index) => (
              <div
                key={index}
                className="p-3 bg-[#09090B] border border-[#27272A] rounded-md hover:border-[#3B82F6] transition-all animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-[#FAFAFA] mb-1">
                      {update.campaign_name}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      update.platform === 'google_ads' ? 'bg-[#4285F4]' : 'bg-[#1877F2]'
                    } text-white`}>
                      {update.platform === 'google_ads' ? 'Google Ads' : 'Facebook Ads'}
                    </span>
                  </div>
                  <div className="text-xs text-[#71717A]">
                    {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Cost</p>
                    <p className="text-sm font-medium text-[#FAFAFA]">${update.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Revenue</p>
                    <p className="text-sm font-medium text-[#10B981]">${update.revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">ROAS</p>
                    <p className={`text-sm font-medium flex items-center gap-1 ${
                      update.roas > 2 ? 'text-[#10B981]' : update.roas > 1 ? 'text-[#FBBF24]' : 'text-[#EF4444]'
                    }`}>
                      {update.roas > 2 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {update.roas.toFixed(2)}x
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#27272A]">
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Impressions</p>
                    <p className="text-xs text-[#FAFAFA]">{update.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Clicks</p>
                    <p className="text-xs text-[#FAFAFA]">{update.clicks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A1A1AA]">Conversions</p>
                    <p className="text-xs text-[#FAFAFA]">{update.conversions}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeUpdatesFeed;
