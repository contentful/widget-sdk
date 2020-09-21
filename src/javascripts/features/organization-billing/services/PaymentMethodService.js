import { createOrganizationEndpoint } from 'data/EndpointFactory';

export function getHostedPaymentParams(organizationId, countryCode) {
  const endpoint = createOrganizationEndpoint(organizationId);

  const requestData = {
    method: 'GET',
    path: ['hosted_payment_params'],
  };

  if (countryCode) {
    requestData.query = {
      country_code: countryCode,
    };
  }

  return endpoint(requestData);
}

export function setDefaultPaymentMethod(organizationId, paymentMethodRefId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  return endpoint({
    method: 'PUT',
    path: ['default_payment_method'],
    data: {
      paymentMethodRefId,
    },
  });
}

export function getDefaultPaymentMethod(organizationId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  return endpoint({
    method: 'GET',
    path: ['default_payment_method'],
  });
}
