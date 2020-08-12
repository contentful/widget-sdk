import { createOrganizationEndpoint } from 'data/EndpointFactory';

export function getHostedPaymentParams(organizationId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  return endpoint({
    method: 'GET',
    path: ['hosted_payment_params'],
  });
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
