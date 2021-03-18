import * as telemetry from '../telemetry';

export function setupTelemetryTask(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  on('task', {
    async measure({ name: rawName, value }) {
      const libratoAuthToken = config.env.libratoAuthToken;
      const environment = config.env.environment;

      const name = `testcase.${rawName}`;

      return telemetry.measure(libratoAuthToken, environment, [{ name, value }]);
    },
  });
}
