import { setupConfig } from './setupConfig';

export default function setupPlugins(
  on: Cypress.PluginEvents,
  initialConfig: Cypress.PluginConfigOptions
) {
  const config = setupConfig(on, initialConfig);

  return config;
}
