import { defaultSpaceId } from '../util/requests';

export const getFeaturesWithCustomRoles = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'features',
      state: 'default',
      uponReceiving: `a request to get features for space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/features`,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      },
      willRespondWith: {
        status: 200,
        body: {
          total: 1,
          sys: {
            type: 'Array',
          },
          items: [
            {
              name: 'Custom roles',
              sys: {
                id: 'custom_roles',
                type: 'Feature',
              },
            },
          ],
        },
      },
    }).as('getFeatures');

    return '@getFeatures';
  },
};
