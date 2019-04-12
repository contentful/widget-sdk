export function microbackendStreamToken() {
  cy.addInteraction({
    state: 'microbackendStreamToken',
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
  }).as('microbackendStreamToken');
}
