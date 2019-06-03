import * as state from '../util/interactionState';
import { getLocales, defaultSpaceId } from '../util/requests';

const locales = require('../fixtures/responses/locales.json');
const query = {
  limit: '100',
  skip: '0'
};

export function defaultLocaleResponse() {
  cy.addInteraction({
    provider: 'locales',
    state: state.Locales.DEFAULT,
    uponReceiving: 'a request for all locales',
    withRequest: getLocales(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: locales
    }
  }).as(state.Locales.DEFAULT);
}
