import { format, isToday, isWeekend } from '../../lib/dates';

interface TimelineHeaderProps {
  days: Date[];
}

export function TimelineHeader({ days }: TimelineHeaderProps) {
  // Group days by week for week labels
  let currentMonth = '';

  return (
    <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20">
      {/* Resource name column */}
      <div className="w-52 min-w-52 px-4 py-2 border-r border-gray-200 bg-gray-50 flex items-end">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resources</span>
      </div>

      {/* Day columns */}
      <div className="flex flex-1">
        {days.map((day) => {
          const monthLabel = format(day, 'MMM yyyy');
          const showMonth = monthLabel !== currentMonth;
          if (showMonth) currentMonth = monthLabel;
          const weekend = isWeekend(day);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`flex-shrink-0 w-10 text-center border-r border-gray-100
                ${weekend ? 'bg-gray-50' : 'bg-white'}
                ${today ? 'bg-primary-50' : ''}`}
            >
              {showMonth && (
                <div className="text-[10px] font-semibold text-gray-500 truncate px-0.5">
                  {format(day, 'MMM')}
                </div>
              )}
              {!showMonth && <div className="h-[16px]" />}
              <div className={`text-[10px] ${weekend ? 'text-gray-400' : 'text-gray-500'}`}>
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-xs font-medium pb-1
                  ${today ? 'text-primary-600 font-bold' : weekend ? 'text-gray-400' : 'text-gray-700'}`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
