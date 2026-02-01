import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar, ToastContainer } from '@/components';
import { AppRoutes } from '@/routes';
import { useAuthStore } from '@/store/auth.store';

/**
 * App Component
 * Root component with layout and routing
 */

function App() {
  const { checkAuth } = useAuthStore();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
    
    // Handle auth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      // Clear the URL params after successful auth
      window.history.replaceState({}, '', window.location.pathname);
      checkAuth(); // Re-check auth to get user data
    }
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-steam-dark text-gray-900 dark:text-white">
        <Navbar />
        <main>
          <AppRoutes />
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;
