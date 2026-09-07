import { learningContent } from '../data/learningContent';
import { getSupabase } from '../lib/supabase';
import { createSupabaseProgressRepository } from '../repositories/supabaseProgressRepository';
import { createLearningService } from './learningService';
import { ensureAnonymousUser } from './authService';
import type { LearningBackend, OnboardingProfile } from '../types/application';
import { validateOnboarding } from '../domain/onboarding';

export function getLearningService() {
  return createLearningService(learningContent, createSupabaseProgressRepository(getSupabase()));
}

export async function connectLearningBackend(): Promise<LearningBackend> {
  const userId = await ensureAnonymousUser();
  const client = getSupabase();
  return {
    userId, learningService: getLearningService(),
    async readProfile() {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      if (data.user.id !== userId) throw new Error('The signed-in user changed. Restart PREPPY.');
      const profile: unknown = data.user.user_metadata.preppy_profile;
      if (profile === undefined || profile === null) return null;
      if (typeof profile !== 'object' || !('name' in profile) || typeof profile.name !== 'string'
        || !('campaignId' in profile) || typeof profile.campaignId !== 'string'
        || !('dsaLevel' in profile) || !('aptitudeLevel' in profile)) throw new Error('The saved onboarding profile is invalid.');
      return validateOnboarding(profile as OnboardingProfile, learningContent);
    },
    async saveProfile(profile) {
      const normalized = validateOnboarding(profile, learningContent);
      const { error } = await client.auth.updateUser({ data: { preppy_profile: normalized } });
      if (error) throw error;
    },
  };
}
