import React, { useState, useEffect } from 'react';
import { format, getDay, differenceInDays, isFuture, isBefore } from 'date-fns';
import { Lunar } from 'lunar-javascript';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface SpecialDate {
  name: string;
  month: number; // 1-indexed
  day: number;   // 1-indexed
  type: 'birthday' | 'anniversary';
}

interface ClockProps {
  onOpenSpecialDatesManager: () => void;
}

const SPECIAL_DATES_STORAGE_KEY = 'user-special-dates';

const Clock: React.FC<ClockProps> = ({ onOpenSpecialDatesManager }) => {
  const [time, setTime] = useState(new Date());
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>(() => {
    try {
      const savedDates = localStorage.getItem(SPECIAL_DATES_STORAGE_KEY);
      const parsedDates = savedDates ? JSON.parse(savedDates) : [];
      // Validate and filter parsed data to ensure it matches SpecialDate interface
      return parsedDates.filter((date: any) => 
        typeof date.name === 'string' &&
        typeof date.month === 'number' && date.month >= 1 && date.month <= 12 &&
        typeof date.day === 'number' && date.day >= 1 && date.day <= 31 &&
        (date.type === 'birthday' || date.type === 'anniversary')
      ) as SpecialDate[];
    } catch (error) {
      console.error("Failed to load special dates from local storage:", error);
      return [];
    }
  });
  const [nextSpecialDateInfo, setNextSpecialDateInfo] = useState<{ name: string; days: number; type: 'birthday' | 'anniversary' } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Save special dates to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SPECIAL_DATES_STORAGE_KEY, JSON.stringify(specialDates));
    } catch (error) {
      console.error("Failed to save special dates to local storage:", error);
    }
  }, [specialDates]);

  // Calculate next special date
  useEffect(() => {
    const calculateNextSpecialDate = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      let closestSpecialDate: { name: string; date: Date; type: 'birthday' | 'anniversary' } | null = null;
      let minDays = Infinity;

      for (const sDate of specialDates) {
        let sDateThisYear = new Date(today.getFullYear(), sDate.month - 1, sDate.day);
        let sDateNextYear = new Date(today.getFullYear() + 1, sDate.month - 1, sDate.day);

        // Consider this year's date if it's today or in the future
        if (!isFuture(sDateThisYear) && !isBefore(sDateThisYear, today)) {
            closestSpecialDate = { name: sDate.name, date: sDateThisYear, type: sDate.type };
            minDays = 0;
            break; 
        } else if (isFuture(sDateThisYear)) {
            const daysUntil = differenceInDays(sDateThisYear, today);
            if (daysUntil >= 0 && daysUntil < minDays) {
                minDays = daysUntil;
                closestSpecialDate = { name: sDate.name, date: sDateThisYear, type: sDate.type };
            }
        }

        // Always consider next year's date
        const daysUntilNextYear = differenceInDays(sDateNextYear, today);
        if (daysUntilNextYear >= 0 && daysUntilNextYear < minDays) {
            minDays = daysUntilNextYear;
            closestSpecialDate = { name: sDate.name, date: sDateNextYear, type: sDate.type };
        }
      }

      if (closestSpecialDate && minDays <= 7) { // Within one week
        setNextSpecialDateInfo({ name: closestSpecialDate.name, days: minDays, type: closestSpecialDate.type });
      } else {
        setNextSpecialDateInfo(null);
      }
    };

    calculateNextSpecialDate();
    const interval = setInterval(calculateNextSpecialDate, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, [specialDates, time]); // Recalculate if special dates or time changes

  const getWeekendMessage = () => {
    const dayOfWeek = getDay(time);
    const daysUntilWeekend = 5 - dayOfWeek;

    if (dayOfWeek === 5) {
      return "🎉 Weekend is here!";
    } else if (dayOfWeek === 6 || dayOfWeek === 0) {
      return "Enjoy your weekend! 🌟";
    } else if (daysUntilWeekend === 1) {
      return "Just one more day until the weekend! 🎯";
    } else if (daysUntilWeekend === 2) {
      return "Two more days until the weekend! 💪";
    } else if (daysUntilWeekend === 3) {
      return "Three days until the weekend! 🚀";
    } else if (daysUntilWeekend === 4) {
      return "Four days until the weekend! 🌈";
    }
    return `${daysUntilWeekend} days until the weekend! 🌟`;
  };

  const getLunarDate = () => {
    const lunar = Lunar.fromDate(time);
    return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  };

  // Temporary function to add a special date for testing (will be replaced by UI)
  const addSpecialDateForTesting = () => {
    // Example: Add a birthday for John Doe on July 20th
    setSpecialDates(prev => [...prev, { id: String(Date.now()), name: "John Doe", month: 7, day: 20, type: 'birthday' }]);
    // Example: Add an anniversary for our wedding on August 15th
    // setSpecialDates(prev => [...prev, { id: String(Date.now()), name: "Our Wedding", month: 8, day: 15, type: 'anniversary' }]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="absolute top-3 right-3">
        <button
          onClick={onOpenSpecialDatesManager}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="text-7xl font-bold text-gray-800 mb-6">
        {format(time, 'HH:mm:ss')}
      </div>
      <div className="text-2xl text-gray-600 mb-4">
        {format(time, 'EEEE, MMMM d, yyyy')}
      </div>
      <div className="text-xl text-gray-700 mb-6">
        农历 {getLunarDate()}
      </div>
      <div className="text-xl font-medium text-blue-600">
        {getWeekendMessage()}
      </div>
      {nextSpecialDateInfo && (
        <p className="text-xl mt-2 text-center text-red-500">
          {nextSpecialDateInfo.days === 0 
            ? `${nextSpecialDateInfo.name}'s ${nextSpecialDateInfo.type === 'birthday' ? 'Birthday' : 'Anniversary'} is Today! 🎉`
            : `${nextSpecialDateInfo.name}'s ${nextSpecialDateInfo.type === 'birthday' ? 'Birthday' : 'Anniversary'} is in ${nextSpecialDateInfo.days} ${nextSpecialDateInfo.days === 1 ? 'day' : 'days'}!`}
        </p>
      )}
      {/* Temporary button to add example special dates for testing */}
      {/* <button onClick={addSpecialDateForTesting} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Add Example Special Date</button> */}
    </div>
  );
};

export default Clock; 