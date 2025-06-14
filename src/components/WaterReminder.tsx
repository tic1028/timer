import React, { useState, useEffect, useRef } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const WaterReminder: React.FC = () => {
  const [waterCount, setWaterCount] = useState<number>(0);
  const [nextReminder, setNextReminder] = useState<number>(0);
  const [showReminder, setShowReminder] = useState<boolean>(false);
  const [isRandomInterval, setIsRandomInterval] = useState<boolean>(true);
  const [customInterval, setCustomInterval] = useState<number>(30);
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'seconds'>('minutes');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationPermission('granted');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }

    // Create audio element
    audioRef.current = new Audio('/notification-sound.mp3');
  }, []);

  const getRandomInterval = () => {
    // Random interval between 30 and 70 minutes
    return Math.floor(Math.random() * (70 - 30 + 1) + 30) * 60 * 1000;
  };

  const getInterval = () => {
    if (isRandomInterval) {
      return getRandomInterval();
    }
    return customInterval * (intervalUnit === 'minutes' ? 60 : 1) * 1000;
  };

  const showNotification = () => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.log('Audio play failed:', error));
    }

    // Show browser notification if permission granted
    if (notificationPermission === 'granted' && document.hidden) {
      new Notification('Water Reminder', {
        body: 'Time to drink water! 💧',
        icon: '/water-icon.png',
        requireInteraction: true
      });
    }

    setShowReminder(true);
  };

  // Update nextReminder when interval settings change
  useEffect(() => {
    setNextReminder(getInterval());
  }, [isRandomInterval, customInterval, intervalUnit]);

  useEffect(() => {
    const timer = setInterval(() => {
      showNotification();
    }, nextReminder);

    return () => clearInterval(timer);
  }, [nextReminder]);

  const handleDismiss = () => {
    setShowReminder(false);
    setNextReminder(getInterval());
  };

  const handleIncrement = () => {
    setWaterCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setWaterCount(prev => Math.max(0, prev - 1));
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCustomInterval(value);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  return (
    <div className="text-center h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Water Tracker</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={isRandomInterval}
                  onChange={() => setIsRandomInterval(true)}
                  className="form-radio text-blue-600"
                />
                <span>Random (30-70 min)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!isRandomInterval}
                  onChange={() => setIsRandomInterval(false)}
                  className="form-radio text-blue-600"
                />
                <span>Custom</span>
              </label>
            </div>
            
            {!isRandomInterval && (
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={customInterval}
                    onChange={handleIntervalChange}
                    min="1"
                    className="w-20 px-2 py-1 border rounded"
                  />
                  <select
                    value={intervalUnit}
                    onChange={(e) => setIntervalUnit(e.target.value as 'minutes' | 'seconds')}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="minutes">minutes</option>
                    <option value="seconds">seconds</option>
                  </select>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            <div className="pt-2 border-t">
              <button
                onClick={requestNotificationPermission}
                className={`px-3 py-1 rounded text-sm ${
                  notificationPermission === 'granted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {notificationPermission === 'granted'
                  ? '✓ Notifications Enabled'
                  : 'Enable Browser Notifications'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Water Count Display */}
      <div className="mb-6">
        <p className="text-3xl font-bold text-blue-600 mb-2">{waterCount}</p>
        <p className="text-gray-600">glasses today</p>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={handleDecrement}
          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
        >
          -
        </button>
        <button
          onClick={handleIncrement}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          +
        </button>
      </div>

      {/* Reminder Notification */}
      {showReminder && (
        <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 shadow-lg animate-bounce">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💧</span>
            <div>
              <p className="text-blue-800 font-medium">Time to drink water!</p>
              <p className="text-sm text-blue-600">Stay hydrated for better health</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default WaterReminder; 