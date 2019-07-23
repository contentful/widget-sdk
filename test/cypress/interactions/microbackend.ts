enum States {
  OK = 'microbackends/ok'
}

export const generateMicrobackendStreamToken = {
  willSucceed() {
    cy.addInteraction({
      provider: 'microbackend',
      state: States.OK,
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
    }).as('generateMicrobackendStreamToken');

    return '@generateMicrobackendStreamToken';
  }
}
