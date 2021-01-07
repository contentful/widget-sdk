export const authUrl = (path) => `https://be.contentful.com/${path}`;
export const websiteUrl = (path) => `https://www.contentful.com${path}`;
export const appUrl = `https://app.contentful.com/`;
export const apiUrl = (path) => `//api.test.com/${path || ''}`;
export const uploadApiUrl = () => 'upload.test.com';
export const oauthUrl = (key) => `//be.test.com/account/profile/auth/${key}`;
export const supportUrl = `https://support.contentful.com/`;
export const salesUrl = `https://www.contentful.com/contact/sales/`;
export const helpCenterUrl = 'https://www.contentful.com/help';
export const developerDocsUrl = 'https://www.contentful.com/developers/docs/';
export const developersChangelogUrl = 'https://www.contentful.com/developers/changelog/';
export const secureAssetsUrl = 'https://secure.ctfassets.net';
export const launchAppUrl = 'https://launch.contentful.com';
export const accountUrl = (path) => `//be.test.com/account${path}`;

export const launchDarkly = {
  envId: 'jest',
};

export const snowplow = {};

export function readInjectedConfig() {
  return {
    config: {
      environment: 'jest',
      authUrl: 'https://be.contentful.com/',
      marketingUrl: 'https://www.contentful.com/',
      apiUrl: 'https://api.contentful.com/',
      uploadApiUrl: 'https://upload.contentful.com/',
      otUrl: 'https://ot.contentful.com/',
      main_domain: 'contentful.com',
    },
  };
}

export const services = {
  filestack: {},
  google: {},
  contentful: {
    space: 'space-id',
    accessToken: 'access-token',
    previewAccessToken: 'preview-token',
    cdaApiUrl: 'cda-api-url',
    previewApiUrl: 'preview-api-url',
    spaceTemplateEntryContentTypeId: 'space-template-ct-id',
    webappAccessToken: '5B_j6eppzmJk4Gr161h8dpnOx74o93e_3SWWo4f57Mw',
    webappPreviewAccessToken: 'yrmSJInWjoWSX-0mqPWYZ-Qd9KYniXpNiOBaZ0RuB_A',
    webappContentSpaceId: 'yr70aocgr4fw',
  },
  embedly: {},
};

export const env = 'jest';

export const pusher = {};
