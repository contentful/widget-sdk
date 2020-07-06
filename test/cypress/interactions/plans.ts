import { RequestOptions } from '@pact-foundation/pact-web';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../util/requests';

const mediumSpacePlan = require('../fixtures/responses/space-plan-medium.json');

function queryPlans(): RequestOptions {
  return {
    method: 'GET',
    path: `/organizations/${defaultOrgId}/plans`,
    headers: {
      ...defaultHeader,
      'x-contentful-enable-alpha-feature': 'subscriptions-api',
    },
    query: { gatekeeper_key: defaultSpaceId, plan_type: 'space' },
  };
}

export const getSpacePlan = {
  willReturnDefault() {
    cy.addInteraction({
      provider: 'plans',
      state: 'plans get space plan',
      uponReceiving: `a request to get the space plan `,
      withRequest: queryPlans(),
      willRespondWith: {
        status: 200,
        body: mediumSpacePlan,
      },
    }).as('getSpacePlan');

    return '@getSpacePlan';
  },
};
