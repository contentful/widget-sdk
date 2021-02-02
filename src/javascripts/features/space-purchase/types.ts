import type { ProductRatePlan } from 'features/pricing-entities';

export type SetRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface BillingDetails {
  address1: string;
  address2?: string;
  city: string;
  country: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  zipCode: string;
  vat?: string;
  state?: string;
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

export interface SpaceProductRatePlan extends ProductRatePlan {
  currentPlan: boolean;
  disabled: boolean;
  includedResources: unknown[];
  isFree: boolean;
}

// TODO: we should have a more generic interface
export interface FreeSpaceResource {
  limits: { included: number; maximum: number };
  name: 'Free space';
  parent?: unknown;
  period?: unknown;
  sys: {
    id: 'free_space';
    type: 'OrganizationResource';
  };
  unitOfMeasure?: unknown;
  usage: number;
}
