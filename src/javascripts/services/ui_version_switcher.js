'use strict';

/**
 * @ngdoc service
 * @name uiVersionSwitcher
 * @description
 * Switches the UI version if a `ui_version` query string parameter is specified.
 * It also displays the version in the UI and provides an easy way to clear it.
*/
angular.module('contentful').factory('uiVersionSwitcher', ['$injector', function($injector) {
  var $location    = $injector.get('$location');
  var $window      = $injector.get('$window');
  var $document    = $injector.get('$document');
  var environment  = $injector.get('environment');
  var notification = $injector.get('notification');

  return {
    checkIfVersionShouldBeSwitched: function () {
      if(environment.env === 'production')
        return;

      attemptToSwitchVersion();

      checkIfVersionWasSwitched();
    }
  };

  function attemptToSwitchVersion() {
    var uiVersion = $location.search().ui_version;
    if(uiVersion){
      $.cookies.set('ui_version', uiVersion, {
        expiresAt: moment().add(1, 'h').toDate()
      });
      $location.search('ui_version', null);
      $window.location.reload();
    }
  }

  function checkIfVersionWasSwitched() {
    var uiVersion = $.cookies.get('ui_version');
    if(uiVersion) {
      notification.info('UI Version was switched to uiVersion '+uiVersion);

      $document.find('body')
      .append(
        '<div class="cf-ui-version-display">Contentful UI Version: '+
        uiVersion+
        '<a href="#" data-cf-ui-version-reload>Clear</a></div>'
      );

      $document.find('[data-cf-ui-version-reload]').on('click', function () {
        $.cookies.set('ui_version', null, {
          expiresAt: 0
        });
        $location.search('ui_version', null);
        $window.location.reload();
      });
    }
  }

}]);
