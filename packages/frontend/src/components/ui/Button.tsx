import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50';
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 