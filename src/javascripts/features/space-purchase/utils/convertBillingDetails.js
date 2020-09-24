export function createBillingDetailsForAPI(billingDetails, refId) {
  return {
    refid: refId,
    firstName: billingDetails.firstName,
    lastName: billingDetails.lastName,
    vat: billingDetails.vatNumber,
    workEmail: billingDetails.email,
    address1: billingDetails.address,
    address2: billingDetails.addressTwo,
    city: billingDetails.city,
    state: billingDetails.state,
    country: billingDetails.country,
    zipCode: billingDetails.postcode,
  };
}

export function convertBillingDetailsFromAPI(billingDetails) {
  return {
    firstName: billingDetails.firstName,
    lastName: billingDetails.lastName,
    email: billingDetails.workEmail,
    vatNumber: billingDetails.vat,
    address: billingDetails.address.address1,
    addressTwo: billingDetails.address.address2,
    city: billingDetails.address.city,
    state: billingDetails.address.state,
    country: billingDetails.address.country,
    postcode: billingDetails.address.zipCode,
  };
}
