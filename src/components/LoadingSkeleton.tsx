/**
 * Loading Skeleton Component
 * Placeholder shown while async components load
 */

'use client';

interface LoadingSkeletonProps {
  type?: 'modal' | 'widget';
  height?: string;
}

export function LoadingSkeleton({ type = 'modal', height = '400px' }: LoadingSkeletonProps) {
  if (type === 'modal') {
    return (
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--surface-1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: 'var(--protools-cyan)',
            opacity: 0.6,
          }}
        >
          Loading...
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height,
        background: 'var(--surface-1)',
        borderRadius: '4px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
