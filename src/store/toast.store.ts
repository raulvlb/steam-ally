import { create } from 'zustand';
import { ToastStore, Toast } from '@/types';

/**
 * Toast Store
 * Manages toast notifications
 */

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const duration = toast.duration || 5000;

    const newToast: Toast = {
      ...toast,
      id,
    };

    set(state => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id),
    }));
  },
}));

// Helper hooks for common toast types
export const useToast = () => {
  const addToast = useToastStore(state => state.addToast);

  return {
    success: (message: string, duration?: number) =>
      addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) =>
      addToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) =>
      addToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) =>
      addToast({ message, type: 'warning', duration }),
  };
};
