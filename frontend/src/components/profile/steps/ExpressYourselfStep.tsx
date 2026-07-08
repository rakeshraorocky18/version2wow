import { EXPRESS_FIELDS, ExpressYourself, StepErrors } from '../../../types/profile';

interface ExpressYourselfStepProps {
  data: ExpressYourself;
  errors: StepErrors;
  onChange: (updates: Partial<ExpressYourself>) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function ExpressYourselfStep({ data, errors, onChange }: ExpressYourselfStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Express Yourself</h2>
        <p className="text-sm text-gray-500 mt-1">Share your personality and aspirations</p>
      </div>

      <div className="space-y-5">
        {EXPRESS_FIELDS.map(({ key, label, maxLength }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                {label}{key === 'aboutMe' ? ' *' : ''}
              </label>
              <span className={`text-xs ${data[key].length > maxLength ? 'text-red-500' : 'text-gray-400'}`}>
                {data[key].length}/{maxLength}
              </span>
            </div>
            <textarea
              value={data[key]}
              onChange={(e) => onChange({ [key]: e.target.value.slice(0, maxLength) })}
              className={`input-field min-h-[100px] resize-y ${errors[key] ? 'border-red-400' : ''}`}
              placeholder={`Write about ${label.toLowerCase()}...`}
              maxLength={maxLength}
            />
            <FieldError message={errors[key]} />
          </div>
        ))}
      </div>
    </div>
  );
}
