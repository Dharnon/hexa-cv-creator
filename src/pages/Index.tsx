import { CVProvider, useCV } from '@/contexts/CVContext';
import { useAuth } from '@/hooks/useAuth';
import { StepIndicator } from '@/components/cv/StepIndicator';
import { StepPersonalInfo } from '@/components/cv/StepPersonalInfo';
import { StepProfile } from '@/components/cv/StepProfile';
import { StepExperience } from '@/components/cv/StepExperience';
import { StepEducation } from '@/components/cv/StepEducation';
import { StepCompetencies } from '@/components/cv/StepCompetencies';
import { StepPreview } from '@/components/cv/StepPreview';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, Users, Shield, LogOut, Loader2, FlaskConical } from 'lucide-react';
import { sampleCVData } from '@/types/cv';
import hexaLogo from '@/assets/hexa-logo.png';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  'Información Personal',
  'Perfil',
  'Experiencia',
  'Educación',
  'Competencias',
  'Vista Previa',
];

function WizardContent() {
  const { currentStep, setCurrentStep, resetData, saving, loaded, updateData } = useCV();
  const { signOut, isHR, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const stepComponents = [
    <StepPersonalInfo key={0} />,
    <StepProfile key={1} />,
    <StepExperience key={2} />,
    <StepEducation key={3} />,
    <StepCompetencies key={4} />,
    <StepPreview key={5} />,
  ];

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
            <div>
              <p className="text-xs text-muted-foreground">Generador de CV Europass</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
              </span>
            )}
            {isHR && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/rrhh')}>
                <Users className="w-4 h-4 mr-1" /> RRHH
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="w-4 h-4 mr-1" /> Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => updateData(sampleCVData)}>
              <FlaskConical className="w-4 h-4 mr-1" /> Demo
            </Button>
            <Button variant="ghost" size="sm" onClick={resetData}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <StepIndicator currentStep={currentStep} steps={STEPS} onStepClick={setCurrentStep} />
        <div className="min-h-[400px]">{stepComponents[currentStep]}</div>
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          {currentStep < STEPS.length - 1 && (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

const Index = () => (
  <CVProvider>
    <WizardContent />
  </CVProvider>
);

export default Index;
