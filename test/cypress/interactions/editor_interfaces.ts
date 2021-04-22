import { defaultSpaceId, defaultHeader, defaultEnvironmentId } from '../util/requests';
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
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/editor_interfaces`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: editorInterfacesResponse,
      },
    }).as('queryForEditorInterfaces');

    return '@queryForEditorInterfaces';
  },
};
