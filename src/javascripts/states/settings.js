'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/settings
   */
  .factory('states/settings', [
    'require',
    require => {
      return {
        name: 'settings',
        url: '/settings',
        abstract: true,
        children: [
          require('app/SpaceSettings/GeneralSettings/SpaceSettingsState').default,
          require('states/settings/locales'),
          require('states/settings/users'),
          require('states/settings/roles'),
          require('app/Webhooks/WebhookState').default,
          require('states/settings/content_preview'),
          require('states/settings/Extensions').default,
          require('app/SpaceSettings/Environments/State').default,
          require('app/SpaceSettings/Usage/SpaceUsageState').default,
          require('app/Functions/State').default
          // Note: app/api/State is in the "Settings" menu but is not a child here.
        ]
      };
    }
  ]);
