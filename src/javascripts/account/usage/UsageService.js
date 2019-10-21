const headers = {
  'x-contentful-enable-alpha-feature': 'usage-insights'
};

/**
 * Gets the usage periods
 * @param  {OrganizationEndpoint} endpoint
 * @return {Promise}
 */
export const getPeriods = endpoint =>
  endpoint(
    {
      method: 'GET',
      path: ['usage_periods']
    },
    headers
  );

/**
 * Given a `periodId`, returns the organization usage
 * (the overall API usage) per day, split by API
 * (CDA, CMA, CPA).
 * @param  {OrganizationEndpoint} endpoint
 * @param  {number} periodId Integer period id
 * @return {Promise}
 */
export const getOrgUsage = (endpoint, periodId) =>
  endpoint(
    {
      method: 'GET',
      path: ['usages', 'organization'],
      query: {
        'filters[metric]': 'allApis',
        'filters[usagePeriod]': periodId
      }
    },
    headers
  );

/**
 * Given a `periodId` and `api`, returns the API
 * usage for a given API for a given period.
 * @param  {OrganizationEndpoint} endpoint
 * @param  {number} periodId Integer period id
 * @param  {string} api      The API ('cda', 'cma', 'cpa')
 * @return {Promise}
 */
export const getApiUsage = (endpoint, periodId, api) =>
  endpoint(
    {
      method: 'GET',
      path: ['usages', 'space'],
      query: {
        'filters[metric]': api,
        'filters[usagePeriod]': periodId,
        'orderBy[metricUsage]': 'desc',
        limit: 3
      }
    },
    headers
  );
