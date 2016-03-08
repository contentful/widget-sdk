'use strict';

angular.module('contentful').controller('ClientController', ['$scope', '$injector', function ClientController($scope, $injector) {
  var $rootScope         = $injector.get('$rootScope');
  var $timeout           = $injector.get('$timeout');
  var $location          = $injector.get('$location');
  var $state             = $injector.get('$state');
  var features           = $injector.get('features');
  var logger             = $injector.get('logger');
  var spaceContext       = $injector.get('spaceContext');
  var authentication     = $injector.get('authentication');
  var tokenStore         = $injector.get('tokenStore');
  var notification       = $injector.get('notification');
  var analytics          = $injector.get('analytics');
  var analyticsEvents    = $injector.get('analyticsEvents');
  var authorization      = $injector.get('authorization');
  var modalDialog        = $injector.get('modalDialog');
  var presence           = $injector.get('presence');
  var enforcements       = $injector.get('enforcements');
  var revision           = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var OrganizationList   = $injector.get('OrganizationList');
  var spaceTools         = $injector.get('spaceTools');
  var iframeChannel      = $injector.get('iframeChannel');

  // TODO remove this eventually. All components should access it as a service
  $scope.spaceContext = spaceContext;

  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function() {
      var showAuxPanel = !$scope.preferences.showAuxPanel;
      $scope.preferences.showAuxPanel = showAuxPanel;
      analyticsEvents.trackToggleAuxPanel(showAuxPanel, $state.current.name);
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function () {
    return {
      space: spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, spaceAndTokenWatchHandler);

  var off = tokenStore.changed.attach(handleTokenData);
  $scope.$on('$destroy', off);
  off = iframeChannel.message.attach(handlePostMessage);
  $scope.$on('$destroy', off);

  // @todo remove it - temporary proxy event handler
  $scope.$on('showCreateSpaceDialog', showCreateSpaceDialog);

  $scope.initClient = initClient;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;

  function initClient() {
    tokenStore.refresh();

    setTimeout(newVersionCheck, 5000);

    setInterval(function () {
      if (presence.isActive()) {
        newVersionCheck();
        tokenStore.refresh().
        catch(function () {
          ReloadNotification.trigger('Your authentication data needs to be refreshed. Please try logging in again.');
        });
      }
    }, 5 * 60 * 1000);
  }

  function spaceAndTokenWatchHandler(collection) {
    if (collection.tokenLookup) {
      authorization.setTokenLookup(collection.tokenLookup);
      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId())) {
        authorization.setSpace(collection.space);
      }
    }
  }

  function handlePostMessage(data) {
    var msg = makeMsgResponder(data);

    if (msg('create', 'UserCancellation')) {
      authentication.goodbye();

    } else if (msg('new', 'space')) {
      $scope.showCreateSpaceDialog();

    } else if (msg('delete', 'space')) {
      spaceTools.leaveCurrent();

    } else if (data.type === 'flash') {
      showFlashMessage(data);

    } else if (msg('navigate', 'location')) {
      $location.url(data.path);

    } else if (msg('update', 'location')) {
      return;

    } else if (data.token) {
      updateToken(data.token);

    } else {
      tokenStore.refresh();
    }
  }

  function makeMsgResponder(data) {
    //console.log('iframe message: ', data);
    return function msg(action, type) {
      return data &&
        data.action && data.action.toLowerCase() === action.toLowerCase() &&
        data.type && data.type.toLowerCase() === type.toLowerCase();
    };
  }

  function showFlashMessage(data) {
    var level = data.resource.type;
    if (level && level.match(/error/)) level = 'warn';
    else if (level && !level.match(/info/) || !level) level = 'info';
    notification[level](data.resource.message);
  }

  function updateToken(data) {
    authentication.updateTokenLookup(data);
    if(authentication.tokenLookup) {
      tokenStore.refreshWithLookup(authentication.tokenLookup);
    } else {
      logger.logError('Token Lookup has not been set properly', {
        data: {
          iframeData: data
        }
      });
    }
  }

  function handleTokenData(token) {
    var user = dotty.get(token, 'user');
    if (!_.isObject(user)) { return; }

    $scope.user = user;
    enforcements.setUser(user);
    OrganizationList.resetWithUser(user);

    if (features.allowAnalytics(user)) {
      logger.enable(user);
      analytics.enable(user);
    } else {
      logger.disable();
      analytics.disable();
    }
  }

  function newVersionCheck() {
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

  function showCreateSpaceDialog() {
    analytics.track('Clicked Create-Space');
    modalDialog.open({
      title: 'Space templates',
      template: 'create_new_space_dialog',
      backgroundClose: false,
      persistOnNavigation: true
    })
    .promise
    .then(handleSpaceCreationSuccess)
    .catch(function() {
      analytics.track('Closed Space Template Selection Modal');
      refreshContentTypes();
    });
  }

  function handleSpaceCreationSuccess (template) {
    if (template) {
      analytics.track('Created Space Template', {template: template.name});
      $rootScope.$broadcast('reloadEntries');
      refreshContentTypes();
    }
  }

  function refreshContentTypes() {
    $timeout(function () {
      spaceContext.refreshContentTypes();
    }, 1000);
  }

}]);
