import { map, sum, unzip } from 'lodash';
import { USAGE_INSIGHTS, getAlphaHeader } from 'alphaHeaders.js';
import * as EndpointFactory from 'data/EndpointFactory';

const headers = getAlphaHeader(USAGE_INSIGHTS);

/**
 * Gets the usage periods
 * @param  {OrganizationEndpoint} endpoint
 * @return {Promise}
 */
export const getPeriods = (endpoint) =>
  endpoint(
    {
      method: 'GET',
      path: ['usage_periods'],
    },
    headers
  );

/**
 * Return organization usage by API type given a date range.
 *
 * @param  {OrganizationEndpoint} endpoint - Usage endpoint
 * @param  {Object} query - Search and/or filter parameters
 * @param  {string} query.startDate - Beginning of search period in yyyy-mm-dd format
 * @param  {string} query.endDate - End of search period in yyyy-mm-dd format
 * @return {Promise}
 */
export const getOrgUsage = (endpoint, { startDate, endDate }) =>
  endpoint({
    method: 'GET',
    path: ['organization_periodic_usages'],
    query: {
      'metric[in]': ['cpa', 'cda', 'cma', 'gql'],
      'dateRange.startAt': startDate,
      'dateRange.endAt': endDate ?? '',
    },
  });

/**
 * Return organization usage by API type given a date range.
 * Available api types are cma, cpa, cda, gql.
 *
 * @param  {OrganizationEndpoint} endpoint - Usage endpoint
 * @param  {Object} query - Search and/or filter parameters
 * @param  {string} query.startDate - Beginning of search period in yyyy-mm-dd format
 * @param  {string} query.endDate - End of search period in yyyy-mm-dd format
 * @param  {string} query.apiType - One of cma, cpa, cda, gql
 * @return {Promise}
 */
export const getApiUsage = (endpoint, { apiType, startDate, endDate, limit }) =>
  endpoint({
    method: 'GET',
    path: ['space_periodic_usages'],
    query: {
      'metric[in]': apiType,
      'dateRange.startAt': startDate,
      'dateRange.endAt': endDate ?? '',
      limit,
    },
  });

export const extractValues = (api) => ({
  ...api,
  usage: Object.values(api.usagePerDay),
});

export const transformApi = (apis) =>
  apis.reduce(
    (acc, { type, api }) => ({
      ...acc,
      [type]: { ...api, items: api.items.map(extractValues) },
    }),
    {}
  );

export const transformOrg = (org) => {
  const newOrg = org.items.reduce(
    (acc, api) => ({
      ...acc,
      [api.metric]: Object.values(api.usagePerDay),
    }),
    {}
  );

  return map(unzip(Object.values(newOrg)), sum);
};

export const mapResponseToState = ({ org, cma, cda, cpa, gql }) => ({
  periodicUsage: {
    org: { usage: transformOrg(org) },
    apis: transformApi([
      { type: 'cma', api: cma },
      { type: 'cda', api: cda },
      { type: 'cpa', api: cpa },
      { type: 'gql', api: gql },
    ]),
  },
});

export const loadPeriodData = async (orgId, period) => {
  const endpoint = EndpointFactory.createOrganizationEndpoint(orgId);
  const promises = [
    getOrgUsage(endpoint, {
      startDate: period.startDate,
      endDate: period.endDate,
    }),
    ...['cma', 'cda', 'cpa', 'gql'].map((apiType) =>
      getApiUsage(endpoint, {
        apiType,
        startDate: period.startDate,
        endDate: period.endDate,
        limit: 5,
      })
    ),
  ];

  const [org, cma, cda, cpa, gql] = await Promise.all(promises);

  return { org, cma, cda, cpa, gql };
};
