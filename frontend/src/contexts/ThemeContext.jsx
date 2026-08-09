import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState({
    themeColor: '#3B82F6',
    restaurantName: 'Restaurant ERP',
    logo: ''
  });

  useEffect(() => {
    if (user) {
      api.get('/restaurant/profile')
        .then(res => {
          if (res.data) {
            const color = res.data.themeColor || '#3B82F6';
            setTheme({
              themeColor: color,
              restaurantName: res.data.name || 'Restaurant ERP',
              logo: res.data.logo || ''
            });
            // Update CSS variable for Tailwind
            document.documentElement.style.setProperty('--color-primary', color);
          }
        })
        .catch(err => console.error("Error loading theme", err));
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
