import { ReactNode } from 'react';

/**
 * Card Component
 * Reusable card container
 */

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  const hoverClasses = hoverable
    ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer transition-all duration-200'
    : '';

  return (
    <div
      className={`bg-white dark:bg-steam-darker rounded-lg border border-gray-200 dark:border-steam-dark shadow-sm ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader Component
 */

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-4 border-b border-gray-200 dark:border-steam-dark ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardContent Component
 */

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

/**
 * CardFooter Component
 */

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`p-4 border-t border-gray-200 dark:border-steam-dark ${className}`}>
      {children}
    </div>
  );
}
