import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface SpecialDate {
  id: string;
  name: string;
  month: number; // 1-indexed
  day: number;   // 1-indexed
  type: 'birthday' | 'anniversary';
}

const SPECIAL_DATES_STORAGE_KEY = 'user-special-dates';

const SpecialDatesManager: React.FC = () => {
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>(() => {
    try {
      const savedDates = localStorage.getItem(SPECIAL_DATES_STORAGE_KEY);
      return savedDates ? (JSON.parse(savedDates) as SpecialDate[]) : [];
    } catch (error) {
      console.error("Failed to load special dates from local storage:", error);
      return [];
    }
  });
  const [newName, setNewName] = useState('');
  const [newMonth, setNewMonth] = useState<number | ''>(1);
  const [newDay, setNewDay] = useState<number | ''>(1);
  const [newType, setNewType] = useState<'birthday' | 'anniversary'>('birthday');
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SPECIAL_DATES_STORAGE_KEY, JSON.stringify(specialDates));
    } catch (error) {
      console.error("Failed to save special dates to local storage:", error);
    }
  }, [specialDates]);

  const resetForm = () => {
    setNewName('');
    setNewMonth(1);
    setNewDay(1);
    setNewType('birthday');
    setEditingDateId(null);
  };

  const addOrUpdateSpecialDate = () => {
    if (newName.trim() && typeof newMonth === 'number' && typeof newDay === 'number' && newMonth >= 1 && newMonth <= 12 && newDay >= 1 && newDay <= 31) {
      if (editingDateId) {
        // Update existing date
        setSpecialDates(prev => prev.map(date => 
          date.id === editingDateId 
            ? { ...date, name: newName.trim(), month: newMonth, day: newDay, type: newType }
            : date
        ));
      } else {
        // Add new date
        const newDate: SpecialDate = {
          id: String(Date.now()),
          name: newName.trim(),
          month: newMonth,
          day: newDay,
          type: newType,
        };
        setSpecialDates(prev => [...prev, newDate]);
      }
      resetForm();
    }
  };

  const deleteSpecialDate = (id: string) => {
    setSpecialDates(prev => prev.filter(date => date.id !== id));
    if (editingDateId === id) {
      resetForm();
    }
  };

  const startEdit = (date: SpecialDate) => {
    setNewName(date.name);
    setNewMonth(date.month);
    setNewDay(date.day);
    setNewType(date.type);
    setEditingDateId(date.id);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold text-gray-800">Manage Special Dates</h2>
      
      {/* Add/Edit Special Date Form */}
      <div className="grid grid-cols-2 gap-4 items-end bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Mom, Anniversary"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Month</label>
          <input
            type="number"
            value={newMonth}
            onChange={(e) => setNewMonth(Number(e.target.value) || '')}
            min="1"
            max="12"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Day</label>
          <input
            type="number"
            value={newDay}
            onChange={(e) => setNewDay(Number(e.target.value) || '')}
            min="1"
            max="31"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'birthday' | 'anniversary')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
          </select>
        </div>
        <button
          onClick={addOrUpdateSpecialDate}
          className="col-span-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {editingDateId ? (
            <PencilIcon className="h-5 w-5 inline-block mr-2" />
          ) : (
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
          )}
          {editingDateId ? 'Save Changes' : 'Add Date'}
        </button>
        {editingDateId && (
          <button
            onClick={resetForm}
            className="col-span-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* List of Special Dates */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-800">Your Special Dates</h3>
        {specialDates.length === 0 ? (
          <p className="text-gray-500">No special dates added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {specialDates.map(date => (
              <li key={date.id} className="py-2 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-900">{date.name}</p>
                  <p className="text-sm text-gray-500">
                    {date.type === 'birthday' ? 'Birthday' : 'Anniversary'} on {date.month}/{date.day}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(date)}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteSpecialDate(date.id)}
                    className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SpecialDatesManager; 