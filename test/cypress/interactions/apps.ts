import { defaultSpaceId, defaultHeader, defaultOrgId, defaultAppId } from '../util/requests';
import { dropboxAppInstallation } from '../fixtures/responses/app_installations/app-installation';
import { appInstallationsMarketPlace } from '../fixtures/responses/app_installations/app_installations';

const appMarketplaceResponse = require('../fixtures/responses/app_definitions/apps-marketplace.json');
const emptyAppInstallation = require('../fixtures/responses/app_installations/app_installations_empty');
const empty = require('../fixtures/responses/empty');
const appDefinitionsPublic = require('../fixtures/responses/app_definitions/app-definitions-public');

enum State {
  APPS_MARKETPLACE = 'apps/marketplace',
  APP_INSTALLATION_NONE = 'app_installations/none',
  APP_INSTALLATION_SOME = 'app_installations/some',
  APP_DEFINITIONS_NONE = 'app_definitions/none',
  APP_DEFINITIONS_PUBLIC = 'app_definitions/public',
  GET_APP_INSTALLATION = 'app_installation/some',
  GET_APP_INSTALLATION_NONE = 'app_installation/none',
  INSTALL_APP = 'app_installations/install',
  UNINSTALL_APP = 'app_installations/uninstall',
}

export const queryForAllMarketplaceApps = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'apps',
      state: State.APPS_MARKETPLACE,
      uponReceiving: `a request for all public apps in the marketplace for space ${defaultSpaceId}`,
      withRequest: {
        method: 'GET',
        path: `/entries`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: appMarketplaceResponse,
      },
    }).as('queryForMarketplaceApps');

    return '@queryForMarketplaceApps';
  },
};

export const queryForAppInstallations = {
  willReturnOneInstalledApp() {
    cy.addInteraction({
      provider: 'apps',
      state: State.GET_APP_INSTALLATION,
      uponReceiving: `a request for an app installation`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: dropboxAppInstallation,
      },
    }).as('queryForOneAppInstallation');

    return '@queryForOneAppInstallation';
  },
  willReturnNoInstalledApp() {
    cy.addInteraction({
      provider: 'apps',
      state: State.GET_APP_INSTALLATION_NONE,
      uponReceiving: `a request for an app installation ${defaultAppId} that is not yet installed`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 404,
        body: emptyAppInstallation,
      },
    }).as('queryForOneAppInstallation');

    return '@queryForOneAppInstallation';
  },
  willReturnNone() {
    cy.addInteraction({
      provider: 'apps',
      state: State.APP_INSTALLATION_NONE,
      uponReceiving: `a request for all app installations for space ${defaultSpaceId}`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/app_installations`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: emptyAppInstallation,
      },
    }).as('queryForAppInstallations');

    return '@queryForAppInstallations';
  },
  willReturnSome() {
    cy.addInteraction({
      provider: 'apps',
      state: State.APP_INSTALLATION_SOME,
      uponReceiving: `a request to get all installed apps in an environment`,
      withRequest: {
        path: `/spaces/${defaultSpaceId}/app_installations`,
        method: 'GET',
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: appInstallationsMarketPlace,
      },
    }).as('queryForAppInstallationsWithInstalledApps');

    return '@queryForAppInstallationsWithInstalledApps';
  },
};

export const deleteAppInstallation = {
  willSucceed() {
    cy.addInteraction({
      provider: 'apps',
      state: State.UNINSTALL_APP,
      uponReceiving: 'a request for deleting an app',
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 204,
      },
    }).as('deleteAppInstallation');

    return '@deleteAppInstallation';
  },
};

export const saveAppInstallation = {
  willSucceed() {
    cy.addInteraction({
      provider: 'apps',
      state: State.INSTALL_APP,
      uponReceiving: `a request for installing an app`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
        body: { parameters: {} },
      },
      willRespondWith: {
        status: 200,
        body: dropboxAppInstallation,
      },
    }).as('saveAppInstallation');

    return '@saveAppInstallation';
  },
};

export const queryForAppDefinitions = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'apps',
      state: State.APP_DEFINITIONS_NONE,
      uponReceiving: `a request for app definitions for organization ${defaultOrgId}`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/app_definitions`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('queryForAppDefinitions');

    return '@queryForAppDefinitions';
  },
  willReturnSeveralPublic() {
    cy.addInteraction({
      provider: 'apps',
      state: State.APP_DEFINITIONS_PUBLIC,
      uponReceiving: `a request for public app definitions provided by Contentful`,
      withRequest: {
        method: 'GET',
        path: '/app_definitions',
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: appDefinitionsPublic,
      },
    }).as('queryForPublicAppDefinitions');

    return '@queryForPublicAppDefinitions';
  },
};
