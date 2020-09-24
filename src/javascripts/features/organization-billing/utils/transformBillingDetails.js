export function transformBillingDetails(rawData) {
  const { firstName, lastName, vat, workEmail, address: addressData } = rawData;

  return {
    firstName,
    lastName,
    vat,
    workEmail,
    address1: addressData.address1,
    address2: addressData.address2,
    city: addressData.city,
    state: addressData.state,
    country: addressData.country,
    zipCode: addressData.zipCode,
  };
}
