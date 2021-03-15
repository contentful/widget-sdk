import { setupConfig } from './setupConfig';
import { setupTelemetryTask } from './setupTelemetryTask';

export default function setupPlugins(
  on: Cypress.PluginEvents,
  initialConfig: Cypress.PluginConfigOptions
) {
  // This should always come first so that if we ever need the fully augmented
  // config in a later plugin, it will be available.
  const config = setupConfig(on, initialConfig);

  setupTelemetryTask(on);

  return config;
}
