import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  isSaving,
}: WizardNavigationProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst || isSaving}
          className="btn-secondary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} /> Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={18} /> Save Profile
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            Next <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
