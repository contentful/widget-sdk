export interface ProductRatePlan {
  committed: boolean;
  contentfulProductId: string;
  customerType: 'Self-service' | 'Committed';
  internalName: string;
  name: string;
  price: number;
  productPlanType: 'space' | 'add_on';
  productRatePlanCharges: ProductRatePlanCharge[];
  productType: 'add_on' | 'on_demand';
  roleSet?: RoleSet;
  sys: {
    type: 'ProductRatePlan';
    id: string;
  };
  unavailabilityReasons?: UnavailabilityReason[];
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

interface ProductRatePlanCharge {
  chargeType: 'Recurring';
  model: 'PerUnit' | 'FlatFee';
  name: string;
  price: number;
  sys: {
    type: 'ProductRatePlanCharge';
    id: string;
  };
  tiers?: Tier[];
  unitType: string;
  uom: unknown;
}
