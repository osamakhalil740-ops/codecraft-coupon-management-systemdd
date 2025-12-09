import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'profile' | 'stat' | 'text' | 'image';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'card', 
  count = 1,
  className = '' 
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const baseClasses = "animate-pulse bg-gray-200 rounded";

  switch (variant) {
    case 'card':
      return (
        <>
          {skeletons.map((key) => (
            <div key={key} className={`glass-panel p-6 ${className}`}>
              {/* Image */}
              <div className={`${baseClasses} h-48 mb-4`} />
              
              {/* Title */}
              <div className={`${baseClasses} h-6 w-3/4 mb-3`} />
              
              {/* Description lines */}
              <div className={`${baseClasses} h-4 w-full mb-2`} />
              <div className={`${baseClasses} h-4 w-5/6 mb-4`} />
              
              {/* Footer items */}
              <div className="flex gap-3">
                <div className={`${baseClasses} h-4 w-20`} />
                <div className={`${baseClasses} h-4 w-24`} />
                <div className={`${baseClasses} h-4 w-16 ml-auto`} />
              </div>
            </div>
          ))}
        </>
      );

    case 'list':
      return (
        <>
          {skeletons.map((key) => (
            <div key={key} className={`flex items-center gap-4 p-4 ${className}`}>
              {/* Avatar */}
              <div className={`${baseClasses} h-12 w-12 rounded-full flex-shrink-0`} />
              
              <div className="flex-1">
                {/* Title */}
                <div className={`${baseClasses} h-5 w-1/3 mb-2`} />
                {/* Subtitle */}
                <div className={`${baseClasses} h-4 w-1/2`} />
              </div>
              
              {/* Action */}
              <div className={`${baseClasses} h-8 w-20`} />
            </div>
          ))}
        </>
      );

    case 'table':
      return (
        <div className={`overflow-hidden ${className}`}>
          {/* Header */}
          <div className="flex gap-4 p-4 border-b border-gray-200">
            <div className={`${baseClasses} h-5 w-1/4`} />
            <div className={`${baseClasses} h-5 w-1/4`} />
            <div className={`${baseClasses} h-5 w-1/4`} />
            <div className={`${baseClasses} h-5 w-1/4`} />
          </div>
          
          {/* Rows */}
          {skeletons.map((key) => (
            <div key={key} className="flex gap-4 p-4 border-b border-gray-100">
              <div className={`${baseClasses} h-4 w-1/4`} />
              <div className={`${baseClasses} h-4 w-1/4`} />
              <div className={`${baseClasses} h-4 w-1/4`} />
              <div className={`${baseClasses} h-4 w-1/4`} />
            </div>
          ))}
        </div>
      );

    case 'profile':
      return (
        <div className={`glass-panel p-6 ${className}`}>
          {/* Header with avatar */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`${baseClasses} h-20 w-20 rounded-full flex-shrink-0`} />
            <div className="flex-1">
              <div className={`${baseClasses} h-6 w-1/2 mb-2`} />
              <div className={`${baseClasses} h-4 w-1/3`} />
            </div>
          </div>
          
          {/* Info sections */}
          <div className="space-y-4">
            <div>
              <div className={`${baseClasses} h-4 w-20 mb-2`} />
              <div className={`${baseClasses} h-5 w-full`} />
            </div>
            <div>
              <div className={`${baseClasses} h-4 w-20 mb-2`} />
              <div className={`${baseClasses} h-5 w-3/4`} />
            </div>
            <div>
              <div className={`${baseClasses} h-4 w-20 mb-2`} />
              <div className={`${baseClasses} h-5 w-2/3`} />
            </div>
          </div>
        </div>
      );

    case 'stat':
      return (
        <>
          {skeletons.map((key) => (
            <div key={key} className={`glass-panel p-6 ${className}`}>
              {/* Icon placeholder */}
              <div className={`${baseClasses} h-10 w-10 rounded-lg mb-4`} />
              
              {/* Value */}
              <div className={`${baseClasses} h-8 w-24 mb-2`} />
              
              {/* Label */}
              <div className={`${baseClasses} h-4 w-32`} />
            </div>
          ))}
        </>
      );

    case 'text':
      return (
        <div className={className}>
          {skeletons.map((key) => (
            <div key={key} className={`${baseClasses} h-4 w-full mb-2`} />
          ))}
        </div>
      );

    case 'image':
      return (
        <div className={`${baseClasses} ${className}`} style={{ paddingBottom: '56.25%' }} />
      );

    default:
      return null;
  }
};

// Preset skeleton components for common use cases
export const CouponCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <LoadingSkeleton variant="card" count={count} />
);

export const ShopListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <LoadingSkeleton variant="list" count={count} />
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 10 }) => (
  <LoadingSkeleton variant="table" count={rows} />
);

export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <LoadingSkeleton variant="stat" count={count} />
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <LoadingSkeleton variant="profile" />
);

export default LoadingSkeleton;
