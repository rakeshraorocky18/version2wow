import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { useCreateCustomer } from '../../hooks/agent/useAgent';
import type { CreateCustomerPayload } from '../../types/agent';

const steps = ['Personal', 'Contact', 'Basic Profile', 'Review'];

const emptyForm: CreateCustomerPayload = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  religion: '',
  caste: '',
  motherTongue: '',
  occupation: '',
  education: '',
  status: 'pending',
};

export default function AddCustomer() {
  const navigate = useNavigate();
  const createCustomer = useCreateCustomer();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateCustomerPayload>(emptyForm);

  const update = (patch: Partial<CreateCustomerPayload>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const canNext = () => {
    if (step === 0) return !!form.firstName.trim();
    if (step === 1) return !!(form.phone || form.email);
    return true;
  };

  const handleSubmit = async () => {
    try {
      await createCustomer.mutateAsync(form);
      toast.success('Customer onboarded successfully');
      navigate('/agent/customers');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to create customer';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-wow-text">Add Customer</h1>
        <p className="text-wow-muted mt-1">Multi-step onboarding for a new lead</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < step
                  ? 'bg-wow-primary text-white'
                  : i === step
                    ? 'bg-wow-primary/15 text-wow-primary ring-2 ring-wow-primary'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-sm ${i === step ? 'text-wow-text font-medium' : 'text-wow-muted'}`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-wow-muted">First Name *</label>
                <input
                  className="input-field mt-1"
                  value={form.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-wow-muted">Last Name</label>
                <input
                  className="input-field mt-1"
                  value={form.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-wow-muted">Gender</label>
                <select
                  className="input-field mt-1"
                  value={form.gender}
                  onChange={(e) => update({ gender: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-wow-muted">Date of Birth</label>
                <input
                  type="date"
                  className="input-field mt-1"
                  value={form.dateOfBirth}
                  onChange={(e) => update({ dateOfBirth: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-wow-muted">Phone</label>
                <input
                  className="input-field mt-1"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-wow-muted">Email</label>
                <input
                  type="email"
                  className="input-field mt-1"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-wow-muted">Address</label>
              <textarea
                className="input-field mt-1 min-h-[100px]"
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                ['religion', 'Religion'],
                ['caste', 'Caste'],
                ['motherTongue', 'Mother Tongue'],
                ['occupation', 'Occupation'],
                ['education', 'Education'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-sm text-wow-muted">{label}</label>
                <input
                  className="input-field mt-1"
                  value={(form[key] as string) || ''}
                  onChange={(e) => update({ [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <p className="text-wow-muted">
              Review details. Saving will assign this customer to you automatically.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Name', `${form.firstName} ${form.lastName || ''}`.trim()],
                ['Gender', form.gender || '—'],
                ['DOB', form.dateOfBirth || '—'],
                ['Phone', form.phone || '—'],
                ['Email', form.email || '—'],
                ['Address', form.address || '—'],
                ['Religion', form.religion || '—'],
                ['Caste', form.caste || '—'],
                ['Mother Tongue', form.motherTongue || '—'],
                ['Occupation', form.occupation || '—'],
                ['Education', form.education || '—'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-wow-bg/70">
                  <dt className="text-xs text-wow-muted">{label}</dt>
                  <dd className="font-medium mt-0.5 capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            className="btn-secondary !py-2.5 !px-4 text-sm"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="btn-primary !py-2.5 !px-4 text-sm"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary !py-2.5 !px-4 text-sm"
              disabled={createCustomer.isPending}
              onClick={handleSubmit}
            >
              {createCustomer.isPending ? 'Saving...' : 'Save Customer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
