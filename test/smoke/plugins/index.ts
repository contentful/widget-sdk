/**
 * Although some of this could be put into the configuration (like env.email), I chose to put
 * this all here so that there's one single place to find it.
 */
export default function plugins(_, config: Cypress.PluginConfigOptions) {
  const { SMOKE_TEST_USER_EMAIL, SMOKE_TEST_USER_PASSWORD, SMOKE_TEST_DOMAIN } = process.env;

  if (!SMOKE_TEST_USER_PASSWORD) {
    throw new Error('Environment variable SMOKE_TEST_USER_PASSWORD expected but not given');
  }

  const email = SMOKE_TEST_USER_EMAIL ? SMOKE_TEST_USER_EMAIL : 'test@contentful.com';
  const domain = SMOKE_TEST_DOMAIN ? SMOKE_TEST_DOMAIN : 'contentful.com';

  config.baseUrl = `https://app.${SMOKE_TEST_DOMAIN}`;
  config.env.email = email;
  config.env.password = SMOKE_TEST_USER_PASSWORD;
  config.env.domain = domain;

  return config;
}
