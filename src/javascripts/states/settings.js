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
      const SpaceSettingsBase = require('states/SpaceSettingsBase.es6').default;

      return SpaceSettingsBase({
        name: 'settings',
        url: '/settings',
        abstract: true,
        children: [
          {
            name: 'space',
            url: '/space',
            template: '<react-component name="app/settings/space/SpaceSettingsRoute.es6" />'
          },
          require('app/settings/locales/routes/index.es6').default,
          require('states/settings/users'),
          require('states/settings/roles'),
          require('states/settings/content_preview'),
          require('app/SpaceSettings/Environments/State.es6').default,
          require('app/SpaceSettings/Usage/SpaceUsageState.es6').default,
          // Note: app/api/State is in the "Settings" menu but is not a child here.
          require('app/settings/extensions/routes/index.es6').default,
          require('app/settings/webhooks/routes/index.es6').default,
          require('app/settings/apps/routes/index.es6').default
        ]
      });
    }
  ]);
