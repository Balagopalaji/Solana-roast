import React, { ReactNode } from 'react';

interface WindowFrameProps {
  title: string;
  className?: string;
  children: ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  title,
  className = '',
  children
}) => {
  return (
    <div className={`bg-win95-gray border-2 border-win95-gray-darker shadow-lg ${className}`}>
      <div className="flex items-center justify-between bg-win95-blue px-2 py-1">
        <span className="text-white font-bold">{title}</span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}; 