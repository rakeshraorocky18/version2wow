import type { ReactNode } from 'react';
import { Check, Lock } from 'lucide-react';
import { WIZARD_STEPS } from '../../../types/addCustomer';

export function WizardStepper({
  currentStep,
  completedSteps = new Set<number>(),
  onStepSelect,
}: {
  currentStep: number;
  completedSteps?: Set<number>;
  onStepSelect?: (step: number) => void;
}) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-[#F2DFE8] bg-white shadow-sm lg:sticky lg:top-24">
      <div className="bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF] px-5 py-4">
        <h2 className="font-display text-xl font-bold text-[#5D2B44]">Add Customer</h2>
        <p className="mt-1 text-xs text-[#9A5776]">Complete required sections in order.</p>
      </div>
      <nav className="space-y-1 p-2">
        {WIZARD_STEPS.map((step, i) => {
          const canSelect = i <= currentStep || completedSteps.has(i);
          return (
          <button
            key={step.id}
            type="button"
            disabled={!canSelect}
            onClick={() => {
              if (canSelect) onStepSelect?.(i);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
              i === currentStep
                ? 'bg-[#B66A8A] text-white shadow-sm'
                : completedSteps.has(i)
                  ? 'bg-[#F5FFF8] text-[#3D8B5F]'
                  : i < currentStep
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-[#A98AA0] opacity-75'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                i === currentStep
                  ? 'bg-white/20'
                  : completedSteps.has(i)
                    ? 'bg-[#E8F8EF]'
                    : 'bg-[#F5F0F2]'
              }`}
            >
              {completedSteps.has(i) ? (
                <Check className="h-3.5 w-3.5" />
              ) : i > currentStep ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <span>{step.icon}</span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{step.label}</span>
          </button>
          );
        })}
      </nav>
    </aside>
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
      <label className="text-sm font-medium text-wow-text">
        {label}
        {required && <span className="text-red-500 ml-0.5 font-semibold">*</span>}
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
