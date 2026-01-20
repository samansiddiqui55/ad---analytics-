import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onDateChange }) => {
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 60 days', days: 60 },
    { label: 'Last 90 days', days: 90 }
  ];

  const handlePresetClick = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateChange(start, end);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#18181B] border-[#27272A] text-[#FAFAFA] hover:bg-[#09090B]"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {startDate && endDate
            ? `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
            : 'Select date range'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-[#18181B] border-[#27272A]">
        <div className="space-y-3">
          <div className="text-sm font-medium text-[#FAFAFA] mb-2">Quick Select</div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.days}
                variant="ghost"
                size="sm"
                onClick={() => handlePresetClick(preset.days)}
                className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#09090B]"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
