import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateCustomer } from '../../hooks/agent/useAgent';
import { agentService } from '../../services/agent/agentService';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import type { AddCustomerFormState, WizardStepId } from '../../types/addCustomer';
import { createEmptyForm } from '../../types/addCustomer';
import {
  buildCreatePayload,
  validateAll,
  validateStep,
} from '../../lib/agent/addCustomerUtils';
import { WizardStepper } from '../../components/agent/addCustomer/WizardUI';
import {
  DocumentsStep,
  EducationStep,
  FamilyStep,
  HoroscopeStep,
  LocationStep,
  PartnerStep,
  PersonalStep,
  RelationshipStep,
} from '../../components/agent/addCustomer/AddCustomerSteps';
import { ReviewStep } from '../../components/agent/addCustomer/ReviewStep';

const LAST_STEP = 8;

export default function AddCustomer() {
  const navigate = useNavigate();
  const createCustomer = useCreateCustomer();
  const agent = useAgentAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AddCustomerFormState>(createEmptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agentName = agent?.name || `${agent?.firstName || ''} ${agent?.lastName || ''}`.trim();

  const update = (patch: Partial<AddCustomerFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const updateNested =
    (key: keyof Pick<
      AddCustomerFormState,
      | 'personalDetails'
      | 'familyDetails'
      | 'educationDetails'
      | 'religionDetails'
      | 'partnerPreferences'
    >) =>
    (field: string, value: unknown) => {
      setForm((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: value },
      }));
    };

  const handleNext = () => {
    const stepErrors = validateStep(step as WizardStepId, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      toast.error('Please fix the highlighted fields before continuing.');
      return;
    }
    setStep((s) => Math.min(s + 1, LAST_STEP));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const allErrors = validateAll(form);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error('Please complete all required fields before submitting.');
      const firstInvalidStep = [0, 1, 2, 3, 4, 5, 6, 7].find(
        (s) => Object.keys(validateStep(s as WizardStepId, form)).length > 0,
      );
      if (firstInvalidStep != null) setStep(firstInvalidStep);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildCreatePayload(form);
      const customer = await createCustomer.mutateAsync(payload);

      const uploads: { type: Parameters<typeof agentService.uploadDocument>[1]; file: File }[] =
        [];
      if (form.profilePhoto) {
        uploads.push({ type: 'profile_photo', file: form.profilePhoto });
      }
      form.pendingDocuments.forEach((doc) => {
        uploads.push({ type: doc.type, file: doc.file });
      });

      if (uploads.length) {
        await Promise.all(
          uploads.map(({ type, file }) =>
            agentService.uploadDocument(customer.id, type, file),
          ),
        );
      }

      toast.success('Customer onboarded successfully');
      navigate('/agent/customers');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create customer';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    form,
    errors,
    update,
    updatePersonal: updateNested('personalDetails'),
    updateFamily: updateNested('familyDetails'),
    updateEducation: updateNested('educationDetails'),
    updateReligion: updateNested('religionDetails'),
    updatePartner: updateNested('partnerPreferences'),
    agentName,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-wow-text">Add Customer</h1>
        <p className="text-wow-muted mt-1">
          Complete onboarding wizard — capture the full customer profile in one go
        </p>
      </div>

      <WizardStepper currentStep={step} />

      <div className="space-y-6">
        {step === 0 && <PersonalStep {...stepProps} />}
        {step === 1 && <HoroscopeStep {...stepProps} />}
        {step === 2 && <RelationshipStep {...stepProps} />}
        {step === 3 && <LocationStep {...stepProps} />}
        {step === 4 && <FamilyStep {...stepProps} />}
        {step === 5 && <EducationStep {...stepProps} />}
        {step === 6 && <PartnerStep {...stepProps} />}
        {step === 7 && <DocumentsStep {...stepProps} />}
        {step === 8 && <ReviewStep form={form} agentName={agentName} onEdit={setStep} />}
      </div>

      <div className="flex justify-between items-center pt-2 pb-8">
        <button
          type="button"
          className="btn-secondary !py-2.5 !px-4 text-sm"
          disabled={step === 0 || isSubmitting}
          onClick={handleBack}
        >
          Back
        </button>

        {step < LAST_STEP ? (
          <button type="button" className="btn-primary !py-2.5 !px-4 text-sm" onClick={handleNext}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary !py-2.5 !px-6 text-sm"
            disabled={isSubmitting || createCustomer.isPending}
            onClick={handleSubmit}
          >
            {isSubmitting || createCustomer.isPending ? 'Submitting...' : 'Submit Customer'}
          </button>
        )}
      </div>
    </div>
  );
}
