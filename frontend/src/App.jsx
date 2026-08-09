import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './features/auth/Login';
import OwnerLayout from './features/dashboard/OwnerLayout';
import CustomerMenu from './features/customer/CustomerMenu';
import OrderStatus from './features/customer/OrderStatus';
import ReceiptPrint from './features/cashier/ReceiptPrint';
import WaiterLayout from './features/waiter/WaiterLayout';
import KitchenLayout from './features/kitchen/KitchenLayout';
import CashierLayout from './features/cashier/CashierLayout';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Owner has full access to all portals
  if (requiredRole && user.role !== requiredRole && user.role !== 'OWNER') {
    if (user.role === 'WAITER') return <Navigate to="/waiter" replace />;
    if (user.role === 'KITCHEN') return <Navigate to="/kitchen" replace />;
    if (user.role === 'CASHIER') return <Navigate to="/cashier" replace />;
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      {/* Customer Public Routes */}
      <Route path="/menu/:restaurantId/table/:tableNumber" element={<CustomerMenu />} />
      <Route path="/order/:orderId/status" element={<OrderStatus />} />
      
      <Route 
        path="/owner/*" 
        element={
          <ProtectedRoute requiredRole="OWNER">
            <OwnerLayout />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/waiter/*" 
        element={
          <ProtectedRoute requiredRole="WAITER">
            <WaiterLayout />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/receipt/:orderId" 
        element={
          <ProtectedRoute requiredRole="CASHIER">
            <ReceiptPrint />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/kitchen/*" 
        element={
          <ProtectedRoute requiredRole="KITCHEN">
            <KitchenLayout />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cashier/*" 
        element={
          <ProtectedRoute requiredRole="CASHIER">
            <CashierLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
