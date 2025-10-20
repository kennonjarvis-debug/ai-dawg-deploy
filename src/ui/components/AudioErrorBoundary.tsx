import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  componentName?: string;
  enableRetry?: boolean;
  enableAudioReset?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  audioDeviceError: boolean;
}

export class AudioErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      audioDeviceError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Detect audio-specific errors
    const audioDeviceError =
      error.message?.includes('AudioContext') ||
      error.message?.includes('getUserMedia') ||
      error.message?.includes('microphone') ||
      error.message?.includes('NotAllowedError') ||
      error.message?.includes('NotFoundError') ||
      error.name === 'NotAllowedError' ||
      error.name === 'NotFoundError';

    return {
      hasError: true,
      error,
      audioDeviceError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'AudioComponent';

    // Log error with audio-specific context
    logger.error(`[AudioErrorBoundary] Error in ${componentName}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      audioDeviceError: this.state.audioDeviceError,
      retryCount: this.state.retryCount,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, {
      //   contexts: {
      //     react: { componentStack: errorInfo.componentStack },
      //     audio: { audioDeviceError: this.state.audioDeviceError }
      //   }
      // });
    }
  }

  handleReset = () => {
    logger.info('[AudioErrorBoundary] User initiated error reset', {
      componentName: this.props.componentName,
      retryCount: this.state.retryCount,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleAudioReset = async () => {
    logger.info('[AudioErrorBoundary] User initiated audio system reset');

    try {
      // Reset audio context and devices
      // This is a placeholder - actual implementation would interact with AudioEngine
      if (typeof window !== 'undefined') {
        // Close all existing audio contexts
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          logger.debug('[AudioErrorBoundary] Attempting to reset audio contexts');
        }
      }

      // Reset the error state
      this.handleReset();
    } catch (resetError) {
      logger.error('[AudioErrorBoundary] Audio reset failed:', { error: resetError });
    }
  };

  getErrorMessage = (): { title: string; description: string; actions: string[] } => {
    const { error, audioDeviceError } = this.state;

    if (!error) {
      return {
        title: 'Audio Error',
        description: 'An unexpected error occurred in the audio system.',
        actions: ['retry'],
      };
    }

    // Audio device permission errors
    if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
      return {
        title: 'Microphone Access Denied',
        description: 'Please grant microphone permissions in your browser settings to record audio.',
        actions: ['audioReset', 'retry'],
      };
    }

    // No audio device found
    if (error.name === 'NotFoundError' || error.message?.includes('NotFoundError')) {
      return {
        title: 'No Microphone Found',
        description: 'Please connect a microphone and try again.',
        actions: ['audioReset', 'retry'],
      };
    }

    // AudioContext errors
    if (error.message?.includes('AudioContext')) {
      return {
        title: 'Audio System Error',
        description: 'The audio system encountered an error. This may be due to browser limitations or audio device issues.',
        actions: ['audioReset', 'retry'],
      };
    }

    // Generic audio errors
    if (audioDeviceError) {
      return {
        title: 'Audio Device Error',
        description: 'There was a problem with your audio device. Please check your audio settings and try again.',
        actions: ['audioReset', 'retry'],
      };
    }

    // Generic errors
    return {
      title: 'Audio Processing Error',
      description: 'An error occurred while processing audio. The audio pipeline may have crashed.',
      actions: ['retry'],
    };
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, actions } = this.getErrorMessage();
      const { enableRetry = true, enableAudioReset = true } = this.props;
      const canRetry = enableRetry && this.state.retryCount < this.maxRetries;

      // Default error UI with audio-specific messaging
      return (
        <div className="min-h-[200px] bg-daw-bg flex items-center justify-center p-6">
          <div className="max-w-xl w-full">
            <div className="bg-daw-surface/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-500/20 rounded-full">
                  {this.state.audioDeviceError ? (
                    <VolumeX className="w-12 h-12 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white text-center mb-3">
                {title}
              </h2>
              <p className="text-gray-400 text-center mb-6">
                {description}
              </p>

              {/* Retry limit warning */}
              {this.state.retryCount >= this.maxRetries && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400 text-center">
                    Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
                  </p>
                </div>
              )}

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-black/40 border border-white/10 rounded-lg">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Error Details:</h3>
                  <p className="text-xs text-gray-300 font-mono mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Retry count: {this.state.retryCount}/{this.maxRetries}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Retry button */}
                {actions.includes('retry') && canRetry && (
                  <button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}

                {/* Audio reset button */}
                {actions.includes('audioReset') && enableAudioReset && (
                  <button
                    onClick={this.handleAudioReset}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    Reset Audio
                  </button>
                )}

                {/* Reload page button (fallback) */}
                {!canRetry && (
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with audio components
export const withAudioErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    componentName?: string;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onRetry?: () => void;
    enableRetry?: boolean;
    enableAudioReset?: boolean;
  }
) => {
  return (props: P) => (
    <AudioErrorBoundary
      componentName={options?.componentName}
      fallback={options?.fallback}
      onError={options?.onError}
      onRetry={options?.onRetry}
      enableRetry={options?.enableRetry}
      enableAudioReset={options?.enableAudioReset}
    >
      <Component {...props} />
    </AudioErrorBoundary>
  );
};
