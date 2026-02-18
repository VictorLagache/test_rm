import type { Booking } from '../../types';

interface BookingBlockProps {
  booking: Booking;
  startCol: number;
  span: number;
  dayWidth: number;
  onClick: (booking: Booking) => void;
}

const leaveColors: Record<string, string> = {
  vacation: '#94a3b8',
  sick: '#f87171',
  personal: '#a78bfa',
  other: '#6b7280',
};

export function BookingBlock({ booking, startCol, span, dayWidth, onClick }: BookingBlockProps) {
  const isLeave = booking.booking_type === 'leave';
  const bgColor = isLeave
    ? leaveColors[booking.leave_type || 'other']
    : booking.project_color || '#3b82f6';

  const label = isLeave
    ? (booking.leave_type ? booking.leave_type.charAt(0).toUpperCase() + booking.leave_type.slice(1) : 'Leave')
    : booking.project_name || 'Project';

  const width = span * dayWidth - 4;
  const left = startCol * dayWidth + 2;

  return (
    <div
      className={`absolute top-1 rounded-md cursor-pointer transition-shadow hover:shadow-md
        flex items-center px-2 overflow-hidden select-none
        ${isLeave ? 'leave-pattern' : ''}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: '32px',
        backgroundColor: bgColor,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(booking);
      }}
      title={`${label}${booking.notes ? ` — ${booking.notes}` : ''}\n${booking.hours_per_day}h/day`}
    >
      <span className="text-xs font-medium text-white truncate">
        {label}
      </span>
      {width > 80 && (
        <span className="text-[10px] text-white/80 ml-1 whitespace-nowrap">
          {booking.hours_per_day}h
        </span>
      )}
    </div>
  );
}
