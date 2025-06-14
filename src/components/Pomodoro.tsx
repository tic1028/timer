import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const Pomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workMinutes, setWorkMinutes] = useState<number | ''>(45);
  const [workSeconds, setWorkSeconds] = useState<number | ''>(0);
  const [breakMinutes, setBreakMinutes] = useState<number | ''>(5);
  const [breakSeconds, setBreakSeconds] = useState<number | ''>(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(new Date().toDateString());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset completed sessions if it's a new day
  useEffect(() => {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
      setCompletedSessions(0);
      setLastResetDate(today);
    }
  }, [lastResetDate]);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5; // Set volume to 50%

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      // Reset the audio to the beginning
      audioRef.current.currentTime = 0;
      
      // Play the notification
      audioRef.current.play().catch(error => {
        console.log('Error playing notification:', error);
      });
    }
  };

  const getTotalSeconds = (minutes: number | '', seconds: number | '') => {
    const mins = typeof minutes === 'number' ? minutes : 0;
    const secs = typeof seconds === 'number' ? seconds : 0;
    return mins * 60 + secs;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsBreak(!isBreak);
      const newTime = isBreak 
        ? getTotalSeconds(workMinutes, workSeconds)
        : getTotalSeconds(breakMinutes, breakSeconds);
      setTimeLeft(newTime);
      // Increment completed sessions when a work session ends
      if (!isBreak) {
        setCompletedSessions(prev => prev + 1);
      }
      playNotificationSound();
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isBreak, workMinutes, workSeconds, breakMinutes, breakSeconds]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(getTotalSeconds(workMinutes, workSeconds));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSettings = () => {
    // Ensure minimum values when saving
    const validWorkMinutes = Math.max(0, typeof workMinutes === 'number' ? workMinutes : 45);
    const validWorkSeconds = Math.min(59, Math.max(0, typeof workSeconds === 'number' ? workSeconds : 0));
    const validBreakMinutes = Math.max(0, typeof breakMinutes === 'number' ? breakMinutes : 5);
    const validBreakSeconds = Math.min(59, Math.max(0, typeof breakSeconds === 'number' ? breakSeconds : 0));
    
    setWorkMinutes(validWorkMinutes);
    setWorkSeconds(validWorkSeconds);
    setBreakMinutes(validBreakMinutes);
    setBreakSeconds(validBreakSeconds);
    setTimeLeft(getTotalSeconds(validWorkMinutes, validWorkSeconds));
    setIsRunning(false);
    setIsBreak(false);
    setShowSettings(false);
  };

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Pomodoro Timer</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>

      {showSettings ? (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Work Duration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={workMinutes}
                  onChange={(e) => setWorkMinutes(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={workSeconds}
                  onChange={(e) => setWorkSeconds(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Break Duration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={breakSeconds}
                  onChange={(e) => setBreakSeconds(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Settings
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center space-y-4">
            <div className="text-6xl font-bold text-gray-800">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xl text-gray-600">
              {isBreak ? 'Break Time' : 'Work Time'}
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleTimer}
                className={`p-3 rounded-full focus:outline-none focus:ring-2 ${
                  isRunning 
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' 
                    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                } text-white`}
              >
                {isRunning ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={resetTimer}
                className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700">Today's Progress</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {completedSessions} {completedSessions === 1 ? 'Focus Session' : 'Focus Sessions'} Completed
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Pomodoro; 