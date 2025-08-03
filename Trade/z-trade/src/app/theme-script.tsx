'use client';

import { useEffect } from 'react';

// This component doesn't render anything
// It just runs the theme initialization script on the client
export function ThemeScript() {
  useEffect(() => {
    // Check if theme exists in localStorage
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply the theme
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  return null;
} 