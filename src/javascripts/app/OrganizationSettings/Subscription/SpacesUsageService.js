import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { downloadBlob } from 'core/utils/downloadBlob';
const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

export const getSpacesUsage = (endpoint, query) => {
  return endpoint(
    {
      method: 'GET',
      path: ['spaces_usage'],
      query,
    },
    alphaHeader
  );
};

export const addMasterEnvironment = ({ usage, limit }) => ({
  usage: usage + 1,
  limit: limit + 1,
});

const exportCSV = (endpoint) => {
  return endpoint(
    {
      method: 'GET',
      path: ['spaces_usage', 'export'],
    },
    alphaHeader
  );
};

export const downloadSpacesUsage = async (orgId) => {
  const orgEndpoint = createOrganizationEndpoint(orgId);
  const csvString = await exportCSV(orgEndpoint);
  const blob = new window.Blob([csvString], { type: 'text/csv' });
  downloadBlob(blob, `spaces-usage-${orgId}.csv`);
};
