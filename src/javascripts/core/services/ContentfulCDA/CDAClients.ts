import { services } from 'Config';

/**
 * Function to initialise a CDA client for a particular space
 *
 * @param space - the id of the space you want to access
 * @param accessToken - the access token provided to your organization
 */
async function initCDAClient(space: string, accessToken: string) {
  const { createClient } = await import('contentful');
  const client = createClient({ space, accessToken });

  return client;
}

// space id and access token for the "Webapp content" space inside "Contentful ProdDev" organization
const WEBAPP_CONTENT_SPACE_ID = services.contentful.webappContentSpaceId;
const WEBAPP_CONTENT_TOKEN = services.contentful.webappAccessToken;

/**
 * Function to initialise the "Webapp content" space inside "Contentful ProdDev" organization
 */
async function initWebappContentCDAClient() {
  return await initCDAClient(WEBAPP_CONTENT_SPACE_ID, WEBAPP_CONTENT_TOKEN);
}

export { initWebappContentCDAClient };
