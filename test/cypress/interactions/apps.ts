import * as state from '../util/interactionState';
import { defaultSpaceId } from '../util/requests';

export const getAllInstalledAppsInDefaultSpace = {
  willReturnNoInstalledApps() {
    return cy.addInteraction({
      provider: 'apps',
      state: state.Apps.NONE,
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
    }).as(state.Apps.NONE);
  }
};
