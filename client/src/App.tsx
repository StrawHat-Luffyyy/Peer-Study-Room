import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// We will create these pages next
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

import './App.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/room/:id" 
          element={
            <PrivateRoute>
              <Room />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
