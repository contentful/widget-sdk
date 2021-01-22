export interface ProductRatePlan {
  committed: boolean;
  contentfulProductId?: string;
  customerType: 'Self-service' | 'Committed';
  internalName: string;
  name: string;
  price: number;
  productPlanType: 'space' | 'add_on' | 'free_space';
  productRatePlanCharges: ProductRatePlanCharge[];
  productType: 'add_on' | 'on_demand';
  roleSet?: RoleSet;
  sys: {
    type: 'ProductRatePlan';
    id: string;
  };
  unavailabilityReasons?: UnavailabilityReason[];
}

export interface SpaceProductRatePlan extends ProductRatePlan {
  productPlanType: 'space';
}

export interface AddOnProductRatePlan extends ProductRatePlan {
  productPlanType: 'add_on';
}

interface RoleSet {
  id: string;
  roles: string[];
}

interface UnavailabilityReason {
  type: string;
  additionalInfo: string;
}

interface Tier {
  tier: number;
  price: number;
  startingUnit: number;
  endingUnit: number;
  priceFormat: 'FlatFee';
}

export interface ProductRatePlanCharge {
  chargeType: 'Recurring';
  model: 'PerUnit' | 'FlatFee' | 'Tiered';
  name: string;
  price?: number;
  sys: {
    type: 'ProductRatePlanCharge';
    id: string;
  };
  tiers?: Tier[];
  unitType: string;
  uom: unknown;
}

export interface BasePlan {
  committed: boolean;
  contentfulProductId?: string;
  customerType: 'Self-service';
  gatekeeperKey?: string;
  name: string;
  planType: 'base';
  price: number;
  productName: string;
  productRatePlanId: string;
  ratePlanCharges: ProductRatePlanCharge[];
}
