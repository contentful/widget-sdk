import * as telemetry from '../telemetry';

export function setupTelemetryTask(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  on('task', {
    async measure({ name, value }) {
      if (config.env.skipLibrato) {
        return;
      }

      const libratoAuthToken = config.env.libratoAuthToken;
      const environment = config.env.environment;

      return telemetry.measure(libratoAuthToken, environment, [{ name, value }]);
    },
  });
}
