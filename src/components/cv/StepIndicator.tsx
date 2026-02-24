import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  onStepClick: (step: number) => void;
}

export function StepIndicator({ currentStep, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => onStepClick(i)}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all shrink-0",
                i < currentStep && "bg-primary text-primary-foreground cursor-pointer",
                i === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                i > currentStep && "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80"
              )}
            >
              {i < currentStep ? '✓' : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                i < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((label, i) => (
          <span key={i} className={cn(
            "text-xs text-center",
            i === currentStep ? "text-primary font-medium" : "text-muted-foreground",
            i === 0 ? "text-left" : i === steps.length - 1 ? "text-right" : ""
          )} style={{ width: `${100 / steps.length}%` }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
