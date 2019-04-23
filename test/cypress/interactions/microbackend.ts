import * as state from '../util/interactionState';
import { postStreamToken } from '../util/requests';

export function microbackendStreamToken() {
  cy.addInteraction({
    state: state.Microbackends.STREAMTOKEN,
    uponReceiving: 'a request for streamtoken',
    withRequest: postStreamToken(),
    willRespondWith: {
      status: 200,
      body: {}
    }
  }).as(state.Microbackends.STREAMTOKEN);
}
