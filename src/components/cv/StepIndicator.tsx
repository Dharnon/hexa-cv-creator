import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  onStepClick: (step: number) => void;
}

export function StepIndicator({ currentStep, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full mb-6 overflow-x-auto py-2 [-webkit-overflow-scrolling:touch]">
      <div className="min-w-[min(100%,960px)] px-1">
        <div className="flex items-center justify-between gap-1">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1 min-w-0 last:flex-none">
              <button
                type="button"
                onClick={() => onStepClick(i)}
                className={cn(
                  'flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-sm font-semibold transition-all shrink-0',
                  i < currentStep && 'bg-primary text-primary-foreground cursor-pointer',
                  i === currentStep && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  i > currentStep && 'bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80',
                )}
              >
                {i < currentStep ? '✓' : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 min-w-[12px] h-0.5 mx-2 sm:mx-3',
                    i < currentStep ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2.5 gap-2">
          {steps.map((label, i) => (
            <span
              key={i}
              className={cn(
                'text-[11px] sm:text-xs text-center leading-tight px-1 min-w-0',
                i === currentStep ? 'text-primary font-medium' : 'text-muted-foreground',
                i === 0 ? 'text-left' : i === steps.length - 1 ? 'text-right' : '',
              )}
              style={{ width: `${100 / steps.length}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
