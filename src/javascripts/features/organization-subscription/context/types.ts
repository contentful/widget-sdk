import type { SpacePlan } from '../types';
import type { BasePlan, AddOnProductRatePlan } from 'features/pricing-entities';

export interface OrgSubscriptionState {
  spacePlans: SpacePlan[];
  basePlan?: BasePlan;
  addOnPlans: AddOnProductRatePlan[];
  numMemberships?: number;
}
