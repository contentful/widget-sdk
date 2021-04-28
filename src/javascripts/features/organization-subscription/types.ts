import type { Document } from '@contentful/rich-text-types';
import type { Asset, Entry } from 'contentful';
import type { Plan } from 'features/pricing-entities';

export interface BasePlanContent {
  title: string;
  colorAccent: Entry<{ name: string; value: string }>;
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
