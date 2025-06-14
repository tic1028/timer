import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon, Cog6ToothIcon, StopIcon } from '@heroicons/react/24/outline';

const Pomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? workDuration * 60 : breakDuration * 60);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isBreak, workDuration, breakDuration]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSettings = () => {
    setTimeLeft(workDuration * 60);
    setIsRunning(false);
    setIsBreak(false);
    setShowSettings(false);
  };

  return (
    <div className="space-y-4">
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={workDuration}
              onChange={(e) => setWorkDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
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
                className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isRunning ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={stopTimer}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <StopIcon className="h-6 w-6" />
              </button>
              <button
                onClick={resetTimer}
                className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Pomodoro; 