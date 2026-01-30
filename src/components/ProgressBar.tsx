/**
 * ProgressBar Component
 * Animated progress bar with percentage display
 */

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  animated?: boolean;
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

const colorClasses = {
  blue: 'bg-steam-accent',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

export function ProgressBar({
  percentage,
  showLabel = true,
  height = 'md',
  color = 'blue',
  animated = true,
}: ProgressBarProps) {
  const safePercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-bold text-steam-accent">{safePercentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-steam-dark rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full ${
            animated ? 'transition-all duration-500 ease-out' : ''
          }`}
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}
