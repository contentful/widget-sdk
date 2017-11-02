'use strict';

/**
 * @ngdoc service
 * @name uiVersionSwitcher
 * @description
 * Switches the UI version if a `ui_version` query string parameter is specified.
 * It also displays the version in the UI and provides an easy way to clear it.
*/
angular.module('contentful')
.factory('uiVersionSwitcher', ['require', function (require) {
  var $location = require('$location');
  var $window = require('$window');
  var $document = require('$document');
  var Cookies = require('Cookies');
  var moment = require('moment');
  var gitRevision = require('environment').gitRevision;

  return {
    checkIfVersionShouldBeSwitched: function () {
      setVersionFromQuery();
      addVersionNotification();
    }
  };

  function setVersionFromQuery () {
    var uiVersion = $location.search().ui_version;
    if (uiVersion) {
      Cookies.set('ui_version', uiVersion, {
        expires: moment().add(24, 'h').toDate()
      });
      if (gitRevision !== uiVersion) {
        // This reloads the page without the query string
        $window.location.search = '';
      }
    }
  }

  function addVersionNotification () {
    var previewVersion = Cookies.get('ui_version');
    var isTestRun = !!Cookies.get('cf_test_run');
    if (!previewVersion || isTestRun) {
      return;
    }

    $document.find('body')
    .append(
      '<div class="cf-ui-version-display">Contentful UI Version: ' +
      '<a href="?ui_version=' + gitRevision + '">' + gitRevision + '</a> ' +
      '<a href="#" data-cf-ui-version-reload>Clear</a></div>'
    );

    $document.find('[data-cf-ui-version-reload]').on('click', function () {
      Cookies.remove('ui_version');
      $window.location.reload();
    });
  }
}]);
