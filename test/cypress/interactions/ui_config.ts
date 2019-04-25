import * as state from '../util/interactionState';

const uiConfig = require('../fixtures/ui-config.json');
const spaceId = Cypress.env('spaceId');

export function emptyUiConfigResponse() {
  cy.addInteraction({
    provider: 'ui_config',
    state: state.UIConfig.NONE,
    uponReceiving: 'a request for userUIConfig',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/ui_config`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: uiConfig
    }
  }).as(state.UIConfig.NONE);
}

export function uiConfigMeResponse() {
  cy.addInteraction({
    provider: 'ui_config',
    state: state.UIConfig.USER,
    uponReceiving: 'a request for profile UserUIConfig',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/ui_config/me`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: uiConfig
    }
  }).as(state.UIConfig.USER);
}
