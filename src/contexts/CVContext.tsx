import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CVData, defaultCVData } from '@/types/cv';
import { normalizeCVData } from '@/lib/normalizeCVData';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface CVContextType {
  data: CVData;
  updateData: (updates: Partial<CVData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetData: () => void;
  saving: boolean;
  loaded: boolean;
}

const CVContext = createContext<CVContextType | null>(null);

const STEP_KEY_V2 = 'hexa-cv-step-v2';
const STEP_KEY_LEGACY = 'hexa-cv-step';
const LAST_STEP_INDEX = 6;

function readInitialWizardStep(): number {
  try {
    const v2 = localStorage.getItem(STEP_KEY_V2);
    if (v2 !== null) {
      const n = Number(v2);
      if (!Number.isNaN(n)) {
        return Math.min(Math.max(0, n), LAST_STEP_INDEX);
      }
    }
    const legacy = localStorage.getItem(STEP_KEY_LEGACY);
    if (legacy !== null) {
      const n = Number(legacy);
      let mapped = 0;
      if (!Number.isNaN(n)) {
        if (n <= 3) mapped = n;
        else if (n === 4) mapped = 5;
        else if (n === 5) mapped = 6;
      }
      localStorage.setItem(STEP_KEY_V2, String(mapped));
      localStorage.removeItem(STEP_KEY_LEGACY);
      return mapped;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function CVProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<CVData>(defaultCVData);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const [currentStep, setCurrentStep] = useState(readInitialWizardStep);

  useEffect(() => {
    if (!user) {
      setData(defaultCVData);
      setLoaded(false);
      return;
    }

    (async () => {
      try {
        const res = await apiFetch('/api/cv');
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const body = (await res.json()) as { data?: unknown };
        const raw = body.data as Partial<CVData> | undefined;
        if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
          setData(normalizeCVData({ ...defaultCVData, ...raw }));
        } else {
          setData(normalizeCVData({ ...defaultCVData }));
        }
      } catch {
        setData(normalizeCVData({ ...defaultCVData }));
      }
      setLoaded(true);
    })();
  }, [user]);

  const saveToDB = useCallback(async (cvData: CVData) => {
    if (!user) return;
    setSaving(true);
    try {
      await apiFetch('/api/cv', {
        method: 'PUT',
        body: JSON.stringify({ data: cvData }),
      });
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY_V2, String(currentStep));
    } catch {
      /* ignore */
    }
  }, [currentStep]);

  const updateData = useCallback(
    (updates: Partial<CVData>) => {
      setData((prev) => {
        const next = { ...prev, ...updates };
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveToDB(next), 1000);
        return next;
      });
    },
    [saveToDB],
  );

  const resetData = useCallback(() => {
    setData(defaultCVData);
    setCurrentStep(0);
    try {
      localStorage.removeItem(STEP_KEY_V2);
      localStorage.removeItem(STEP_KEY_LEGACY);
    } catch {
      /* ignore */
    }
    saveToDB(defaultCVData);
  }, [saveToDB]);

  return (
    <CVContext.Provider
      value={{ data, updateData, currentStep, setCurrentStep, resetData, saving, loaded }}
    >
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  const ctx = useContext(CVContext);
  if (!ctx) throw new Error('useCV must be used within CVProvider');
  return ctx;
}
