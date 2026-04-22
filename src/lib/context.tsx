'use client';

import React, { createContext, useContext } from 'react';
import { useAppData } from '@/hooks/useAppData';

const AppDataContext = createContext<ReturnType<typeof useAppData> | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const data = useAppData();
  return (
    <AppDataContext.Provider value={data}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppDataContext() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within an AppDataProvider');
  }
  return context;
}
