import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { TimelineHeader } from './TimelineHeader';
import { ResourceRow } from './ResourceRow';
import { BookingModal } from './BookingModal';
import { useScheduleData } from '../../hooks/useScheduleData';
import { getFourWeekRange, getDaysInRange, formatDate, navigateRange, startOfWeek } from '../../lib/dates';
import type { Booking } from '../../types';

export function ScheduleTimeline() {
  const [range, setRange] = useState(() => getFourWeekRange(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [defaultResourceId, setDefaultResourceId] = useState<number | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const startStr = formatDate(range.start);
  const endStr = formatDate(range.end);
  const { data: schedule, isLoading } = useScheduleData(startStr, endStr);

  const days = useMemo(() => getDaysInRange(range.start, range.end), [range]);
  const dayWidth = 40;

  const handlePrev = () => setRange(navigateRange(range.start, 'prev', 'week'));
  const handleNext = () => setRange(navigateRange(range.start, 'next', 'week'));
  const handleToday = () => setRange(getFourWeekRange(new Date()));

  const handleCellClick = useCallback((resourceId: number, date: Date) => {
    setSelectedBooking(null);
    setDefaultResourceId(resourceId);
    setDefaultDate(formatDate(date));
    setModalOpen(true);
  }, []);

  const handleBookingClick = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setDefaultResourceId(undefined);
    setDefaultDate(undefined);
    setModalOpen(true);
  }, []);

  const handleNewBooking = () => {
    setSelectedBooking(null);
    setDefaultResourceId(undefined);
    setDefaultDate(formatDate(startOfWeek(new Date(), { weekStartsOn: 1 })));
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <Button variant="secondary" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {formatDate(range.start, 'MMM d')} — {formatDate(range.end, 'MMM d, yyyy')}
          </span>
        </div>
        <Button onClick={handleNewBooking} size="sm">
          <Plus size={16} />
          New Booking
        </Button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Loading schedule...
          </div>
        ) : (
          <div className="min-w-fit">
            <TimelineHeader days={days} />
            {schedule && schedule.length > 0 ? (
              schedule.map((resource) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  days={days}
                  dayWidth={dayWidth}
                  onCellClick={handleCellClick}
                  onBookingClick={handleBookingClick}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No resources found. Add resources to get started.
              </div>
            )}
          </div>
        )}
      </div>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        booking={selectedBooking}
        defaultResourceId={defaultResourceId}
        defaultDate={defaultDate}
      />
    </div>
  );
}
