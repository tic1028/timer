import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Lunar } from 'lunar-javascript';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarWidgetProps {
  onClose: () => void;
}

interface Holiday {
  name: string;
  month: number;
  day: number;
  isFixed: boolean;
  getDate: (year: number) => Date;
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

const CHINESE_HOLIDAYS = [
  {
    name: "春节",
    type: 'Chinese',
    isLunar: true,
    lunarMonth: "正",
    lunarDay: "初一"
  },
  {
    name: "清明节",
    type: 'Chinese',
    isLunar: false,
    month: 4,
    day: 5
  },
  {
    name: "国际劳动妇女节",
    type: 'Chinese',
    isLunar: false,
    month: 3,
    day: 8
  },
  {
    name: "植树节",
    type: 'Chinese',
    isLunar: false,
    month: 3,
    day: 12
  },
  {
    name: "国际劳动节",
    type: 'Chinese',
    isLunar: false,
    month: 5,
    day: 1
  },
  {
    name: "中国青年节",
    type: 'Chinese',
    isLunar: false,
    month: 5,
    day: 4
  },
  {
    name: "端午节",
    type: 'Chinese',
    isLunar: true,
    lunarMonth: "五",
    lunarDay: "初五"
  },
  {
    name: "儿童节",
    type: 'Chinese',
    isLunar: false,
    month: 6,
    day: 1
  },
  {
    name: "教师节",
    type: 'Chinese',
    isLunar: false,
    month: 9,
    day: 10
  },
  {
    name: "中秋节",
    type: 'Chinese',
    isLunar: true,
    lunarMonth: "八",
    lunarDay: "十五"
  },
  {
    name: "国庆节",
    type: 'Chinese',
    isLunar: false,
    month: 10,
    day: 1
  }
];

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextYear = () => setCurrentDate(addMonths(currentDate, 12));
  const prevYear = () => setCurrentDate(subMonths(currentDate, 12));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHolidaysForDate = (date: Date) => {
    const holidays = [];
    
    // Check US holidays
    const usHoliday = US_HOLIDAYS.find(h => {
      const holidayDate = h.getDate(date.getFullYear());
      return holidayDate.getDate() === date.getDate() && 
             holidayDate.getMonth() === date.getMonth();
    });
    if (usHoliday) {
      holidays.push({ name: usHoliday.name, type: 'US' });
    }

    // Check Chinese holidays
    const lunar = Lunar.fromDate(date);
    const lunarMonth = lunar.getMonthInChinese();
    const lunarDay = lunar.getDayInChinese();
    
    // Check lunar-based holidays
    CHINESE_HOLIDAYS.forEach(holiday => {
      if (holiday.isLunar) {
        if (lunarMonth === holiday.lunarMonth && lunarDay === holiday.lunarDay) {
          holidays.push({ name: holiday.name, type: 'Chinese' });
        }
      } else {
        // Check solar-based holidays
        if (date.getMonth() + 1 === holiday.month && date.getDate() === holiday.day) {
          holidays.push({ name: holiday.name, type: 'Chinese' });
        }
      }
    });

    return holidays;
  };

  const handleDateClick = (date: Date) => {
    setExpandedDate(expandedDate?.getTime() === date.getTime() ? null : date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={prevYear}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Previous Year"
            >
              <div className="flex">
                <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                <ChevronLeftIcon className="h-6 w-6 text-gray-600 -ml-3" />
              </div>
            </button>
            <button
              onClick={prevMonth}
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
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Next Month"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={nextYear}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Next Year"
            >
              <div className="flex">
                <ChevronRightIcon className="h-6 w-6 text-gray-600" />
                <ChevronRightIcon className="h-6 w-6 text-gray-600 -ml-3" />
              </div>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const holidays = getHolidaysForDate(day);
            const isExpanded = expandedDate?.getTime() === day.getTime();
            
            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`
                  p-2 min-h-[100px] border border-gray-200 rounded-lg cursor-pointer
                  ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
                  ${!isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : ''}
                  hover:border-gray-300 transition-all duration-200
                  ${isExpanded ? 'col-span-2 row-span-2 z-10 bg-white shadow-lg' : ''}
                `}
              >
                <div className="text-lg font-medium mb-1">{format(day, 'd')}</div>
                <div className="flex flex-col gap-1">
                  {holidays.map(holiday => {
                    const displayName = holiday.name;
                    return (
                      <div 
                        key={holiday.name} 
                        className={`
                          text-xs px-1.5 py-0.5 rounded-full truncate
                          ${holiday.type === 'US' ? 'text-red-600 bg-red-50' : 'text-purple-600 bg-purple-50'}
                        `}
                        title={holiday.name}
                      >
                        {isExpanded ? holiday.name : displayName}
                      </div>
                    );
                  })}
                </div>
                {isExpanded && (
                  <div className="text-xs text-gray-500 mb-1">
                    {(() => {
                      const lunarDate = Lunar.fromDate(day);
                      // @ts-ignore
                      const fullString = (lunarDate as any).toFullString();
                      const yearMatch = fullString.match(/([\u4E00-\u9FFF]{2}\([\u4E00-\u9FFF]+\)年)/);
                      const chineseYear = yearMatch ? yearMatch[1] : '';
                      return `农历 ${chineseYear} ${lunarDate.getMonthInChinese()}月${lunarDate.getDayInChinese()}`;
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget; 