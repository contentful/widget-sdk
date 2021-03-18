import * as telemetry from '../telemetry';

export function setupTelemetryTask(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  on('task', {
    async measure({ name, value }) {
      const libratoAuthToken = config.env.LIBRATO_AUTH_TOKEN;

      return telemetry.measure(libratoAuthToken, [{ name, value }]);
    },
  });
}
