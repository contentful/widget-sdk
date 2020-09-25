import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { transformBillingDetails } from '../utils/transformBillingDetails';

export async function getBillingDetails(organizationId) {
  const endpoint = createOrganizationEndpoint(organizationId);

  const rawBillingDetails = await endpoint({
    method: 'GET',
    path: ['billing_details'],
  });

  return transformBillingDetails(rawBillingDetails);
}

export function createBillingDetails(organizationId, billingDetails) {
  const endpoint = createOrganizationEndpoint(organizationId);

  return endpoint({
    method: 'POST',
    path: ['billing_details'],
    data: billingDetails,
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
