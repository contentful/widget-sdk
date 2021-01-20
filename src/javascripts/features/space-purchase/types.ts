export type Assure<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface BillingDetails {
  address1: string;
  address2: string | null;
  city: string;
  country: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  zipCode: string;
  vat: string | null;
  state: string | null;
}

export interface PaymentDetails {
  number: string;
  expirationDate: {
    month: number;
    year: number;
  };
  type: string;
  sys: {
    id: string;
    type: 'CreditCardPaymentMethod';
  };
}

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
  roleSet: RoleSet | null;
  sys: {
    type: 'ProductRatePlan';
    id: string;
  };
  unavailabilityReasons: UnavailabilityReason[] | null;
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
  tiers: Tier[] | null;
  unitType: string;
  uom: unknown;
}
