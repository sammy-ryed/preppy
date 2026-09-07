import { getCampaignProgress } from '../domain/progression';
import { nodeStars } from '../domain/nodeStars';
import { toProgressSnapshot } from '../services/learningService';
import { useLearningApplication } from '../providers/LearningProvider';

export function useCampaignProgress() {
  const { application, state } = useLearningApplication();
  const campaign = application.content.campaigns.find(item => item.id === state.profile?.campaignId) ?? null;
  const progress = campaign && state.progress ? getCampaignProgress(campaign, toProgressSnapshot(state.progress)) : null;
  return {
    status: state.status, campaign, xp: state.progress?.xp ?? 0,
    nodes: progress?.nodes.map(node => ({ ...node,
      stars: nodeStars(state.progress?.nodeResults[node.id]?.performance.score),
    })) ?? [], checkpoints: progress?.checkpoints ?? [],
    currentNodeId: progress?.currentNodeId ?? null, educationCompleted: progress?.educationCompleted ?? false,
    loading: state.status === 'idle' || state.status === 'loading', error: state.error, retry: application.refresh,
  };
}
