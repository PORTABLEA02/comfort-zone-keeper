import { Loader2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
  disabled?: boolean;
}

export function FormActions({
  onCancel,
  onPrevious,
  onNext,
  isFirstStep = false,
  isLastStep = false,
  isSubmitting = false,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  previousLabel = 'Précédent',
  nextLabel = 'Suivant',
  showPrevious = true,
  showNext = true,
  showSubmit = true,
  disabled = false
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-6">
      {/* Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-6 py-3 text-muted-foreground hover:text-foreground hover:bg-muted 
                 rounded-xl font-semibold transition-all duration-200 
                 disabled:opacity-50 disabled:cursor-not-allowed hover-lift
                 flex items-center space-x-2"
      >
        <X className="h-5 w-5" />
        <span>{cancelLabel}</span>
      </button>

      <div className="flex items-center space-x-3">
        {/* Previous Button */}
        {showPrevious && !isFirstStep && onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground 
                     rounded-xl font-semibold transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed hover-lift
                     flex items-center space-x-2"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>{previousLabel}</span>
          </button>
        )}

        {/* Next Button (if not last step) */}
        {showNext && !isLastStep && onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting || disabled}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold 
                     transition-all duration-200 hover-lift shadow-glow
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center space-x-2"
          >
            <span>{nextLabel}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Submit Button (if last step or single step) */}
        {showSubmit && (isLastStep || (!onNext && !onPrevious)) && (
          <button
            type="submit"
            disabled={isSubmitting || disabled}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold 
                     transition-all duration-200 hover-lift shadow-glow
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center space-x-2 min-w-[140px] justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
