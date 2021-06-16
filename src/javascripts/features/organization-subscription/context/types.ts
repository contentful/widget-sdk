import type { SpacePlan } from '../types';
import type { BasePlan, AddOnPlan } from 'features/pricing-entities';

export interface OrgSubscriptionState {
  spacePlans: SpacePlan[];
  basePlan?: BasePlan;
  addOnPlans: AddOnPlan[];
  numMemberships?: number;
}
