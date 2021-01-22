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
