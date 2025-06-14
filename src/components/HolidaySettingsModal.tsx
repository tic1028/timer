import React, { useState } from 'react';
import { format } from 'date-fns';
import { Lunar } from 'lunar-javascript';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

interface Holiday {
  name: string;
  month: number;
  day: number;
  isFixed: boolean;
  getDate: (year: number) => Date;
  isCustom?: boolean;
  isLunar?: boolean;
}

interface HolidaySettingsModalProps {
  customHolidays: Holiday[];
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (holidayName: string) => void;
  onClose: () => void;
  defaultHolidays: Holiday[];
  disabledDefaultHolidays: string[];
  onToggleDefaultHoliday: (holidayName: string, enable: boolean) => void;
  onEditHoliday: (holiday: Holiday) => void;
}

const HolidaySettingsModal: React.FC<HolidaySettingsModalProps> = ({
  customHolidays,
  onAddHoliday,
  onDeleteHoliday,
  onClose,
  defaultHolidays,
  disabledDefaultHolidays,
  onToggleDefaultHoliday,
  onEditHoliday,
}: HolidaySettingsModalProps) => {
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    month: 1,
    day: 1,
    isFixed: true,
    isLunar: false,
  });
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  // Add a function to check if a lunar date is valid
  const isValidLunarDate = (year: number, month: number, day: number) => {
    try {
      // @ts-ignore
      const lunar = Lunar.fromYmd(year, month, day);
      // @ts-ignore
      const solar = lunar.getSolar();
      return solar.getYear() > 0 && solar.getYear() < 9999;
    } catch (error) {
      return false;
    }
  };

  // Add a function to get the next valid lunar date
  const getNextValidLunarDate = (year: number, month: number, day: number) => {
    // Try the original date
    if (isValidLunarDate(year, month, day)) {
      return { year, month, day };
    }
    // Try the previous day
    if (isValidLunarDate(year, month, day - 1)) {
      return { year, month, day: day - 1 };
    }
    // Try the next day
    if (isValidLunarDate(year, month, day + 1)) {
      return { year, month, day: day + 1 };
    }
    // If all else fails, return the original date
    return { year, month, day };
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate lunar date
    if (newHoliday.isLunar) {
      if (newHoliday.day < 1 || newHoliday.day > 30) {
        alert('Lunar day must be between 1 and 30');
        return;
      }
    }

    const holidayToSave: Holiday = {
      ...newHoliday,
      isCustom: true,
      getDate: (year) => {
        if (newHoliday.isLunar) {
          try {
            const validDate = getNextValidLunarDate(year, newHoliday.month, newHoliday.day);
            // @ts-ignore
            const lunar = Lunar.fromYmd(validDate.year, validDate.month, validDate.day);
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
          const date = new Date(year, newHoliday.month - 1, newHoliday.day);
          const pacificDate = toZonedTime(date, 'America/Los_Angeles');
          pacificDate.setHours(0, 0, 0, 0);
          return pacificDate;
        }
      },
    };

    if (editingHoliday) {
      // Editing existing holiday
      onEditHoliday({ ...holidayToSave, name: editingHoliday.name });
      setEditingHoliday(null);
    } else {
      // Adding new holiday
      onAddHoliday(holidayToSave);
    }
    setNewHoliday({ name: '', month: 1, day: 1, isFixed: true, isLunar: false });
  };

  const handleEditClick = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setNewHoliday({ 
      name: holiday.name,
      month: holiday.month,
      day: holiday.day,
      isFixed: holiday.isFixed,
      isLunar: holiday.isLunar || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingHoliday(null);
    setNewHoliday({ name: '', month: 1, day: 1, isFixed: true, isLunar: false });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // This prevents clicks inside the white box from closing the modal
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Holiday Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-2">{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</h3>
        <form onSubmit={handleSaveHoliday} className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
            <input
              type="text"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!editingHoliday}
            />
            {editingHoliday && <p className="text-sm text-gray-500 mt-1">Holiday name cannot be changed when editing.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={newHoliday.month}
                onChange={(e) => setNewHoliday({ ...newHoliday, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={newHoliday.day}
                onChange={(e) => setNewHoliday({ ...newHoliday, day: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newHoliday.isFixed}
                onChange={(e) => setNewHoliday({ ...newHoliday, isFixed: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Fixed Date (same day every year)</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newHoliday.isLunar}
                onChange={(e) => setNewHoliday({ ...newHoliday, isLunar: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Lunar Date</span>
            </label>
          </div>
          <div className="flex space-x-2">
            {editingHoliday && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {editingHoliday ? 'Save Changes' : 'Add Holiday'}
            </button>
          </div>
        </form>

        <h3 className="text-lg font-semibold mb-2 mt-6">Default Holidays in Countdown</h3>
        <ul className="space-y-2 mb-6">
          {defaultHolidays.map((holiday) => (
            <li key={holiday.name} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <span>{holiday.name}</span>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!disabledDefaultHolidays.includes(holiday.name)}
                  onChange={(e) => onToggleDefaultHoliday(holiday.name, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </li>
          ))}
        </ul>

        {customHolidays.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Custom Holidays</h3>
            <ul className="space-y-2">
              {customHolidays.map((holiday, index) => (
                <li key={holiday.name} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span>
                    {holiday.name} ({holiday.month}/{holiday.day})
                    {holiday.isLunar && <span className="text-sm text-gray-500 ml-1">(Lunar)</span>}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(holiday)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteHoliday(holiday.name)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidaySettingsModal; 