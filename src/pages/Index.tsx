import { CVProvider, useCV } from '@/contexts/CVContext';
import { StepIndicator } from '@/components/cv/StepIndicator';
import { StepPersonalInfo } from '@/components/cv/StepPersonalInfo';
import { StepProfile } from '@/components/cv/StepProfile';
import { StepExperience } from '@/components/cv/StepExperience';
import { StepEducation } from '@/components/cv/StepEducation';
import { StepCompetencies } from '@/components/cv/StepCompetencies';
import { StepPreview } from '@/components/cv/StepPreview';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { sampleCVData, defaultCVData } from '@/types/cv';
import hexaLogo from '@/assets/hexa-logo.png';
import { useState } from 'react';

const STEPS = [
  'Información Personal',
  'Perfil',
  'Experiencia',
  'Educación',
  'Competencias',
  'Vista Previa',
];

function WizardContent() {
  const { currentStep, setCurrentStep, resetData, updateData, data } = useCV();
  const [usingSample, setUsingSample] = useState(false);

  const toggleSample = (checked: boolean) => {
    setUsingSample(checked);
    if (checked) {
      updateData(sampleCVData);
    } else {
      updateData(defaultCVData);
    }
  };
  const stepComponents = [
    <StepPersonalInfo key={0} />,
    <StepProfile key={1} />,
    <StepExperience key={2} />,
    <StepEducation key={3} />,
    <StepCompetencies key={4} />,
    <StepPreview key={5} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
            <div>
              <h1 className="text-base font-semibold text-foreground">Hexa Ingenieros</h1>
              <p className="text-xs text-muted-foreground">Generador de CV Europass</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={usingSample} onCheckedChange={toggleSample} />
              <Label className="text-xs text-muted-foreground">Datos de ejemplo</Label>
            </div>
            <Button variant="ghost" size="sm" onClick={resetData}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <StepIndicator currentStep={currentStep} steps={STEPS} onStepClick={setCurrentStep} />

        <div className="min-h-[400px]">
          {stepComponents[currentStep]}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
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
