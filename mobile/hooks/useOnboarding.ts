import { useLearningApplication } from '../providers/LearningProvider';

export function useOnboarding() {
  const { application, state } = useLearningApplication();
  return {
    status: state.status, profile: state.profile,
    campaigns: application.content.campaigns.map(({ id, title, companyId }) => ({ id, title, companyId })),
    loading: state.status === 'idle' || state.status === 'loading',
    submitting: state.submittingOnboarding, error: state.error,
    submit: application.submitOnboarding, retry: application.bootstrap,
  };
}
