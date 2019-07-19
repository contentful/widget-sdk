import { defaultSpaceId } from '../util/requests';

enum States {
  NONE = 'microbackends/apps/none'
}

export const getAllInstalledAppsInDefaultSpace = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'apps',
      state: States.NONE,
      uponReceiving: `a request to get all installed apps in the space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/_microbackends/backends/apps/spaces/${defaultSpaceId}/`,
        headers: {}
      },
      willRespondWith: {
        status: 200,
        body: {}
      }
    }).as('getAllInstalledAppsInDefaultSpace');

    return '@getAllInstalledAppsInDefaultSpace'
  }
};
