import { services } from 'Config';

// function to initialise a CDA client for a particular space
async function initCDAClient(space: string, accessToken: string) {
  const { createClient } = await import('contentful');
  const client = createClient({ space, accessToken });

  return client;
}

// Client for the "Webapp content" space in the ContentfulProdDev organization account
const WEBAPP_CONTENT_SPACE_ID = services.contentful.webappContentSpaceId;
const WEBAPP_CONTENT_TOKEN = services.contentful.webappAccessToken;

async function initWebappContentCDAClient() {
  return await initCDAClient(WEBAPP_CONTENT_SPACE_ID, WEBAPP_CONTENT_TOKEN);
}

export { initWebappContentCDAClient };
