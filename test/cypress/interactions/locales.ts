import * as state from '../util/interactionState';
import { getLocales } from '../util/requests';

const locales = require('../fixtures/locales.json');

export function defaultLocaleResponse() {
  cy.addInteraction({
    provider: 'locales',
    state: state.Locales.DEFAULT,
    uponReceiving: 'a request for all locales',
    withRequest: getLocales(),
    willRespondWith: {
      status: 200,
      body: locales
    }
  }).as(state.Locales.DEFAULT);
}
