import { createOrganizationEndpoint } from 'data/EndpointFactory';

export function getBillingDetails(organizationId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  return endpoint({
    method: 'GET',
    path: ['billing_details'],
  });
}

export async function getInvoices(organizationId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  const { items } = await endpoint({
    method: 'GET',
    path: ['invoices'],
  });

  return items;
}

export function getInvoice(organizationId, invoiceId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  return endpoint({
    method: 'GET',
    path: ['invoices', invoiceId],
  });
}
