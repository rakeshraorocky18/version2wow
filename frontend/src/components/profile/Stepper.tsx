import { WIZARD_STEPS } from '../../types/profile';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  completion: number;
}

export default function Stepper({ currentStep, completion }: StepperProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Profile completion</span>
        <span className="font-semibold text-primary-600">{completion}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${completion}%` }}
        />
      </div>

      <div className="hidden md:flex items-center justify-between gap-1">
        {WIZARD_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;
          return (
            <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 scale-110'
                    : isComplete
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isComplete ? <Check size={16} /> : step.id}
              </div>
              <span
                className={`text-center text-xs leading-tight max-w-[90px] ${
                  isActive ? 'text-primary-700 font-semibold' : isComplete ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="md:hidden text-center">
        <p className="text-sm text-gray-500">
          Step {currentStep} of {WIZARD_STEPS.length}
        </p>
        <p className="font-semibold text-primary-700">{WIZARD_STEPS[currentStep - 1]?.label}</p>
      </div>
    </div>
  );
}
