import { defaultSpaceId, defaultHeader } from '../util/requests';
const editorInterfacesResponse = require('../fixtures/responses/editor-interfaces.json');

enum State {
  SEVERAL = 'editor_interfaces/several',
}

export const queryForEditorInterfaces = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'editor_interfaces',
      state: State.SEVERAL,
      uponReceiving: `a request for getting the editor interfaces for space ${defaultSpaceId}`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/editor_interfaces`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: editorInterfacesResponse,
      },
    }).as('queryForEditorInterfaces');

    return '@queryForEditorInterfaces';
  },
};
