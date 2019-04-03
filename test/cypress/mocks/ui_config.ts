const empty = require('../fixtures/empty.json');
const uiConfig = require('../fixtures/ui_config.json');

const spaceId = Cypress.env('spaceId');

export function emptyUiConfigResponse() {
  cy.addInteraction({
    state: 'noUIConfig',
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
      body: empty
    }
  }).as('uiConfig');
}

export function uiConfigMeResponse() {
  cy.addInteraction({
    state: 'userUIConfig',
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
  }).as('uiConfigMe');
}
