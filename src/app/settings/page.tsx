'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface Settings {
  defaultCurrency: string;
  defaultPositionSize: number;
  riskTolerance: 'low' | 'medium' | 'high';
  enableNotifications: boolean;
  autoCalculateFees: boolean;
  defaultFees: number;
  theme: 'light' | 'dark' | 'system';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  showPnLInPercent: boolean;
  enableTradeValidation: boolean;
  maxDrawdownAlert: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    defaultCurrency: 'USD',
    defaultPositionSize: 1000,
    riskTolerance: 'medium',
    enableNotifications: true,
    autoCalculateFees: true,
    defaultFees: 9.99,
    theme: 'system',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    showPnLInPercent: false,
    enableTradeValidation: true,
    maxDrawdownAlert: 10
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('z-trade-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('z-trade-settings', JSON.stringify(settings));
      
      // Apply theme immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System theme - check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    const defaultSettings: Settings = {
      defaultCurrency: 'USD',
      defaultPositionSize: 1000,
      riskTolerance: 'medium',
      enableNotifications: true,
      autoCalculateFees: true,
      defaultFees: 9.99,
      theme: 'system',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      showPnLInPercent: false,
      enableTradeValidation: true,
      maxDrawdownAlert: 10
    };
    setSettings(defaultSettings);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Customize your trading preferences and app configuration
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Trading Preferences */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Trading Preferences
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Currency
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Position Size
                </label>
                <input
                  type="number"
                  value={settings.defaultPositionSize}
                  onChange={(e) => handleSettingChange('defaultPositionSize', Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Risk Tolerance
                </label>
                <select
                  value={settings.riskTolerance}
                  onChange={(e) => handleSettingChange('riskTolerance', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Fees
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.defaultFees}
                  onChange={(e) => handleSettingChange('defaultFees', Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="9.99"
                />
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Display Preferences
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Format
                </label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPnLInPercent"
                  checked={settings.showPnLInPercent}
                  onChange={(e) => handleSettingChange('showPnLInPercent', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showPnLInPercent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Show P&L in percentage
                </label>
              </div>
            </div>
          </div>

          {/* Notifications & Alerts */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Notifications & Alerts
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable notifications
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Drawdown Alert (%)
                </label>
                <input
                  type="number"
                  value={settings.maxDrawdownAlert}
                  onChange={(e) => handleSettingChange('maxDrawdownAlert', Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Trade Validation */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Trade Validation
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableTradeValidation"
                  checked={settings.enableTradeValidation}
                  onChange={(e) => handleSettingChange('enableTradeValidation', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableTradeValidation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable trade validation
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoCalculateFees"
                  checked={settings.autoCalculateFees}
                  onChange={(e) => handleSettingChange('autoCalculateFees', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoCalculateFees" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Auto-calculate fees
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            onClick={saveSettings}
            disabled={loading}
            variant="primary"
            className="flex-1"
          >
            {loading ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
          </Button>
          
          <Button
            onClick={resetSettings}
            variant="outline"
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>

        {/* Settings Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Settings Information
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Your settings are saved locally in your browser. They will persist between sessions and help customize your trading experience.
          </p>
        </div>
      </div>
    </div>
  );
} 