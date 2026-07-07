import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  WizardProfile,
  createEmptyProfile,
  StepErrors,
} from '../types/profile';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  profileFromApi,
  calculateCompletion,
  validateStep,
  validateAll,
  buildSavePayload,
} from '../lib/profileUtils';

export function useProfileWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const topRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<WizardProfile>(createEmptyProfile);
  const [errors, setErrors] = useState<StepErrors>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [initialized, setInitialized] = useState(false);

  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users/profile');
        return data;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (initialized) return;
    const draft = loadDraft();
    if (existingProfile) {
      setProfile(profileFromApi(existingProfile));
      if (draft?.currentStep) setCurrentStep(draft.currentStep);
    } else if (draft) {
      setProfile((prev) => ({
        ...prev,
        ...draft,
        profilePhoto: null,
        resumeFile: null,
      }));
      if (draft.currentStep) setCurrentStep(draft.currentStep);
    }
    setInitialized(true);
  }, [existingProfile, initialized]);

  useEffect(() => {
    if (!initialized) return;
    saveDraft(profile, currentStep);
  }, [profile, currentStep, initialized]);

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updatePersonalDetails = useCallback((updates: Partial<WizardProfile['personalDetails']>) => {
    setProfile((p) => ({ ...p, personalDetails: { ...p.personalDetails, ...updates } }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const updateExperience = useCallback((updates: Partial<WizardProfile['experience']>) => {
    setProfile((p) => ({ ...p, experience: { ...p.experience, ...updates } }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const updateExpressYourself = useCallback((updates: Partial<WizardProfile['expressYourself']>) => {
    setProfile((p) => ({ ...p, expressYourself: { ...p.expressYourself, ...updates } }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const setProfilePhoto = useCallback((file: File | null) => {
    setProfile((p) => {
      if (p.profilePhotoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(p.profilePhotoPreview);
      }
      if (!file) {
        return { ...p, profilePhoto: null, profilePhotoPreview: '', existingPhotoUrl: '' };
      }
      return {
        ...p,
        profilePhoto: file,
        profilePhotoPreview: URL.createObjectURL(file),
      };
    });
  }, []);

  const setResumeFile = useCallback((file: File | null) => {
    setProfile((p) => ({ ...p, resumeFile: file }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setDirection(step > currentStep ? 'forward' : 'backward');
    setCurrentStep(step);
    setErrors({});
    scrollToTop();
  }, [currentStep, scrollToTop]);

  const nextStep = useCallback(() => {
    const stepErrors = validateStep(currentStep, profile);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error('Please fix the errors before continuing');
      return false;
    }
    if (currentStep < 6) {
      setDirection('forward');
      setCurrentStep((s) => s + 1);
      setErrors({});
      scrollToTop();
    }
    return true;
  }, [currentStep, profile, scrollToTop]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep((s) => s - 1);
      setErrors({});
      scrollToTop();
    }
  }, [currentStep, scrollToTop]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const allErrors = validateAll(profile);
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        throw new Error('Please complete all required fields');
      }

      const formData = new FormData();
      formData.append('profile', JSON.stringify(buildSavePayload(profile)));
      if (profile.profilePhoto) {
        formData.append('profilePhoto', profile.profilePhoto);
      }
      if (profile.resumeFile) {
        formData.append('resume', profile.resumeFile);
      }

      const { data } = await api.post('/users/wizard-profile', formData);
      return data;
    },
    onSuccess: (data) => {
      clearDraft();
      queryClient.setQueryData(['myProfile'], data);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Profile saved successfully!');
      navigate('/app/profile');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      if (message !== 'Please complete all required fields') {
        toast.error(message);
      } else {
        toast.error(message);
      }
    },
  });

  const completion = calculateCompletion(profile);

  return {
    topRef,
    currentStep,
    profile,
    setProfile,
    errors,
    direction,
    isLoading: isLoading && !initialized,
    completion,
    updatePersonalDetails,
    updateExperience,
    updateExpressYourself,
    setProfilePhoto,
    setResumeFile,
    goToStep,
    nextStep,
    prevStep,
    saveProfile,
  };
}
