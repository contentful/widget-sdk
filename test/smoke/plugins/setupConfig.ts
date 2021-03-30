import type { SmokeTestEnvironment } from '../telemetry';

/**
 * Although some of this could be put into the configuration (like env.email), I chose to put
 * this all here so that there's one single place to find it.
 */
export function setupConfig(_, config: Cypress.PluginConfigOptions) {
  const {
    SMOKE_TEST_USER_EMAIL,
    SMOKE_TEST_USER_PASSWORD,
    SMOKE_TEST_ENVIRONMENT,
    SMOKE_TEST_SELF_SERVICE_ORG_ID,
    LIBRATO_AUTH_TOKEN,
  } = process.env;

  if (!SMOKE_TEST_USER_PASSWORD) {
    throw new EnvironmentVariableMissingError('SMOKE_TEST_USER_PASSWORD');
  }

  if (!LIBRATO_AUTH_TOKEN) {
    throw new EnvironmentVariableMissingError('LIBRATO_AUTH_TOKEN');
  }

  const email = SMOKE_TEST_USER_EMAIL ? SMOKE_TEST_USER_EMAIL : 'test@contentful.com';

  let domain = 'contentful.com';
  let environment: SmokeTestEnvironment = 'production';

  if (SMOKE_TEST_ENVIRONMENT === 'staging') {
    domain = 'flinkly.com';
    environment = 'staging';
  } else if (
    SMOKE_TEST_ENVIRONMENT !== 'production' &&
    typeof SMOKE_TEST_ENVIRONMENT === 'string'
  ) {
    domain = SMOKE_TEST_ENVIRONMENT;
    environment = 'other';
  }

  config.baseUrl = `https://app.${domain}`;
  config.env.email = email;
  config.env.password = SMOKE_TEST_USER_PASSWORD;
  config.env.domain = domain;
  config.env.environment = environment;
  config.env.libratoAuthToken = LIBRATO_AUTH_TOKEN;

  // hard coded space/org/etc. IDs below
  config.env.selfServiceOrgId = SMOKE_TEST_SELF_SERVICE_ORG_ID;

  return config;
}

class EnvironmentVariableMissingError extends Error {
  constructor(envVarName: string) {
    super(`Environment variable ${envVarName} expected but missing`);
  }
}
