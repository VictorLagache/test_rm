import type { ScheduleResource, Booking } from '../../types';
import { getBookingSpan, isWeekend, isToday } from '../../lib/dates';
import { BookingBlock } from './BookingBlock';

interface ResourceRowProps {
  resource: ScheduleResource;
  days: Date[];
  dayWidth: number;
  onCellClick: (resourceId: number, date: Date) => void;
  onBookingClick: (booking: Booking) => void;
}

export function ResourceRow({ resource, days, dayWidth, onCellClick, onBookingClick }: ResourceRowProps) {
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];

  return (
    <div className="flex border-b border-gray-100 hover:bg-gray-50/50 group">
      {/* Resource info (frozen column) */}
      <div className="w-52 min-w-52 px-4 py-2 border-r border-gray-200 bg-white flex items-center gap-3 sticky left-0 z-10 group-hover:bg-gray-50">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: resource.color }}
        >
          {resource.first_name[0]}{resource.last_name[0]}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {resource.first_name} {resource.last_name}
          </div>
          <div className="text-[11px] text-gray-500 truncate">{resource.role}</div>
        </div>
      </div>

      {/* Day cells + bookings */}
      <div className="flex-1 relative" style={{ height: '44px' }}>
        {/* Day grid background */}
        <div className="flex absolute inset-0">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`flex-shrink-0 border-r border-gray-50 cursor-pointer hover:bg-primary-50/50
                ${isWeekend(day) ? 'bg-gray-50/80' : ''}
                ${isToday(day) ? 'bg-primary-50/30' : ''}`}
              style={{ width: `${dayWidth}px` }}
              onClick={() => onCellClick(resource.id, day)}
            />
          ))}
        </div>

        {/* Booking blocks */}
        {resource.bookings.map((booking) => {
          const result = getBookingSpan(booking.start_date, booking.end_date, rangeStart, rangeEnd);
          if (!result) return null;
          return (
            <BookingBlock
              key={booking.id}
              booking={booking}
              startCol={result.startCol}
              span={result.span}
              dayWidth={dayWidth}
              onClick={onBookingClick}
            />
          );
        })}
      </div>
    </div>
  );
}
