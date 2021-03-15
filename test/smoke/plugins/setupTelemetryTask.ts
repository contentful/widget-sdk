import fetch from 'node-fetch';

export function setupTelemetryTask(on: Cypress.PluginEvents) {
  on('task', {
    async measure({ name, value }) {
      return fetch('https://metrics-api.librato.com/v1/measurements', {
        method: 'POST',
        body: JSON.stringify({
          name: `web-app-smoke-tests.${name}`,
          value,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
  });
}
