import { defaultHeader, defaultOrgId, defaultSpaceId, defaultUserId } from '../util/requests';

const getUsagePeriodsInteraction = 'get_usage_periods';
const getOrganizationPeriodicUsagesInteraction = 'query_organization_periodic_usages';
const getSpacePeriodicUsagesCmaInteraction = 'query_space_periodic_usages_cma';
const getSpacePeriodicUsagesCdaInteraction = 'query_space_periodic_usages_cda';
const getSpacePeriodicUsagesCpaInteraction = 'query_space_periodic_usages_cpa';
const getSpacePeriodicUsagesGqlInteraction = 'query_space_periodic_usages_gql';
const getAllSpacesInteraction = 'query_all_spaces';

const organizationPeriodicUsagesResponse = require('../fixtures/responses/organization-periodic-usages.json');
const empty = require('../fixtures/responses/empty.json');

export const getUsagePeriods = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: 'the default usage periods',
      uponReceiving: `a request to get the usage periods`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/usage_periods`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: {
          total: 1,
          sys: {
            type: 'Array',
          },
          items: [
            {
              startDate: '2020-06-25',
              endDate: null,
              sys: {
                type: 'UsagePeriod',
                id: '1',
              },
            },
          ],
        },
      },
    }).as(getUsagePeriodsInteraction);

    return `@${getUsagePeriodsInteraction}`;
  },
};

export const getOrganizationPeriodicUsages = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: 'some organization periodic usages',
      uponReceiving: `a request to get organization periodic usage`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/organization_periodic_usages`,
        headers: defaultHeader,
        query: {
          'dateRange.endAt': '',
          'dateRange.startAt': '2020-06-25',
          'metric[in]': 'cpa,cda,cma,gql',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: organizationPeriodicUsagesResponse,
      },
    }).as(getOrganizationPeriodicUsagesInteraction);

    return `@${getOrganizationPeriodicUsagesInteraction}`;
  },
};

const generateSpacePeriodicUsagesQuery = (apiType: string) => ({
  'dateRange.endAt': '',
  'dateRange.startAt': '2020-06-25',
  limit: '5',
  'metric[in]': apiType,
});

const generateSpacePeriodicUsagesResponse = (apiType: string, usage: number) => ({
  total: 2,
  limit: 5,
  skip: 0,
  sys: {
    type: 'Array',
  },
  items: [
    {
      metric: apiType,
      usage: usage,
      usagePerDay: {
        '2020-06-25': usage,
        '2020-06-26': 0,
      },
      unitOfMeasure: 'apiRequestsCount',
      sys: {
        type: 'SpacePeriodicUsage',
        id: 'usage-cma-8pzzb1oqr0h3-2020-06-25-2020-08-08',
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: defaultSpaceId,
          },
        },
      },
      dateRange: {
        startAt: '2020-06-25',
        endAt: '2020-08-08',
      },
    },
    {
      metric: apiType,
      usage: 0,
      usagePerDay: {
        '2020-06-25': 0,
        '2020-06-26': 0,
      },
      unitOfMeasure: 'apiRequestsCount',
      sys: {
        type: 'SpacePeriodicUsage',
        id: 'usage-cma-trw12qwpa9lm-2020-06-25-2020-08-08',
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'trw12qwpa9lm', // deleted space
          },
        },
      },
      dateRange: {
        startAt: '2020-06-25',
        endAt: '2020-08-08',
      },
    },
  ],
});

export const getSpacePeriodicUsages = {
  willReturnCmaUsage() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: '40 cma usage',
      uponReceiving: `a request to get space periodic cma usages`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/space_periodic_usages`,
        headers: defaultHeader,
        query: generateSpacePeriodicUsagesQuery('cma'),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: generateSpacePeriodicUsagesResponse('cma', 40),
      },
    }).as(getSpacePeriodicUsagesCmaInteraction);

    return `@${getSpacePeriodicUsagesCmaInteraction}`;
  },
  willReturnCdaUsage() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: '0 cda usage',
      uponReceiving: `a request to get space periodic cda usages`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/space_periodic_usages`,
        headers: defaultHeader,
        query: generateSpacePeriodicUsagesQuery('cda'),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: generateSpacePeriodicUsagesResponse('cda', 0),
      },
    }).as(getSpacePeriodicUsagesCdaInteraction);

    return `@${getSpacePeriodicUsagesCdaInteraction}`;
  },
  willReturnCpaUsage() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: '0 cpa usage',
      uponReceiving: `a request to get space periodic cpa usages`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/space_periodic_usages`,
        headers: defaultHeader,
        query: generateSpacePeriodicUsagesQuery('cpa'),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: generateSpacePeriodicUsagesResponse('cpa', 0),
      },
    }).as(getSpacePeriodicUsagesCpaInteraction);

    return `@${getSpacePeriodicUsagesCpaInteraction}`;
  },
  willReturnGqlUsage() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: '0 gql usage',
      uponReceiving: `a request to get space periodic gql usages`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/space_periodic_usages`,
        headers: defaultHeader,
        query: generateSpacePeriodicUsagesQuery('gql'),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: generateSpacePeriodicUsagesResponse('gql', 0),
      },
    }).as(getSpacePeriodicUsagesGqlInteraction);

    return `@${getSpacePeriodicUsagesGqlInteraction}`;
  },
};

export const getAllSpaces = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: 'one space',
      uponReceiving: `a request to get all spaces`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/spaces`,
        query: { limit: '100', skip: '0' },
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: {
          total: 1,
          limit: 100,
          skip: 0,
          sys: {
            type: 'Array',
          },
          items: [
            {
              name: 'My space',
              sys: {
                type: 'Space',
                id: defaultSpaceId,
                version: 1,
                createdBy: {
                  sys: {
                    type: 'Link',
                    linkType: 'User',
                    id: defaultUserId,
                  },
                },
                createdAt: '2020-04-23T11:54:34Z',
                updatedBy: {
                  sys: {
                    type: 'Link',
                    linkType: 'User',
                    id: defaultUserId,
                  },
                },
                updatedAt: '2020-04-23T11:54:34Z',
                organization: {
                  sys: {
                    type: 'Link',
                    linkType: 'Organization',
                    id: defaultOrgId,
                  },
                },
              },
            },
          ],
        },
      },
    }).as(getAllSpacesInteraction);

    return `@${getAllSpacesInteraction}`;
  },
  willReturnEmpty() {
    cy.addInteraction({
      provider: 'organization_usage',
      state: 'empty',
      uponReceiving: 'a request to get empty spaces',
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/spaces`,
        query: { limit: '100', skip: '0' },
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as(getAllSpacesInteraction);

    return `@${getAllSpacesInteraction}`;
  },
};
