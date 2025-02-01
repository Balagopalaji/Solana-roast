import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders message correctly', () => {
    render(<Toast message="Test message" onClose={() => {}} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose after duration', () => {
    const onClose = jest.fn();
    render(<Toast message="Test" duration={1000} onClose={onClose} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalled();
  });
}); 