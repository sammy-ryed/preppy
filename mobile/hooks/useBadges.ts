import { getBadges } from '../domain/badges';
import { useLearningApplication } from '../providers/LearningProvider';

export function useBadges() {
  const { application, state } = useLearningApplication();
  return { badges: getBadges(state.progress, application.content), status: state.status,
    error: state.error, retry: application.refresh,
    storageKey: state.userId && state.progress ? `preppy:badge-popups:v1:${state.userId}:${state.progress.campaignId}` : null };
}
