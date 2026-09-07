import type { OnboardingProfile } from '../types/application';
import type { ContentCatalog } from '../types/content';

export function validateOnboarding(profile: OnboardingProfile, content: ContentCatalog): OnboardingProfile {
  const name = profile.name.trim();
  if (!name || name.length > 60) throw new Error('Enter a name between 1 and 60 characters.');
  if (![profile.dsaLevel, profile.aptitudeLevel].every(level => ['beginner', 'intermediate', 'advanced'].includes(level))) {
    throw new Error('Choose a DSA and aptitude level.');
  }
  if (!content.campaigns.some(campaign => campaign.id === profile.campaignId)) throw new Error('Choose an available campaign.');
  return { name, campaignId: profile.campaignId, dsaLevel: profile.dsaLevel, aptitudeLevel: profile.aptitudeLevel };
}
