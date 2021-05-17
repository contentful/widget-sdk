import moment from 'moment';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';
import type { OrganizationEndpoint } from 'data/CMA/types';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { downloadBlob } from 'core/utils/downloadBlob';

import type { SpaceUsage } from '../types';

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

interface GetSpaceUsageQuery {
  order: string;
  skip: number;
  limit: number;
}

interface GetSpaceUsageResponse {
  limit: number;
  skip: number;
  total: number;
  sys: {
    type: 'Array';
  };
  items: SpaceUsage[];
}

export function getSpacesUsage(
  endpoint: OrganizationEndpoint,
  query: GetSpaceUsageQuery
): Promise<GetSpaceUsageResponse> {
  return endpoint<GetSpaceUsageResponse>(
    {
      method: 'GET',
      path: ['spaces_usage'],
      query,
    },
    alphaHeader
  );
}

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
  const filename = `contentful-space-usage-${orgId}-${moment().format('YYYYMMDD')}.csv`;
  downloadBlob(blob, filename);
};
