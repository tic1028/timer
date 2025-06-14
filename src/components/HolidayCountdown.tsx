import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import CalendarWidget from './CalendarWidget';

interface Holiday {
  name: string;
  month: number;
  day: number;
  isFixed: boolean;
  getDate: (year: number) => Date;
}

const HOLIDAYS: Holiday[] = [
  {
    name: "New Year's Day",
    month: 1,
    day: 1,
    isFixed: true,
    getDate: (year) => new Date(year, 0, 1)
  },
  {
    name: "Martin Luther King Jr. Day",
    month: 1,
    day: 15,
    isFixed: false,
    getDate: (year) => {
      const date = new Date(year, 0, 1);
      date.setDate(1 + (15 - date.getDay() + 7) % 7 + 14);
      return date;
    }
  },
  {
    name: "Memorial Day",
    month: 5,
    day: 31,
    isFixed: false,
    getDate: (year) => {
      const date = new Date(year, 4, 31);
      while (date.getDay() !== 1) {
        date.setDate(date.getDate() - 1);
      }
      return date;
    }
  },
  {
    name: "Independence Day",
    month: 7,
    day: 4,
    isFixed: true,
    getDate: (year) => new Date(year, 6, 4)
  },
  {
    name: "Thanksgiving",
    month: 11,
    day: 24,
    isFixed: false,
    getDate: (year) => {
      const date = new Date(year, 10, 1);
      date.setDate(1 + (4 - date.getDay() + 7) % 7 + 21);
      return date;
    }
  },
  {
    name: "Christmas Day",
    month: 12,
    day: 25,
    isFixed: true,
    getDate: (year) => new Date(year, 11, 25)
  }
];

const HolidayCountdown: React.FC = () => {
  const [nextHoliday, setNextHoliday] = useState<{ holiday: Holiday; date: Date } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCalendar) {
        setShowCalendar(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCalendar]);

  useEffect(() => {
    const calculateNextHoliday = () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const nextYear = currentYear + 1;

      let nextHolidayInfo: { holiday: Holiday; date: Date } | null = null;
      let minDays = Infinity;

      // Check holidays in current year
      HOLIDAYS.forEach(holiday => {
        const holidayDate = holiday.getDate(currentYear);
        const daysUntilHoliday = differenceInDays(holidayDate, today);

        if (daysUntilHoliday >= 0 && daysUntilHoliday < minDays) {
          minDays = daysUntilHoliday;
          nextHolidayInfo = { holiday, date: holidayDate };
        }
      });

      // Check holidays in next year
      HOLIDAYS.forEach(holiday => {
        const holidayDate = holiday.getDate(nextYear);
        const daysUntilHoliday = differenceInDays(holidayDate, today);

        if (daysUntilHoliday >= 0 && daysUntilHoliday < minDays) {
          minDays = daysUntilHoliday;
          nextHolidayInfo = { holiday, date: holidayDate };
        }
      });

      setNextHoliday(nextHolidayInfo);
    };

    calculateNextHoliday();
    const interval = setInterval(calculateNextHoliday, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, []);

  if (!nextHoliday) return null;

  const daysUntilHoliday = differenceInDays(nextHoliday.date, new Date());

  return (
    <>
      <div 
        className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors text-center"
        onClick={() => setShowCalendar(true)}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Next Holiday</h2>
        <div className="text-gray-600 space-y-4">
          <div className="text-2xl font-medium text-gray-800">{nextHoliday.holiday.name}</div>
          <div className="text-xl text-gray-600">{format(nextHoliday.date, 'MMMM d, yyyy')}</div>
          <div className="text-2xl font-semibold text-blue-600 mt-4">
            {daysUntilHoliday === 0
              ? "Today! 🎉"
              : `${daysUntilHoliday} ${daysUntilHoliday === 1 ? 'day' : 'days'} until ${nextHoliday.holiday.name.split(' ')[0]}`}
          </div>
        </div>
      </div>

      {showCalendar && (
        <CalendarWidget onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
};

export default HolidayCountdown; 