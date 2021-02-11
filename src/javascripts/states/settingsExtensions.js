import { ExtensionsListRoute, ExtensionEditorRoute } from 'features/extensions-management';

export const extensionsSettingsState = {
  name: 'extensions',
  url: '/extensions',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      params: {
        // optional extensionUrl param to open GitHubInstaller
        extensionUrl: null,
        referrer: null,
      },
      component: ExtensionsListRoute,
    },
    {
      name: 'detail',
      url: '/:extensionId',
      component: ExtensionEditorRoute,
    },
  ],
};
