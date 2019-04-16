import * as state from './interactionState';

export function microbackendStreamToken() {
  cy.addInteraction({
    state: state.Microbackends.STREAMTOKEN,
    uponReceiving: 'a request for streamtoken',
    withRequest: {
      method: 'POST',
      path: `/_microbackends/backends/streamtoken/generate`,
      headers: {}
    },
    willRespondWith: {
      status: 200,
      body: {}
    }
  }).as(state.Microbackends.STREAMTOKEN);
}
