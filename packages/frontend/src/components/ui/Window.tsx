import React from 'react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Window({ title, children, onClose }: WindowProps) {
  return (
    <div className="window-container fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="window bg-gray-200 border-2 border-gray-400 shadow-lg rounded w-full max-w-lg">
        {/* Window Title Bar */}
        <div className="window-title flex justify-between items-center bg-blue-800 text-white px-4 py-2">
          <span className="font-bold">{title}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Window Content */}
        <div className="window-content bg-gray-100 p-4">
          {children}
        </div>
      </div>
    </div>
  );
} 