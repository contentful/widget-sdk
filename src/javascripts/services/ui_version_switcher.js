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

  return {
    checkIfVersionShouldBeSwitched: function () {
      if(environment.env === 'production')
        return;

      setVersionFromQuery();
      addVersionNotification();
    }
  };

  function setVersionFromQuery () {
    var uiVersion = $location.search().ui_version;
    if (uiVersion) {
      $.cookies.set('ui_version', uiVersion, {
        expiresAt: moment().add(1, 'h').toDate()
      });
      if (window.CF_UI_VERSION !== uiVersion) {
        // This reloads the page without the query string
        $window.location.search = '';
      }
    }
  }

  function addVersionNotification () {
    var previewVersion = $.cookies.get('ui_version');
    if (!previewVersion)
      return;

    var uiVersion = window.CF_UI_VERSION;

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
      $window.location.reload();
    });
  }

}]);
