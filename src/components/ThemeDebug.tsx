'use client';

import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';

export default function ThemeDebug() {
  const { theme, toggleTheme } = useTheme();
  const [localStorageTheme, setLocalStorageTheme] = useState<string | null>(null);
  const [isDarkClass, setIsDarkClass] = useState(false);
  
  useEffect(() => {
    // Update state on client side only
    setLocalStorageTheme(localStorage.getItem('theme'));
    setIsDarkClass(document.documentElement.classList.contains('dark'));
    
    // Set up a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          setIsDarkClass(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Force update when theme changes
  useEffect(() => {
    setLocalStorageTheme(localStorage.getItem('theme'));
  }, [theme]);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-sm z-50">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <div>
        <p>Context Theme: <span className="font-mono">{theme}</span></p>
        <p>LocalStorage: <span className="font-mono">{localStorageTheme || 'null'}</span></p>
        <p>Dark Class: <span className="font-mono">{isDarkClass ? 'true' : 'false'}</span></p>
      </div>
      <div className="mt-2">
        <button 
          onClick={toggleTheme} 
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Toggle Theme
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('theme');
            setLocalStorageTheme(null);
          }} 
          className="bg-red-500 text-white px-2 py-1 rounded text-xs ml-2"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
} 