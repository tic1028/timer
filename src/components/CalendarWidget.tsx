import React, { useState, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Lunar } from 'lunar-javascript';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarWidgetProps {
  onClose: () => void;
  holidays: Holiday[];
}

interface Holiday {
  name: string;
  month: number;
  day: number;
  isFixed: boolean;
  getDate: (year: number) => Date;
  type?: 'US' | 'Chinese' | 'Custom';
  isLunar?: boolean;
}

const US_HOLIDAYS: Holiday[] = [
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
    name: "Inauguration Day",
    month: 1,
    day: 20,
    isFixed: false,
    getDate: (year) => {
      // Only show on years following presidential elections (2021, 2025, etc.)
      if ((year - 1) % 4 === 0) {
        return new Date(year, 0, 20);
      }
      return new Date(0); // Return invalid date for non-election years
    }
  },
  {
    name: "Presidents' Day",
    month: 2,
    day: 15,
    isFixed: false,
    getDate: (year) => {
      const date = new Date(year, 1, 1);
      date.setDate(1 + (15 - date.getDay() + 7) % 7 + 14);
      return date;
    }
  },
  {
    name: "Easter Sunday",
    month: 3,
    day: 31,
    isFixed: false,
    getDate: (year) => {
      // Simplified Easter calculation (not 100% accurate but close enough for display)
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(year, month - 1, day);
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
    name: "Juneteenth",
    month: 6,
    day: 19,
    isFixed: true,
    getDate: (year) => new Date(year, 5, 19)
  },
  {
    name: "Independence Day",
    month: 7,
    day: 4,
    isFixed: true,
    getDate: (year) => new Date(year, 6, 4)
  },
  {
    name: "Labor Day",
    month: 9,
    day: 1,
    isFixed: false,
    getDate: (year) => {
      const date = new Date(year, 8, 1);
      while (date.getDay() !== 1) {
        date.setDate(date.getDate() + 1);
      }
      return date;
    }
  },
  {
    name: "Columbus Day",
    month: 10,
    day: 8,
    isFixed: false,
    getDate: (year) => {
      const date = new Date(year, 9, 1);
      date.setDate(1 + (8 - date.getDay() + 7) % 7 + 7);
      return date;
    }
  },
  {
    name: "Veterans Day",
    month: 11,
    day: 11,
    isFixed: true,
    getDate: (year) => new Date(year, 10, 11)
  },
  {
    name: "Thanksgiving Day",
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
  },
  {
    name: "Halloween",
    month: 10,
    day: 31,
    isFixed: true,
    getDate: (year) => new Date(year, 9, 31)
  }
];

