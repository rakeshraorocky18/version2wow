import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import {
  useAgentCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from '../../hooks/agent/useAgent';
import { agentService } from '../../services/agent/agentService';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import type { AddCustomerFormState, WizardStepId } from '../../types/addCustomer';
import { createEmptyForm } from '../../types/addCustomer';
import {
  buildCreatePayload,
  formFromAgentCustomer,
  validateAll,
  validateStep,
} from '../../lib/agent/addCustomerUtils';
import { ErrorState, TableSkeleton } from '../../components/agent/AgentUI';
import { WizardStepper } from '../../components/agent/addCustomer/WizardUI';
import {
  EducationStep,
  FamilyStep,
  GalleryPhotosStep,
  HoroscopeStep,
  PartnerStep,
  PersonalStep,
  ReligionStep,
  RelationshipStep,
} from '../../components/agent/addCustomer/AddCustomerSteps';

const LAST_STEP = 7;

export default function AddCustomer() {
  const navigate = useNavigate();
  const { customerId = '' } = useParams();
  const isEditMode = Boolean(customerId);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(customerId);
  const customerQuery = useAgentCustomer(customerId);
  const agent = useAgentAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AddCustomerFormState>(createEmptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const editFormLoaded = useRef(false);

  const agentName = agent?.name || `${agent?.firstName || ''} ${agent?.lastName || ''}`.trim();

  useEffect(() => {
    if (!isEditMode || !customerQuery.data || editFormLoaded.current) return;
    setForm(formFromAgentCustomer(customerQuery.data));
    setCompletedSteps(new Set([0, 1, 2, 3, 4, 5, 6, 7]));
    editFormLoaded.current = true;
  }, [customerQuery.data, isEditMode]);

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
    setCompletedSteps((prev) => new Set(prev).add(step));
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
      const customer = isEditMode
        ? await updateCustomer.mutateAsync(payload)
        : await createCustomer.mutateAsync(payload);

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

      toast.success(isEditMode ? 'Customer updated successfully' : 'Customer onboarded successfully');
      navigate(isEditMode ? `/agent/customers/${customer.id}` : '/agent/customers');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (isEditMode ? 'Failed to update customer' : 'Failed to create customer');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && customerQuery.isLoading) return <TableSkeleton rows={8} />;
  if (isEditMode && (customerQuery.isError || !customerQuery.data)) {
    return <ErrorState message="Customer not found." />;
  }

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
    <div className="-mx-4 rounded-[32px] bg-gradient-to-br from-[#FFF0F5] via-[#F8F3FF] to-[#FFF5EF] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-[24px] border border-[#F2DFE8] bg-white/95 px-6 py-5 shadow-[0_12px_36px_rgba(44,38,48,0.08)]">
        <Link
          to="/agent/customers"
          className="mb-3 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-wow-primary hover:bg-[#FFF5F7]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
        <h1 className="font-display text-3xl text-wow-text">
          {isEditMode ? 'Edit Customer' : 'Add Customer'}
        </h1>
        <p className="mt-1 text-wow-muted">
          {isEditMode
            ? 'Update the customer using the same required sections and fields.'
            : 'Complete each required section to unlock the next slide.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <WizardStepper
          currentStep={step}
          completedSteps={completedSteps}
          onStepSelect={(nextStep) => {
            setErrors({});
            setStep(nextStep);
          }}
        />

        <div className="min-w-0 space-y-6">
          {step === 0 && <PersonalStep {...stepProps} />}
          {step === 1 && <ReligionStep {...stepProps} />}
          {step === 2 && <HoroscopeStep {...stepProps} />}
          {step === 3 && <RelationshipStep {...stepProps} />}
          {step === 4 && <FamilyStep {...stepProps} />}
          {step === 5 && <EducationStep {...stepProps} />}
          {step === 6 && <PartnerStep {...stepProps} />}
          {step === 7 && <GalleryPhotosStep {...stepProps} />}

          <div className="flex justify-between items-center pt-2 pb-8">
            {step > 0 ? (
              <button
                type="button"
                className="btn-secondary !py-2.5 !px-4 text-sm"
                disabled={isSubmitting}
                onClick={handleBack}
              >
                Back
              </button>
            ) : (
              <span />
            )}

            {step < LAST_STEP ? (
              <button type="button" className="btn-primary !py-2.5 !px-4 text-sm" onClick={handleNext}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary !py-2.5 !px-6 text-sm"
                disabled={isSubmitting || createCustomer.isPending || updateCustomer.isPending}
                onClick={handleSubmit}
              >
                {isSubmitting || createCustomer.isPending || updateCustomer.isPending
                  ? isEditMode ? 'Updating...' : 'Submitting...'
                  : isEditMode ? 'Update Customer' : 'Submit Customer'}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
