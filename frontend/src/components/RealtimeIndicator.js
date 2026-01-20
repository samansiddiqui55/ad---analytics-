import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';

const RealtimeIndicator = () => {
  const { isConnected } = useWebSocket();

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <Badge className="bg-[#10B981] text-white flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          <span className="animate-pulse">●</span>
          Real-time Active
        </Badge>
      ) : (
        <Badge className="bg-[#71717A] text-white flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Connecting...
        </Badge>
      )}
    </div>
  );
};

export default RealtimeIndicator;
