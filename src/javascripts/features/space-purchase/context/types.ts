import type { Organization, SpaceData } from 'core/services/SpaceEnvContext/types';
import type { BillingDetails, PaymentDetails } from '../types';
import type { ProductRatePlan } from 'features/pricing-entities';

export interface State {
  organization?: Organization;
  currentSpace?: SpaceData;
  currentSpaceRatePlan?: unknown;
  spaceRatePlans?: unknown[];
  subscriptionPlans?: unknown;
  selectedPlan?: unknown;
  selectedPlatform?: SelectedPlatform;
  sessionId?: string;
  paymentDetails?: PaymentDetails;
  billingDetails?: BillingDetails;
  spaceName?: string;
  selectedTemplate?: unknown;
  purchasingApps?: boolean;
  composeProductRatePlan?: ProductRatePlan;
}

export interface SelectedPlatform {
  type: string;
  title: string;
  description: string;
  price?: number;
}
