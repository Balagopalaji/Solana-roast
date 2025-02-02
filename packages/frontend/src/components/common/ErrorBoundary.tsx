import React, { Component, ErrorInfo } from 'react';
import { logger } from '../../utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Component error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h2>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-sm text-red-600 whitespace-pre-wrap">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 