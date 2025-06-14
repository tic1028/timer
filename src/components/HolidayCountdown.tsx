import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import CalendarWidget from './CalendarWidget';
import { Lunar } from 'lunar-javascript';
import HolidaySettingsModal from './HolidaySettingsModal'; // Import the new settings modal
import { Cog6ToothIcon } from '@heroicons/react/24/outline'; // Import the settings icon

interface Holiday {
  name: string;
  month: number;
  day: number;
  isFixed: boolean;
  getDate: (year: number) => Date;
  isLunar?: boolean;
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customHolidays, setCustomHolidays] = useState<Holiday[]>(() => {
    const storedHolidays = localStorage.getItem('customHolidays');
    if (!storedHolidays) return [];
    
    // Parse the stored holidays and restore the getDate function
    return JSON.parse(storedHolidays).map((holiday: any) => ({
      ...holiday,
      getDate: (year: number) => {
        if (holiday.isLunar) {
          try {
            // @ts-ignore
            const lunar = Lunar.fromYmd(year, holiday.month, holiday.day);
            // @ts-ignore
            const solar = lunar.getSolar();
            const solarDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
            const pacificDate = toZonedTime(solarDate, 'America/Los_Angeles');
            pacificDate.setHours(0, 0, 0, 0);
            return pacificDate;
          } catch (error) {
            console.error('Error converting lunar date:', error);
            return new Date(9999, 0, 1);
          }
        } else {
          const date = new Date(year, holiday.month - 1, holiday.day);
          const pacificDate = toZonedTime(date, 'America/Los_Angeles');
          pacificDate.setHours(0, 0, 0, 0);
          return pacificDate;
        }
      }
    }));
  });

  const [disabledDefaultHolidays, setDisabledDefaultHolidays] = useState<string[]>(() => {
    const storedDisabled = localStorage.getItem('disabledDefaultHolidays');
    return storedDisabled ? JSON.parse(storedDisabled) : [];
  });

  const [ignoreNextClick, setIgnoreNextClick] = useState(false); // New state to handle ghost clicks

  useEffect(() => {
    localStorage.setItem('disabledDefaultHolidays', JSON.stringify(disabledDefaultHolidays));
  }, [disabledDefaultHolidays]);

  useEffect(() => {
    // When saving, remove the getDate function as it cannot be serialized
    const serializableCustomHolidays = customHolidays.map(holiday => {
      const { getDate, ...rest } = holiday;
      return rest;
    });
    localStorage.setItem('customHolidays', JSON.stringify(serializableCustomHolidays));
  }, [customHolidays]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCalendar) setShowCalendar(false);
        if (showSettingsModal) handleCloseSettingsModal(); // Use the new handler here too
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCalendar, showSettingsModal]);

  useEffect(() => {
    const calculateNextHoliday = () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const nextYear = currentYear + 1;

      let nextHolidayInfo: { holiday: Holiday; date: Date } | null = null;
      let minDays = Infinity;

      // Filter out disabled default holidays
      const enabledDefaultHolidays = HOLIDAYS.filter(
        holiday => !disabledDefaultHolidays.includes(holiday.name)
      );

      // Check enabled default holidays in current year
      enabledDefaultHolidays.forEach(holiday => {
        const holidayDate = holiday.getDate(currentYear);
        const daysUntilHoliday = differenceInDays(holidayDate, today);

        if (daysUntilHoliday >= 0 && daysUntilHoliday < minDays) {
          minDays = daysUntilHoliday;
          nextHolidayInfo = { holiday, date: holidayDate };
        }
      });

      // Check enabled default holidays in next year
      enabledDefaultHolidays.forEach(holiday => {
        const holidayDate = holiday.getDate(nextYear);
        const daysUntilHoliday = differenceInDays(holidayDate, today);

        if (daysUntilHoliday >= 0 && daysUntilHoliday < minDays) {
          minDays = daysUntilHoliday;
          nextHolidayInfo = { holiday, date: holidayDate };
        }
      });

      // Check custom holidays
      customHolidays.forEach(holiday => {
        const holidayDate = holiday.getDate(currentYear);
        console.log(`Custom Holiday (Current Year): ${holiday.name}, Date: ${holidayDate}, Lunar: ${holiday.isLunar}, Days Until: ${differenceInDays(holidayDate, today)}`);
        const daysUntilHoliday = differenceInDays(holidayDate, today);

        if (daysUntilHoliday >= 0 && daysUntilHoliday < minDays) {
          minDays = daysUntilHoliday;
          nextHolidayInfo = { holiday, date: holidayDate };
        }
      });

      customHolidays.forEach(holiday => {
        const holidayDate = holiday.getDate(nextYear);
        console.log(`Custom Holiday (Next Year): ${holiday.name}, Date: ${holidayDate}, Lunar: ${holiday.isLunar}, Days Until: ${differenceInDays(holidayDate, today)}`);
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
  }, [customHolidays, disabledDefaultHolidays]); // Add disabledDefaultHolidays to the dependency array

  const handleAddHoliday = (holiday: Holiday) => {
    setCustomHolidays([...customHolidays, holiday]);
  };

  const handleDeleteHoliday = (holidayName: string) => {
    setCustomHolidays(customHolidays.filter(h => h.name !== holidayName));
  };

  const handleEditHoliday = (updatedHoliday: Holiday) => {
    setCustomHolidays(customHolidays.map(holiday => 
      holiday.name === updatedHoliday.name ? updatedHoliday : holiday
    ));
  };

  const handleToggleDefaultHoliday = (holidayName: string, enable: boolean) => {
    if (enable) {
      setDisabledDefaultHolidays(disabledDefaultHolidays.filter(name => name !== holidayName));
    } else {
      setDisabledDefaultHolidays([...disabledDefaultHolidays, holidayName]);
    }
  };

  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
    setIgnoreNextClick(true); // Set flag to ignore next click
    setTimeout(() => {
      setIgnoreNextClick(false);
    }, 100); // 100ms delay, should be enough to bypass ghost clicks
  };

  if (!nextHoliday) return null;

  return (
    <div 
      className="flex flex-col cursor-pointer hover:bg-gray-50 transition-colors p-6 rounded-lg text-center"
      onClick={() => {
        if (ignoreNextClick) {
          setIgnoreNextClick(false); // Reset immediately if it was triggered
          return; // Do nothing
        }
        if (!showSettingsModal) {
          setShowCalendar(true);
        }
      }}
    >
      <div className="flex justify-between w-full items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Next Holiday</h2>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent calendar from opening when clicking settings
            setShowSettingsModal(true);
          }}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>

      {nextHoliday ? (
        <div className="w-full">
          <div className="text-gray-600 space-y-6">
            <h3 className="text-3xl font-semibold text-gray-800 tracking-tight">{nextHoliday.holiday.name}</h3>
            <p className="text-xl text-gray-500">{format(nextHoliday.date, 'MMMM d, yyyy')}</p>
            <p className="text-2xl font-medium text-red-500 mt-6 tracking-tight">
              {(() => {
                const now = new Date();
                const today = toZonedTime(now, 'America/Los_Angeles');
                today.setHours(0, 0, 0, 0);
                const holidayDate = toZonedTime(nextHoliday.date, 'America/Los_Angeles');
                holidayDate.setHours(0, 0, 0, 0);
                const daysUntilHoliday = Math.floor((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilHoliday === 0
                  ? "Today! 🎉"
                  : `${daysUntilHoliday} ${daysUntilHoliday === 1 ? 'day' : 'days'} until ${nextHoliday.holiday.name.split(' ')[0]}`;
              })()}
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-1">No upcoming holidays</p>
      )}

      {/* Modals remain fixed/overlay */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <CalendarWidget
              onClose={() => setShowCalendar(false)}
              holidays={[...HOLIDAYS, ...customHolidays]}
            />
          </div>
        </div>
      )}

      {showSettingsModal && (
        <HolidaySettingsModal
          customHolidays={customHolidays}
          onAddHoliday={handleAddHoliday}
          onDeleteHoliday={handleDeleteHoliday}
          onClose={handleCloseSettingsModal} // Use the new handler
          defaultHolidays={HOLIDAYS}
          disabledDefaultHolidays={disabledDefaultHolidays}
          onToggleDefaultHoliday={handleToggleDefaultHoliday}
          onEditHoliday={handleEditHoliday} // Pass the new handler
        />
      )}
    </div>
  );
};

export default HolidayCountdown;
