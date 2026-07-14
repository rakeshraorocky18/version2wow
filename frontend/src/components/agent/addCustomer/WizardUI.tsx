import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '../../../types/addCustomer';

export function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-2 min-w-max">
        {WIZARD_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i < currentStep
                  ? 'bg-wow-primary text-white'
                  : i === currentStep
                    ? 'bg-wow-primary/15 text-wow-primary ring-2 ring-wow-primary'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : <span>{step.icon}</span>}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === currentStep ? 'text-wow-text font-medium' : 'text-wow-muted'
              }`}
            >
              {step.label}
            </span>
            {i < WIZARD_STEPS.length - 1 && (
              <div className="w-6 sm:w-10 h-px bg-gray-200 mx-1" />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-wow-muted mt-3 sm:hidden">
        Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep]?.title}
      </p>
    </div>
  );
}

export function WizardSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(182, 106, 138, 0.08)' }}
    >
      <div className="mb-6">
        <h2 className="font-display text-xl text-wow-text flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        {subtitle && <p className="text-sm text-wow-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function FormField({
  label,
  required,
  error,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="text-sm text-wow-muted">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function FormInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      className={`input-field ${className}`}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FormSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function FormTextarea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="input-field min-h-[100px]"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FormGrid({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>{children}</div>
  );
}

export function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-gray-100 p-6 bg-wow-bg/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-wow-text">{title}</h3>
        <button
          type="button"
          className="text-sm text-wow-primary hover:underline"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-xs text-wow-muted">{label}</dt>
      <dd className="text-sm font-medium text-wow-text mt-0.5 capitalize">{value || '—'}</dd>
    </div>
  );
}
