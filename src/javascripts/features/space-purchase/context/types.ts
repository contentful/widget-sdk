import type { Organization, SpaceData } from 'core/services/SpaceEnvContext/types';
import type { ProductRatePlan, BillingDetails, PaymentDetails } from '../types';

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
  selectedTemplate?: unknown | null;
  purchasingApps?: boolean;
  composeProductRatePlan?: ProductRatePlan;
}

export interface SelectedPlatform {
  type: string;
  title: string;
  description: string;
  price?: number;
}
