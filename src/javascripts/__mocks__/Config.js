export const authUrl = path => `https://be.contentful.com${path}`;
export const websiteUrl = path => `https://www.contentful.com${path}`;
export const appUrl = `https://app.contentful.com/`;
export const apiUrl = path => `//api.test.com/${path || ''}`;
export const oauthUrl = key => `//be.test.com/account/profile/auth/${key}`;
export const supportUrl = `https://support.contentful.com/`;

export const launchDarkly = {
  envId: 'jest'
};

export const services = {
  filestack: {},
  google: {},
  contentful: {
    space: 'space-id',
    accessToken: 'access-token',
    previewAccessToken: 'preview-token',
    cdaApiUrl: 'cda-api-url',
    previewApiUrl: 'preview-api-url',
    spaceTemplateEntryContentTypeId: 'space-template-ct-id'
  },
  embedly: {}
};

export const env = 'jest';

export const pusher = {};
