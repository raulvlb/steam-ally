import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '@/store';
import { Toast as ToastType } from '@/types';

/**
 * Toast Component
 * Displays notification messages
 */

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-black',
};

interface ToastItemProps {
  toast: ToastType;
}

function ToastItem({ toast }: ToastItemProps) {
  const removeToast = useToastStore(state => state.removeToast);
  const Icon = toastIcons[toast.type];

  return (
    <div
      className={`${toastStyles[toast.type]} rounded-lg shadow-lg p-4 mb-3 flex items-center space-x-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Toast Container
 */

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
