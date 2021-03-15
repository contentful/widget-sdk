import { Asset } from '@contentful/types';

import type { Organization } from 'core/services/SpaceEnvContext/types';
import type { ProductRatePlan } from 'features/pricing-entities';
import type { BillingDetails, PaymentDetails, SpaceProductRatePlan } from '../types';

export const NO_SPACE_PLAN = 'None';

export interface State {
  organization?: Organization;
  currentSpace?: Space;
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
  composeAndLaunchProductRatePlan?: ProductRatePlan;
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

/*
  TODO(jo-sm): Move these somewhere else -- but, where would they belong? The interface for Space
  here (from `/spaces/:id`) is not the same as the interface for a TokenStore Space, and is not the
  same as Space from `@contentful/types`.
 */

interface Link<T> {
  sys: {
    type: 'Link';
    linkType: T;
    id: string;
  };
}

export interface Space {
  name: string;
  sys: {
    type: 'Space';
    id: string;
    version: number;
    createdBy: Link<'User'>;
    createdAt: string;
    updatedBy: Link<'User'>;
    updatedAt: string;
    organization: Link<'Organization'>;
  };
}
