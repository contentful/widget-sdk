const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'usage-insights'
};

const getPeriods = endpoint =>
  endpoint(
    {
      method: 'GET',
      path: ['usage_periods']
    },
    alphaHeader
  );

const getOrgUsage = (endpoint, periodId) =>
  endpoint(
    {
      method: 'GET',
      path: ['usages', 'organization'],
      query: {
        'filters[resourceType]': 'allApis',
        'filters[usagePeriod]': periodId
      }
    },
    alphaHeader
  );

const getApiUsage = (endpoint, periodId, api) =>
  endpoint(
    {
      method: 'GET',
      path: ['usages', 'space'],
      query: {
        'filters[resourceType]': api,
        'filters[usagePeriod]': periodId,
        'orderBy[resourceTypeUsage]': 'desc',
        limit: 3
      }
    },
    alphaHeader
  );

export { getPeriods, getOrgUsage, getApiUsage };
