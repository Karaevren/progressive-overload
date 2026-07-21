import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const LANGUAGE_KEY = '@app_language';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(i18n.locale);
  const [isReady, setIsReady] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLang) {
          i18n.locale = savedLang;
          setLocale(savedLang);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      } finally {
        setIsReady(true);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    try {
      i18n.locale = lang;
      setLocale(lang);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }, []);

  const t = useCallback((scope, options) => {
    return i18n.t(scope, options);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
