import { Tier } from './Shared';

export enum PlanCustomerType {
  SELF_SERVICE = 'Self-service',
  ENTERPRISE = 'Enterprise',
  ENTERPRISE_TRIAL = 'Enterprise Trial',
  ENTERPRISE_HIGH_DEMAND = 'Enterprise High Demand',
  FREE = 'Free',
  PARTNER_PLATFORM_BASE_PLAN_NAME = 'Partner Platform',
  TRIAL_SPACE_FREE_SPACE_PLAN_NAME = 'Trial Space',
  POC_FREE_SPACE_PLAN_NAME = 'Proof of Concept',
}

export interface Plan {
  committed: boolean;
  contentfulProductId?: string;
  customerType: PlanCustomerType;
  gatekeeperKey?: string;
  name: string;
  planType: 'base' | 'space' | 'free_space';
  price: number;
  productName: string;
  productRatePlanId: string;
  ratePlanCharges: RatePlanCharge[];
  sys: {
    type: 'Plan' | 'Space';
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
