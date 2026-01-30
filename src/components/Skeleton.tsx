/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-300 dark:bg-steam-light';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton Card Component
 */

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-steam-darker rounded-lg p-4 border border-gray-200 dark:border-steam-dark">
      <Skeleton className="w-full h-48 mb-4" />
      <Skeleton className="w-3/4 h-6 mb-2" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  );
}

/**
 * Skeleton Profile Component
 */

export function SkeletonProfile() {
  return (
    <div className="bg-white dark:bg-steam-darker rounded-lg p-6 border border-gray-200 dark:border-steam-dark">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton variant="circular" className="w-24 h-24" />
        <div className="flex-1">
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton List Component
 */

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
