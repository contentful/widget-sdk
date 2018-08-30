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
          require('app/SpaceSettings/GeneralSettings/SpaceSettingsState.es6').default,
          require('states/settings/locales'),
          require('states/settings/users'),
          require('states/settings/roles'),
          require('app/Webhooks/WebhookState.es6').default,
          require('states/settings/content_preview'),
          require('app/Extensions/ExtensionsState.es6').default,
          require('app/SpaceSettings/Environments/State.es6').default,
          require('app/SpaceSettings/Usage/SpaceUsageState.es6').default,
          require('app/Functions/State.es6').default
          // Note: app/api/State is in the "Settings" menu but is not a child here.
        ]
      };
    }
  ]);
