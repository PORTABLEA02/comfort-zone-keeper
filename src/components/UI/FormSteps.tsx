import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FormStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowSkip?: boolean;
}

export function FormSteps({ steps, currentStep, onStepClick, allowSkip = false }: FormStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowSkip || isCompleted;
          
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`flex flex-col items-center flex-1 group transition-all duration-300 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Step Circle */}
                <div className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-300 transform
                  ${isCurrent ? 'scale-110 shadow-lg' : 'scale-100'}
                  ${isCompleted ? 'bg-gradient-primary text-white shadow-glow' : 
                    isCurrent ? 'bg-gradient-primary text-white shadow-glow animate-pulse-slow' : 
                    'bg-muted text-muted-foreground'}
                  ${isClickable ? 'hover:scale-105 hover-lift' : ''}
                `}>
                  {isCompleted ? (
                    <div className="animate-scale-in">
                      <Check className="h-6 w-6" />
                    </div>
                  ) : Icon ? (
                    <Icon className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                  
                  {/* Pulse ring for current step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75"></div>
                  )}
                </div>
                
                {/* Step Info */}
                <div className="mt-3 text-center max-w-[120px]">
                  <p className={`text-sm font-semibold transition-colors ${
                    isCurrent ? 'text-primary' : 
                    isCompleted ? 'text-success' : 
                    'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-8 relative">
                  <div className="absolute inset-0 bg-muted"></div>
                  <div 
                    className={`absolute inset-0 bg-gradient-primary transition-all duration-500 ${
                      isCompleted ? 'w-full' : 'w-0'
                    }`}
                    style={{
                      transitionDelay: isCompleted ? `${index * 100}ms` : '0ms'
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
