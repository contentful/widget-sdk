import * as state from '../util/interactionState';
import { getPlans } from '../util/requests';

const plans = require('../fixtures/plans.json');

export function freePlanResponse() {
  cy.addInteraction({
    provider: 'plans',
    state: state.Plans.FREE,
    uponReceiving: 'a request for all plans',
    withRequest: getPlans(),
    willRespondWith: {
      status: 200,
      body: plans
    }
  }).as(state.Plans.FREE);
}
