import { Tier } from './Shared';

export interface Plan {
  committed: boolean;
  contentfulProductId?: string;
  customerType: 'Self-service';
  gatekeeperKey?: string;
  name: string;
  planType: 'base' | 'space';
  price: number;
  productName: string;
  productRatePlanId: string;
  ratePlanCharges: RatePlanCharge[];
  sys: {
    type: 'Plan';
    id: string;
  };
}

export interface BasePlan extends Plan {
  planType: 'base';
}

export interface SpacePlan extends Plan {
  planType: 'space';
}

interface RatePlanCharge {
  model: 'PerUnit' | 'FlatFee';
  name: string;
  number: string;
  price: number;
  ratePlanChargeType: 'Recurring';
  tiers: Tier[];
  unitType: 'limit' | 'charge';
  uom?: string;
  sys: {
    type: 'RatePlanCharge';
    id: string;
  };
}
