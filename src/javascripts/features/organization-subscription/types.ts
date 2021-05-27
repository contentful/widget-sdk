import type { Document } from '@contentful/rich-text-types';
import type { Asset, Entry } from 'contentful';
import type { Plan } from 'features/pricing-entities';

export enum BasePlanContentEntryIds {
  ENTERPRISE_TRIAL = '65ZcfrVyOZPGK0L7eSRul2',
  ENTERPRISE = 'G7TaplIVAIntn3QIDaSCd',
  FREE = 'iYmIKepKvlhOx78uwCvbi',
  SELF_SERVICE = '7y4ItLmbvc3ZGl0L8vtRPB',
  PARTNER = '1yLj8Jf230tq5EeIZTOd2s',
  CONTENTFUL_INTERNAL = '3YBpWXJz3frEPct4Szjkoc',
  PRO_BONO = '6l6Ze57xFcDn4gAgYkXdar',
}

export interface BasePlanContent {
  title: string;
  colorAccent?: Entry<{ name: string; value: string }>;
  description: Document;
  illustration: Asset;
}

export interface SpacePlan extends Plan {
  planType: 'space' | 'free_space';
  space?: {
    name: string;
    isAccessible: boolean;
    sys: {
      type: 'Space';
      id: string;
    };
  };
}

export interface LineItem {
  name: string;
  price: number;
}

export interface SubscriptionCosts {
  total: number;
  lineItems: LineItem[];
}

export interface UsersMeta {
  numFree: number;
  numPaid: number;
  cost: number;
  hardLimit: number;
  unitPrice: number;
}

export interface SpaceUsage {
  locales: {
    usage: number;
    limit: number;
    utilization: number;
  };
  roles: {
    usage: number;
    limit: number;
    utilization: number;
  };
  environments: {
    usage: number;
    limit: number;
    utilization: number;
  };
  records: {
    usage: number;
    limit: number;
    utilization: number;
  };
  contentTypes: {
    usage: number;
    limit: number;
    utilization: number;
  };
  spaceTrialPeriodEndsAt: null;
  sys: {
    type: 'SpaceUsage';
    id: string;
    space: {
      sys: {
        type: 'Link';
        linkType: 'Space';
        id: string;
      };
    };
  };
}
