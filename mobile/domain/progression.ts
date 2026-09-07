import type { Campaign, Requirement } from '../types/content';
import type { CheckpointStatus, NodeStatus, ProgressSnapshot } from '../types/learning';

// Content must pass validateContent before use. This function performs no writes.
export function getCampaignProgress(campaign: Campaign, progress: ProgressSnapshot) {
  if (campaign.id !== progress.campaignId || campaign.version !== progress.campaignVersion) {
    throw new Error('Campaign identity/version mismatch');
  }
  const completed = new Set(progress.completedNodeIds);
  const savedCheckpoints = new Map(progress.checkpoints.map(checkpoint => [checkpoint.checkpointId, checkpoint.status]));
  if (completed.size !== progress.completedNodeIds.length || savedCheckpoints.size !== progress.checkpoints.length) {
    throw new Error('Duplicate progress records');
  }
  for (const id of completed) {
    if (!campaign.nodes.some(node => node.id === id)) throw new Error(`Unknown completed node ${id}`);
  }
  for (const [id, status] of savedCheckpoints) {
    const checkpoint = campaign.checkpoints.find(item => item.id === id);
    if (!checkpoint) throw new Error(`Unknown checkpoint ${id}`);
    if (status === 'skipped' && !checkpoint.canSkip) throw new Error(`Checkpoint ${id} cannot be skipped`);
  }
  const requirementsMet = (requirements: readonly Requirement[]) => requirements.every(requirement => {
    if (requirement.type === 'node_completed') return completed.has(requirement.nodeId);
    const status = savedCheckpoints.get(requirement.checkpointId);
    return status === 'completed' || status === 'skipped';
  });
  // Reject impossible snapshots rather than rendering unlocks from corrupt state.
  for (const node of campaign.nodes) {
    if (completed.has(node.id) && !requirementsMet(node.prerequisites)) throw new Error(`Unmet prerequisites for completed node ${node.id}`);
  }
  for (const checkpoint of campaign.checkpoints) {
    if (savedCheckpoints.has(checkpoint.id) && !requirementsMet(checkpoint.prerequisites)) {
      throw new Error(`Unmet prerequisites for checkpoint ${checkpoint.id}`);
    }
  }
  const nodes = [...campaign.nodes].sort((a, b) => a.order - b.order).map(node => ({
    ...node,
    status: (completed.has(node.id) ? 'completed' : requirementsMet(node.prerequisites) ? 'available' : 'locked') as NodeStatus,
  }));
  const checkpoints = campaign.checkpoints.map(checkpoint => {
    const saved = savedCheckpoints.get(checkpoint.id);
    const status: CheckpointStatus = saved === 'completed' || saved === 'skipped' ? saved
      : requirementsMet(checkpoint.prerequisites) ? 'available' : 'locked';
    return { ...checkpoint, status };
  });
  return {
    campaignId: campaign.id,
    nodes,
    checkpoints,
    currentNodeId: nodes.find(node => node.status === 'available')?.id ?? null,
    educationCompleted: nodes.every(node => node.status === 'completed'),
  };
}
