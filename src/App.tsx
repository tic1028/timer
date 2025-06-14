import React, { useState } from 'react';
import Clock from './components/Clock';
import TodayPlan from './components/TodayPlan';
import Pomodoro from './components/Pomodoro';
import CustomText from './components/CustomText';
import HolidayCountdown from './components/HolidayCountdown';
import WaterReminder from './components/WaterReminder';
import SpecialDatesManager from './components/SpecialDatesManager';

function App() {
  const [showSpecialDatesManagerModal, setShowSpecialDatesManagerModal] = useState(false);

  const handleOpenSpecialDatesManager = () => {
    setShowSpecialDatesManagerModal(true);
  };

  const handleCloseSpecialDatesManager = () => {
    setShowSpecialDatesManagerModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {/* Top Row Components */}
          <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 md:p-8 flex flex-col justify-center">
            <Clock onOpenSpecialDatesManager={handleOpenSpecialDatesManager} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 md:p-8 flex flex-col justify-center">
            <Pomodoro />
          </div>
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 md:p-8 flex flex-col justify-center">
            <TodayPlan />
          </div>

          {/* Bottom Row Components */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 md:p-8 flex flex-col justify-center">
            <HolidayCountdown />
          </div>
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 md:p-8 flex flex-col justify-center">
            <WaterReminder />
          </div>
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 md:p-8 flex flex-col justify-center">
            <CustomText />
          </div>
        </div>
      </div>

      {/* Special Dates Manager Modal */}
      {showSpecialDatesManagerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseSpecialDatesManager}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
            <SpecialDatesManager />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
