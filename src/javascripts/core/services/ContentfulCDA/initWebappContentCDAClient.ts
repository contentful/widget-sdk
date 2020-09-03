import { services } from 'Config';

// "Webapp content" is the name of the space containing the copies for the user_interface
const WEBAPP_CONTENT_SPACE_ID = services.contentful.webappContentSpaceId;
const WEBAPP_CONTENT_TOKEN = services.contentful.webappAccessToken;

async function initWebappContentCDAClient() {
  const { createClient } = await import('contentful');
  const client = createClient({
    space: WEBAPP_CONTENT_SPACE_ID,
    accessToken: WEBAPP_CONTENT_TOKEN,
  });

  return client;
}

export { initWebappContentCDAClient };
