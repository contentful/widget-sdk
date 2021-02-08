import { Asset } from '@contentful/types';

import type { Organization, SpaceData } from 'core/services/SpaceEnvContext/types';
import type { ProductRatePlan } from 'features/pricing-entities';
import type { BillingDetails, PaymentDetails, SpaceProductRatePlan } from '../types';

export const NO_SPACE_PLAN = 'None';

export interface State {
  organization?: Organization;
  currentSpace?: SpaceData;
  currentSpaceRatePlan?: SpaceProductRatePlan;
  spaceRatePlans?: SpaceProductRatePlan[];
  subscriptionPlans?: unknown;
  selectedPlan?: SpaceProductRatePlan | 'None';
  selectedPlatform?: SelectedPlatform;
  sessionId?: string;
  paymentDetails?: PaymentDetails;
  billingDetails?: BillingDetails;
  spaceName?: string;
  selectedTemplate?: SelectedTemplate;
  purchasingApps?: boolean;
  composeProductRatePlan?: ProductRatePlan;
}

export interface SelectedPlatform {
  type: string;
  title: string;
  description: string;
  price?: number;
}

export interface SelectedTemplate {
  blank: boolean;
  description: string;
  descriptionV2: string;
  icon: Asset;
  image: Asset;
  name: string;
  order: number;
  previewSpaceApiKey: string;
  spaceApiKey: string;
  spaceId: string;
  svgName: string;
  sys: unknown;
  templateDeliveryApiKeys: string[];
}
