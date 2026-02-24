import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CVData, defaultCVData } from '@/types/cv';

interface CVContextType {
  data: CVData;
  updateData: (updates: Partial<CVData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetData: () => void;
}

const CVContext = createContext<CVContextType | null>(null);

const STORAGE_KEY = 'hexa-cv-data';
const STEP_KEY = 'hexa-cv-step';

export function CVProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CVData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultCVData, ...JSON.parse(saved) } : defaultCVData;
    } catch {
      return defaultCVData;
    }
  });

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      return Number(localStorage.getItem(STEP_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(currentStep));
  }, [currentStep]);

  const updateData = useCallback((updates: Partial<CVData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetData = useCallback(() => {
    setData(defaultCVData);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
  }, []);

  return (
    <CVContext.Provider value={{ data, updateData, currentStep, setCurrentStep, resetData }}>
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  const ctx = useContext(CVContext);
  if (!ctx) throw new Error('useCV must be used within CVProvider');
  return ctx;
}