const CHINESE_HOLIDAYS: Holiday[] = [
  {
    name: "春节",
    type: 'Chinese',
    isLunar: true,
    month: 1, // Lunar month, not solar
    day: 1,   // Lunar day, not solar
    isFixed: true, // Fixed lunar date
    getDate: (year) => {
      try {
        // @ts-ignore
        const lunar = Lunar.fromYmd(year, 1, 1, true); // True for lunar month 1, day 1
        // @ts-ignore
        const solar = lunar.getSolar();
        const solarDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
        return solarDate;
      } catch (error) {
        console.error('Error converting lunar date for Spring Festival:', error);
        return new Date(9999, 0, 1); // Return a far future date on error
      }
    }
  },
  {
    name: "清明节",
    type: 'Chinese',
    isLunar: false,
    month: 4,
    day: 5,
    isFixed: true,
    getDate: (year) => new Date(year, 3, 5)
  },
  {
    name: "国际劳动妇女节",
    type: 'Chinese',
    isLunar: false,
    month: 3,
    day: 8,
    isFixed: true,
    getDate: (year) => new Date(year, 2, 8)
  },
  {
    name: "植树节",
    type: 'Chinese',
    isLunar: false,
    month: 3,
    day: 12,
    isFixed: true,
    getDate: (year) => new Date(year, 2, 12)
  },
  {
    name: "国际劳动节",
    type: 'Chinese',
    isLunar: false,
    month: 5,
    day: 1,
    isFixed: true,
    getDate: (year) => new Date(year, 4, 1)
  },
  {
    name: "中国青年节",
    type: 'Chinese',
    isLunar: false,
    month: 5,
    day: 4,
    isFixed: true,
    getDate: (year) => new Date(year, 4, 4)
  },
  {
    name: "端午节",
    type: 'Chinese',
    isLunar: true,
    month: 5, // Lunar month
    day: 5,   // Lunar day
    isFixed: true,
    getDate: (year) => {
      try {
        // @ts-ignore
        const lunar = Lunar.fromYmd(year, 5, 5, true); 
        // @ts-ignore
        const solar = lunar.getSolar();
        const solarDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
        return solarDate;
      } catch (error) {
        console.error('Error converting lunar date for Dragon Boat Festival:', error);
        return new Date(9999, 0, 1);
      }
    }
  },
  {
    name: "儿童节",
    type: 'Chinese',
    isLunar: false,
    month: 6,
    day: 1,
    isFixed: true,
    getDate: (year) => new Date(year, 5, 1)
  },
  {
    name: "教师节",
    type: 'Chinese',
    isLunar: false,
    month: 9,
    day: 10,
    isFixed: true,
    getDate: (year) => new Date(year, 8, 10)
  },
  {
    name: "中秋节",
    type: 'Chinese',
    isLunar: true,
    month: 8, // Lunar month
    day: 15,  // Lunar day
    isFixed: true,
    getDate: (year) => {
      try {
        // @ts-ignore
        const lunar = Lunar.fromYmd(year, 8, 15, true);
        // @ts-ignore
        const solar = lunar.getSolar();
        const solarDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
        return solarDate;
      } catch (error) {
        console.error('Error converting lunar date for Mid-Autumn Festival:', error);
        return new Date(9999, 0, 1);
      }
    }
  },
  {
    name: "国庆节",
    type: 'Chinese',
    isLunar: false,
    month: 10,
    day: 1,
    isFixed: true,
    getDate: (year) => new Date(year, 9, 1)
  }
];

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onClose, holidays }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const nextMonth = () => {
    setSelectedDate(null); // Close popover when changing month
    setCurrentDate(addMonths(currentDate, 1));
  };
  const prevMonth = () => {
    setSelectedDate(null); // Close popover when changing month
    setCurrentDate(subMonths(currentDate, 1));
  };
  const nextYear = () => {
    setSelectedDate(null); // Close popover when changing year
    setCurrentDate(addMonths(currentDate, 12));
  };
  const prevYear = () => {
    setSelectedDate(null); // Close popover when changing year
    setCurrentDate(subMonths(currentDate, 12));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHolidaysForDate = (date: Date) => {
    const allHolidays: Holiday[] = [
      ...US_HOLIDAYS.map(h => ({ ...h, type: 'US' as const })),
      ...CHINESE_HOLIDAYS.map(h => ({ ...h, type: 'Chinese' as const })),
      ...holidays.map(h => ({ ...h, type: 'Custom' as const }))
    ];

    const uniqueHolidays: Holiday[] = [];
    const seenHolidayNames = new Set<string>();

    allHolidays.forEach(holiday => {
      const holidayDate = holiday.getDate(date.getFullYear());
      if (
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getDate() === date.getDate()
      ) {
        // Only add if not already seen for this date (by name)
        if (!seenHolidayNames.has(holiday.name)) {
          uniqueHolidays.push(holiday);
          seenHolidayNames.add(holiday.name);
        }
      }
    });
    return uniqueHolidays;
  };

  const handleDateClick = (day: Date) => {
    if (selectedDate?.getTime() === day.getTime()) {
      setSelectedDate(null);
      setPopoverPosition(null);
    } else {
      setSelectedDate(day);
      // Calculate position for the popover
      const dayElement = dayRefs.current[day.toDateString()];
      if (dayElement) {
        const rect = dayElement.getBoundingClientRect();
        const calendarRect = dayElement.closest('.bg-white.rounded-lg')?.getBoundingClientRect();
        if (calendarRect) {
          let left = rect.left - calendarRect.left;
          const calendarWidth = calendarRect.width;
          const popoverWidth = 200; // Approximate popover width

          // Adjust position if it's near the right edge
          if (left + popoverWidth > calendarWidth - 20) { // 20px buffer from right edge
            left = left - popoverWidth + rect.width; // Shift left by popover width
          }
          setPopoverPosition({ top: rect.bottom - calendarRect.top + 10, left: left });
        }
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 w-[800px] shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevYear();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Previous Year"
            >
              <div className="flex">
                <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                <ChevronLeftIcon className="h-6 w-6 text-gray-600 -ml-3" />
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevMonth();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Previous Month"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextMonth();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Next Month"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextYear();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Next Year"
            >
              <div className="flex">
                <ChevronRightIcon className="h-6 w-6 text-gray-600" />
                <ChevronRightIcon className="h-6 w-6 text-gray-600 -ml-3" />
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day.toString()} className="text-center text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const holidays = getHolidaysForDate(day);
            const isCurrentDaySelected = selectedDate?.getTime() === day.getTime();
            
            return (
              <div
                key={day.toString()}
                ref={el => { dayRefs.current[day.toDateString()] = el; }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateClick(day);
                }}
                className={`
                  p-2 min-h-[100px] border border-gray-200 rounded-lg cursor-pointer
                  ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
                  ${!isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : ''}
                  hover:border-gray-300 transition-all duration-200
                `}
              >
                <div className="text-lg font-medium mb-1">{format(day, 'd')}</div>
                <div className="flex flex-col gap-1">
                  {holidays.map(holiday => {
                    const displayName = holiday.name;
                    return (
                      <div 
                        key={`${holiday.name}-${holiday.type}`}
                        className={`
                          text-xs px-1.5 py-0.5 rounded-full truncate
                          ${holiday.type === 'US' ? 'text-red-600 bg-red-50' : holiday.type === 'Chinese' ? 'text-green-600 bg-green-50' : 'text-purple-600 bg-purple-50'}
                        `}
                        title={holiday.name}
                      >
                        {displayName}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDate && popoverPosition && (
          <div
            className="absolute bg-white p-4 rounded-lg shadow-lg z-50 w-[200px]"
            style={{ top: popoverPosition.top, left: popoverPosition.left }}
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside popover
          >
            <div className="text-lg font-bold mb-2">{format(selectedDate, 'MMMM d, yyyy')}</div>
            <div className="text-sm text-gray-600 mb-2">
              {(() => {
                // @ts-ignore
                const lunar = Lunar.fromDate(selectedDate);
                // @ts-ignore
                const lunarYear = lunar.getYearInGanZhi();
                const lunarMonth = lunar.getMonthInChinese();
                const lunarDay = lunar.getDayInChinese();
                return `${lunarYear}年 ${lunarMonth}${lunarDay}`;
              })()}
            </div>
            <div className="flex flex-col gap-1">
              {getHolidaysForDate(selectedDate).map(holiday => (
                <div 
                  key={`${holiday.name}-${holiday.type}`}
                  className={`
                    text-xs px-1.5 py-0.5 rounded-full truncate
                    ${holiday.type === 'US' ? 'text-red-600 bg-red-50' : holiday.type === 'Chinese' ? 'text-green-600 bg-green-50' : 'text-purple-600 bg-purple-50'}
                  `}
                  title={holiday.name}
                >
                  {holiday.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarWidget; 