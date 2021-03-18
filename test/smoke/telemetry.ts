import fetch from 'node-fetch';

export type SmokeTestEnvironment = 'production' | 'staging' | 'other';

interface RawMeasurement {
  name: string;
  value: number;
  tags?: { [key: string]: string };
}

// TODO(jo-sm): Once we're in TS v4+, we should use a template literal type here
// `web-app-smoke-tests.${string}` or something analagous
interface Measurement {
  name: string;
  value: number;
  tags: { [key: string]: string };
}

/**
 * Send measurements to Librato.
 * @param {string}           authToken
 * @param {RawMeasurement[]} rawMeasurements
 */
export async function measure(
  authToken: string,
  environment: SmokeTestEnvironment,
  rawMeasurements: RawMeasurement[]
) {
  const measurements = prepareMeasurements(environment, rawMeasurements);

  const response = await fetch('https://metrics-api.librato.com/v1/measurements', {
    method: 'POST',
    // Expected shape is:
    // { measurements: Measurement[] }
    //
    // See https://www.librato.com/docs/api/#create-a-measurement
    body: JSON.stringify({ measurements }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authToken}`,
    },
  });

  if (!response.ok) {
    const respJson = await response.json();

    console.log(respJson);

    throw new Error('Librato measurement failed, check the logged error');
  }

  // Must return a value for the Cypress task
  return true;
}

/**
 * Wrap a callback that contains a set of Cypress commands such that its duration is logged to Librato.
 *
 * This is a normal function, rather than a Cypress command, because you aren't supposed to return
 * anything from a Cypress command, yet we might define something and want its result. For example:
 *
 * ```
 * const spaceHome = measureDuration<SpaceHomePage>('login', 'time-login-to-space-home', () => {
 *  const spaceHome = loginPage.submitForm();
 *
 *  spaceHome.container.should('be.visible');
 *
 *  return spaceHome;
 * });
 * ```
 *
 * Without being able to do this, you can't guarantee that the value of `spaceHome` is defined
 * (as TS doesn't know that the callback was ever called), leading to TS errors.
 * @param testName   Name of the test, e.g. `login`
 * @param metricName The metric name, e.g. `time-login-to-space-home`
 * @param cb Set of Cypress commands in a callback
 */
export function wrapWithDuration<T>(testName: string, metricName: string, cb: () => T): T {
  const start = Date.now();

  const result = cb();

  cy.wrap(() => {
    return Date.now() - start;
  }).then((duration) => {
    cy.task('measure', { name: `${testName}.${metricName}`, value: duration() });
  });

  return result;
}

/**
 * Prepare raw measurements by normalizing the name to include the
 * `web-app-smoke-tests` prefix.
 * @param  {RawMeasurement[]} rawMeasurements
 * @return {Measurement[]}
 */
function prepareMeasurements(
  environment: SmokeTestEnvironment,
  rawMeasurements: RawMeasurement[]
): Measurement[] {
  return rawMeasurements.map(({ name, value, tags }) => ({
    name: `web-app-smoke-tests.${name}`,
    value,
    tags: {
      ...tags,
      environment,
    },
  }));
}
