/**
 * Although some of this could be put into the configuration (like env.email), I chose to put
 * this all here so that there's one single place to find it.
 */
export function setupConfig(_, config: Cypress.PluginConfigOptions) {
  const {
    SMOKE_TEST_USER_EMAIL,
    SMOKE_TEST_USER_PASSWORD,
    SMOKE_TEST_DOMAIN,
    LIBRATO_AUTH_TOKEN,
  } = process.env;

  if (!SMOKE_TEST_USER_PASSWORD) {
    throw new EnvironmentVariableMissingError('SMOKE_TEST_USER_PASSWORD');
  }

  if (!LIBRATO_AUTH_TOKEN) {
    throw new EnvironmentVariableMissingError('LIBRATO_AUTH_TOKEN');
  }

  const email = SMOKE_TEST_USER_EMAIL ? SMOKE_TEST_USER_EMAIL : 'test@contentful.com';
  const domain = SMOKE_TEST_DOMAIN ? SMOKE_TEST_DOMAIN : 'contentful.com';

  config.baseUrl = `https://app.${SMOKE_TEST_DOMAIN}`;
  config.env.email = email;
  config.env.password = SMOKE_TEST_USER_PASSWORD;
  config.env.domain = domain;
  config.env.libratoAuthToken = LIBRATO_AUTH_TOKEN;

  return config;
}

class EnvironmentVariableMissingError extends Error {
  constructor(envVarName: string) {
    super(`Environment variable ${envVarName} expected but missing`);
  }
}
