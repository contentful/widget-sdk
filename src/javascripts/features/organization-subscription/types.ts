import type { Document } from '@contentful/rich-text-types';
import type { Asset, Entry } from 'contentful';
import type { Plan } from 'features/pricing-entities';

export enum BasePlanContentEntryIds {
  ENTERPRISE_TRIAL = '65ZcfrVyOZPGK0L7eSRul2',
  ENTERPRISE = 'G7TaplIVAIntn3QIDaSCd',
  FREE = 'iYmIKepKvlhOx78uwCvbi',
  SELF_SERVICE = '7y4ItLmbvc3ZGl0L8vtRPB',
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

export interface UsersMeta {
  numFree: number;
  numPaid: number;
  cost: number;
  hardLimit: number;
  unitPrice: number;
}
