import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

interface SteamLoginButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function SteamLoginButton({ className = '', size = 'md', fullWidth = false }: SteamLoginButtonProps) {
  const { t } = useTranslation();
  const { loginWithSteam, isLoading } = useAuthStore();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={loginWithSteam}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2
        bg-gradient-to-r from-[#1b2838] to-[#2a475e]
        hover:from-[#2a475e] hover:to-[#3d6580]
        text-white font-medium rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174l-.012-.03c.058.021.116.043.176.063.168.058.34.11.514.157.118.032.237.062.358.089.141.032.283.06.427.084.128.021.257.04.387.056.153.019.307.033.462.044.122.008.244.016.367.02.155.005.311.007.467.007C18.627 23.664 24 18.291 24 11.664 24 5.037 18.627 0 12 0zM5.887 16.81a.75.75 0 01-.23-.547.75.75 0 01.23-.548l1.17-1.17c.146-.145.34-.22.547-.22s.401.075.547.22l.353.354 2.12-2.12-2.474-2.475a5.25 5.25 0 117.424 7.424L13.1 20.2l-.354-.353c-.29-.29-.29-.762 0-1.052l2.12-2.12-.353-.354a.772.772 0 00-1.094 0l-1.17 1.17a.75.75 0 01-.548.23.75.75 0 01-.547-.23l-5.267-5.268a.75.75 0 010-1.095l1.17-1.17c.146-.145.34-.22.547-.22s.401.075.547.22l5.268 5.267a.75.75 0 010 1.095l-1.17 1.17a.772.772 0 000 1.094l.353.354-2.12 2.12-.354-.354a.772.772 0 00-1.094 0l-1.17 1.17a.75.75 0 01-.547.23z"/>
        </svg>
      )}
      <span>{t('nav.login')}</span>
    </button>
  );
}
