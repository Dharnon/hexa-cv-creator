import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CVData, defaultCVData } from '@/types/cv';
import { supabase } from '@/integrations/supabase/client';
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

const STEP_KEY = 'hexa-cv-step';

export function CVProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<CVData>(defaultCVData);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const [currentStep, setCurrentStep] = useState(() => {
    try { return Number(localStorage.getItem(STEP_KEY)) || 0; } catch { return 0; }
  });

  // Load from DB
  useEffect(() => {
    if (!user) { setData(defaultCVData); setLoaded(false); return; }
    (async () => {
      // Load CV data
      const { data: row } = await supabase
        .from('cv_data')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();

      // Load profile for auto-fill
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, job_title')
        .eq('user_id', user.id)
        .maybeSingle();

      if (row?.data) {
        setData({ ...defaultCVData, ...(row.data as unknown as CVData) });
      } else if (profile) {
        // Auto-fill new CV with profile data
        setData({
          ...defaultCVData,
          personalInfo: {
            ...defaultCVData.personalInfo,
            fullName: profile.full_name || '',
            email: profile.email || '',
          },
          professionalProfile: {
            ...defaultCVData.professionalProfile,
            jobTitle: (profile as any).job_title || '',
          },
        });
      }
      setLoaded(true);
    })();
  }, [user]);

  // Save to DB with debounce
  const saveToDB = useCallback(async (cvData: CVData) => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from('cv_data')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) {
      await supabase.from('cv_data').update({ data: cvData as any }).eq('user_id', user.id);
    } else {
      await supabase.from('cv_data').insert({ user_id: user.id, data: cvData as any });
    }
    setSaving(false);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(currentStep));
  }, [currentStep]);

  const updateData = useCallback((updates: Partial<CVData>) => {
    setData(prev => {
      const next = { ...prev, ...updates };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveToDB(next), 1000);
      return next;
    });
  }, [saveToDB]);

  const resetData = useCallback(() => {
    setData(defaultCVData);
    setCurrentStep(0);
    localStorage.removeItem(STEP_KEY);
    saveToDB(defaultCVData);
  }, [saveToDB]);

  return (
    <CVContext.Provider value={{ data, updateData, currentStep, setCurrentStep, resetData, saving, loaded }}>
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  const ctx = useContext(CVContext);
  if (!ctx) throw new Error('useCV must be used within CVProvider');
  return ctx;
}
