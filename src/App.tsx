import { BrowserRouter } from 'react-router-dom';
import { Navbar, ToastContainer } from '@/components';
import { AppRoutes } from '@/routes';

/**
 * App Component
 * Root component with layout and routing
 */

function App() {
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
