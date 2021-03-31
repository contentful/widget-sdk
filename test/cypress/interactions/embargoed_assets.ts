import { defaultHeader, defaultSpaceId } from '../util/requests';

const responses = {
  accessDenied(spaceId: string) {
    return {
      sys: {
        type: 'Error',
        id: 'AccessDenied',
      },
      message: 'Forbidden',
      details: {
        reasons: `Feature embargoed_assets is not enabled for ${spaceId}`,
      },
    };
  },

  inMode(spaceId: string, mode: string | null) {
    return {
      sys: {
        space: {
          sys: {
            id: spaceId,
            type: 'Link',
            linkType: 'Space',
          },
        },
      },
      protectionMode: mode,
    };
  },
};

enum States {
  WUT = 'embargoed_assets/wut',
}

export const getEmbargoedAssets = {
  willReturnDenied() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to get embargoed_assets state for "${defaultSpaceId}" and feature is disabled`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 403,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.accessDenied(defaultSpaceId),
      },
    }).as('getEmboargoedAssetsForDefaultSpace');

    return '@getEmboargoedAssetsForDefaultSpace';
  },

  willReturnDisabled() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to get embargoed_assets state for "${defaultSpaceId}" and being disabled`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, null),
      },
    }).as('getEmboargoedAssetsForDefaultSpace');

    return '@getEmboargoedAssetsForDefaultSpace';
  },

  willReturnEnabledAndMigration() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to get embargoed_assets state for "${defaultSpaceId}" and being in migration`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, 'migrating'),
      },
    }).as('getEmboargoedAssetsForDefaultSpace');

    return '@getEmboargoedAssetsForDefaultSpace';
  },
  willReturnEnabledForUnpublished() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to get embargoed_assets state for "${defaultSpaceId}" and being enabled for unpublished`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, 'unpublished'),
      },
    }).as('getEmboargoedAssetsForDefaultSpace');

    return '@getEmboargoedAssetsForDefaultSpace';
  },
  willReturnEnabledForAll() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to get embargoed_assets state for "${defaultSpaceId}" and being in enabled for all`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, 'all'),
      },
    }).as('getEmboargoedAssetsForDefaultSpace');

    return '@getEmboargoedAssetsForDefaultSpace';
  },
};

export const setEmbargoedAssets = {
  willChangeToMigrating() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to set embargoed_assets state to "migrating" for "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
        body: { protectionMode: 'migrating' },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, 'migrating'),
      },
    }).as('setEmboargoedAssetsForDefaultSpace');

    return '@setEmboargoedAssetsForDefaultSpace';
  },
  willChangeToUnpublished() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to set embargoed_assets state to "unpublished" for "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
        body: { protectionMode: 'unpublished' },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, 'unpublished'),
      },
    }).as('setEmboargoedAssetsForDefaultSpace');

    return '@setEmboargoedAssetsForDefaultSpace';
  },
  willChangeToAll() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to set embargoed_assets state to "all" for "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
        body: { protectionMode: 'all' },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, 'all'),
      },
    }).as('setEmboargoedAssetsForDefaultSpace');

    return '@setEmboargoedAssetsForDefaultSpace';
  },
  willChangeToDisabled() {
    cy.addInteraction({
      provider: 'embargoed_assets',
      state: States.WUT,
      uponReceiving: `a request to set embargoed_assets state to "null" (disabled) for "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/embargoed_assets`,
        headers: defaultHeader,
        body: { protectionMode: null },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: responses.inMode(defaultSpaceId, null),
      },
    }).as('setEmboargoedAssetsForDefaultSpace');

    return '@setEmboargoedAssetsForDefaultSpace';
  },
};
