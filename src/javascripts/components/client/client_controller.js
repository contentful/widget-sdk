'use strict';

angular.module('contentful')
.controller('ClientController', ['$scope', 'require', function ClientController ($scope, require) {
  var $rootScope = require('$rootScope');
  var $state = require('$state');
  var K = require('utils/kefir');
  var features = require('features');
  var logger = require('logger');
  var spaceContext = require('spaceContext');
  var TokenStore = require('services/TokenStore');
  var Analytics = require('analytics/Analytics');
  var authorization = require('authorization');
  var presence = require('presence');
  var revision = require('revision');
  var ReloadNotification = require('ReloadNotification');
  var environment = require('environment');
  var fontsDotCom = require('fontsDotCom');
  var CreateSpace = require('services/CreateSpace');
  var refreshNavState = require('navigation/NavState').makeStateRefresher($state, spaceContext);
  var Intercom = require('intercom');

  // TODO remove this eventually. All components should access it as a service
  $scope.spaceContext = spaceContext;

  // TODO this does not belong here. We should move it to the
  // controller that actually uses it
  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function () {
      var showAuxPanel = !$scope.preferences.showAuxPanel;
      $scope.preferences.showAuxPanel = showAuxPanel;
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function () {
    return {
      space: spaceContext.space,
      tokenLookup: TokenStore.getTokenLookup()
    };
  }, spaceAndTokenWatchHandler);

  K.onValueScope($scope, TokenStore.user$, handleUser);

  $scope.initClient = initClient;
  $scope.showCreateSpaceDialog = CreateSpace.showDialog;

  function initClient () {
    setTimeout(newVersionCheck, 5000);
    setInterval(function () {
      if (presence.isActive()) {
        newVersionCheck();
      }
    }, 5 * 60 * 1000);
  }

  function spaceAndTokenWatchHandler (collection) {
    if (collection.tokenLookup) {
      authorization.setTokenLookup(collection.tokenLookup);
      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId())) {
        authorization.setSpace(collection.space);
      }
      refreshNavState();
    }
  }

  function handleUser (user) {
    if (!_.isObject(user)) { return; }

    $scope.user = user;

    if (features.allowAnalytics(user)) {
      logger.enable(user);
      Analytics.enable(user);
      fontsDotCom.enable();
    } else {
      logger.disable();
      Analytics.disable();
      // Intercom is enabled by default, but because it is loaded by Segment,
      // it will only be available when Analytics/Segment is.
      Intercom.disable();
    }
  }

  function newVersionCheck () {
    if (environment.settings.disableUpdateCheck) {
      return;
    }
    revision.hasNewVersion().then(function (hasNewVersion) {
      if (hasNewVersion) {
        $rootScope.$broadcast('persistentNotification', {
          message: 'A new application version is available. Please reload to get a new version of the application',
          action: ReloadNotification.triggerImmediateReload,
          actionMessage: 'Reload'
        });
      }
    });
  }
}]);
