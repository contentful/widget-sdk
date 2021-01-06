import { defaultSpaceId, defaultHeader, defaultOrgId, defaultAppId } from '../util/requests';

import { marketplaceEntryList } from '../fixtures/responses/app_definitions/apps-marketplace';

// Installation Lists
import { appInstallationsMarketPlace } from '../fixtures/responses/app_installations/app_installations';
import { emptyAppInstallations } from '../fixtures/responses/app_installations/app_installations_empty';

// Single installations
import { dropboxAppInstallation } from '../fixtures/responses/app_installations/app-installation';
import { privateAppInstallation } from '../fixtures/responses/app_installations/app-installation-private';

// AppDefinition Lists
import { appDefinitionsPublic } from '../fixtures/responses/app_definitions/app-definitions-public';
import { orgAppDefinitions } from '../fixtures/responses/app_definitions/app-definitions-private';

const emptyOrgAppDefinitions = require('../fixtures/responses/empty');

const privateAppId = orgAppDefinitions.items[0].sys.id;
const contentfulJson = 'application/vnd.contentful.management.v1+json';

function interaction(desc: string, req, res) {
  const keywords = desc.split(' ');
  const handle = keywords.map((str) => str[0].toUpperCase() + str.slice(1)).join('');
  return function () {
    cy.addInteraction({
      provider: 'apps',
      state: keywords.join('/'),
      uponReceiving: desc,
      withRequest: req,
      willRespondWith: res,
    }).as(handle);

    return `@${handle}`;
  };
}

export const marketplaceAppEntries = {
  willListAll: interaction(
    'request public marketplace apps',
    {
      method: 'GET',
      path: `/entries`,
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: marketplaceEntryList,
    }
  ),
};

export const appInstallation = {
  willSavePublic: interaction(
    'save dropbox app installation',
    {
      method: 'PUT',
      path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
      body: { parameters: {} },
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: dropboxAppInstallation,
    }
  ),
  willSavePrivate: interaction(
    'save private app installation',
    {
      method: 'PUT',
      path: `/spaces/${defaultSpaceId}/app_installations/${privateAppId}`,
      body: { parameters: {} },
    },
    {
      status: 200,
      headers: {
        'Content-Type': contentfulJson,
      },
      body: privateAppInstallation,
    }
  ),
  willDeletePublic: interaction(
    'delete Dropbox app installation',
    {
      method: 'DELETE',
      path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
      headers: defaultHeader,
    },
    {
      status: 204,
    }
  ),
  willDeletePrivate: interaction(
    'delete private app installation',
    {
      method: 'DELETE',
      path: `/spaces/${defaultSpaceId}/app_installations/${privateAppId}`,
      headers: defaultHeader,
    },
    {
      status: 204,
    }
  ),
  willReturnPublicApp: interaction(
    'get existing Dropbox app installation',
    {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: dropboxAppInstallation,
    }
  ),
  willReturnPrivateApp: interaction(
    'get existing private app installation',
    {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/app_installations/${privateAppId}`,
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: privateAppInstallation,
    }
  ),
  willNotReturnPublicApp: interaction(
    'fail get Dropbox installation',
    {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/app_installations/${defaultAppId}`,
      headers: defaultHeader,
    },
    {
      status: 404,
      headers: { 'Content-Type': contentfulJson },
      body: emptyAppInstallations,
    }
  ),
  willNotReturnPrivateApp: interaction(
    'fail get private installation',
    {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/app_installations/${privateAppId}`,
      headers: defaultHeader,
    },
    {
      status: 404,
      headers: { 'Content-Type': contentfulJson },
      body: emptyAppInstallations,
    }
  ),
  willListNone: interaction(
    'empty list of app installations for space',
    {
      method: 'GET',
      path: `/spaces/${defaultSpaceId}/app_installations`,
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: emptyAppInstallations,
    }
  ),
  willListSome: interaction(
    'list of app installations for space',
    {
      path: `/spaces/${defaultSpaceId}/app_installations`,
      method: 'GET',
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: appInstallationsMarketPlace,
    }
  ),
};

export const organizationAppDefinitions = {
  willListEmpty: interaction(
    'list empty private app definitions for org',
    {
      method: 'GET',
      path: `/organizations/${defaultOrgId}/app_definitions`,
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: emptyOrgAppDefinitions,
    }
  ),
  willListOnePrivate: interaction(
    'list private app definitions for org',
    {
      method: 'GET',
      path: `/organizations/${defaultOrgId}/app_definitions`,
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: orgAppDefinitions,
    }
  ),
};
export const publicAppDefinitions = {
  willListAll: interaction(
    'list public app definitions',
    {
      method: 'GET',
      path: '/app_definitions',
      headers: defaultHeader,
    },
    {
      status: 200,
      headers: { 'Content-Type': contentfulJson },
      body: appDefinitionsPublic,
    }
  ),
};
