import * as state from '../util/interactionState';

export const generateMicrobackendStreamToken = {
  willSucceed() {
    return cy.addInteraction({
      provider: 'microbackend',
      state: state.Microbackends.OK,
      uponReceiving: 'a request to generate a streamtoken',
      withRequest: {
        method: 'POST',
        path: `/_microbackends/backends/streamtoken/generate`,
        headers: {}
      },
      willRespondWith: {
        status: 200,
        body: {}
      }
    }).as(state.Microbackends.OK);
  }
}
