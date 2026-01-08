import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  validate?: (value: string | number) => string | null;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode; // For select options
  rows?: number; // For textarea
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  required = false,
  placeholder,
  error: externalError,
  validate,
  icon: Icon,
  disabled = false,
  className = '',
  children,
  rows = 3
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const error = externalError || internalError;
  const showError = touched && error;
  const showSuccess = touched && !error && value && !isFocused;

  useEffect(() => {
    if (touched && validate) {
      const validationError = validate(value);
      setInternalError(validationError);
    }
  }, [value, touched, validate]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(true);
    setIsFocused(false);
    if (validate) {
      const validationError = validate(value);
      setInternalError(validationError);
    }
    onBlur?.(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const getBorderColor = () => {
    if (showError) return 'border-error focus:border-error focus:ring-error/20';
    if (showSuccess) return 'border-success focus:border-success focus:ring-success/20';
    if (isFocused) return 'border-primary focus:border-primary focus:ring-primary/20';
    return 'border-border hover:border-primary/50';
  };

  const inputClasses = `w-full px-4 py-3 bg-background border-2 rounded-xl 
                       focus:ring-4 focus:outline-none
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${Icon ? 'pl-12' : ''}
                       ${showSuccess ? 'pr-12' : showError ? 'pr-12' : ''}
                       ${getBorderColor()}
                       ${className}`;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={inputClasses}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={required}
          disabled={disabled}
          className={inputClasses}
        >
          {children}
        </select>
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
      />
    );
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <label htmlFor={name} className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors">
            <Icon className={`h-5 w-5 ${
              showError ? 'text-error' : 
              showSuccess ? 'text-success' : 
              isFocused ? 'text-primary' : 
              'text-muted-foreground group-hover:text-primary'
            }`} />
          </div>
        )}
        
        {renderInput()}
        
        {showSuccess && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-scale-in">
            <div className="bg-success/10 rounded-full p-1">
              <Check className="h-5 w-5 text-success" />
            </div>
          </div>
        )}
        
        {showError && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-scale-in">
            <div className="bg-error/10 rounded-full p-1">
              <AlertCircle className="h-5 w-5 text-error" />
            </div>
          </div>
        )}
      </div>
      
      {showError && (
        <div className="flex items-center space-x-2 text-error animate-slide-down">
          <X className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      
      {showSuccess && !showError && (
        <div className="flex items-center space-x-2 text-success animate-slide-down">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Valide</span>
        </div>
      )}
    </div>
  );
}
