import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  units: '@settings_units',
  darkMode: '@settings_dark_mode',
  notifications: '@settings_notifications',
};

const DEFAULTS = {
  units: 'kg',         // 'kg' | 'lb'
  darkMode: true,      // boolean
  notifications: true, // boolean
};

// Conversion constants
const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [units, setUnits] = useState(DEFAULTS.units);
  const [darkMode, setDarkMode] = useState(DEFAULTS.darkMode);
  const [notifications, setNotifications] = useState(DEFAULTS.notifications);
  const [isReady, setIsReady] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedUnits, savedDarkMode, savedNotifications] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.units),
          AsyncStorage.getItem(STORAGE_KEYS.darkMode),
          AsyncStorage.getItem(STORAGE_KEYS.notifications),
        ]);

        if (savedUnits !== null) setUnits(savedUnits);
        if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
        if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.warn('Failed to load settings:', error);
      } finally {
        setIsReady(true);
      }
    };
    loadSettings();
  }, []);

  const toggleUnits = useCallback(async () => {
    const newUnits = units === 'kg' ? 'lb' : 'kg';
    setUnits(newUnits);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.units, newUnits);
    } catch (error) {
      console.warn('Failed to save units:', error);
    }
  }, [units]);

  const toggleDarkMode = useCallback(async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(newValue));
    } catch (error) {
      console.warn('Failed to save dark mode:', error);
    }
  }, [darkMode]);

  const toggleNotifications = useCallback(async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(newValue));
    } catch (error) {
      console.warn('Failed to save notifications:', error);
    }
  }, [notifications]);

  // Utility: convert weight based on current unit setting
  const convertWeight = useCallback((valueInKg) => {
    if (units === 'lb') {
      return Math.round(valueInKg * KG_TO_LB * 10) / 10;
    }
    return valueInKg;
  }, [units]);

  // Utility: format weight with unit label
  const formatWeight = useCallback((valueInKg) => {
    const converted = convertWeight(valueInKg);
    return `${converted} ${units}`;
  }, [units, convertWeight]);

  return (
    <SettingsContext.Provider
      value={{
        units,
        darkMode,
        notifications,
        toggleUnits,
        toggleDarkMode,
        toggleNotifications,
        convertWeight,
        formatWeight,
        isSettingsReady: isReady,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
