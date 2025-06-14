import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'meals-text';

const CustomText: React.FC = () => {
  const [text, setText] = useState(() => {
    try {
      const savedText = localStorage.getItem(STORAGE_KEY);
      return savedText || '';
    } catch (error) {
      return '';
    }
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      if (text) {
        localStorage.setItem(STORAGE_KEY, text);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      // Silently handle storage errors
    }
  }, [text]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800">Meals</h2>
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="w-full h-full p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 overflow-auto"
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default CustomText; 