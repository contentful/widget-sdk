'use strict';

angular.module('contentful')

.directive('cfSpaceSettings', [function () {
  return {
    template: JST['space_settings'](),
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}])

.controller('SpaceSettingsController', ['$injector', '$scope', function ($injector, $scope) {

  var $q                 = $injector.get('$q');
  var $rootScope         = $injector.get('$rootScope');
  var spaceContext       = $injector.get('spaceContext');
  var client             = $injector.get('client');
  var Command            = $injector.get('command');
  var tokenStore         = $injector.get('tokenStore');
  var spaceTools         = $injector.get('spaceTools');
  var modalDialog        = $injector.get('modalDialog');
  var notification       = $injector.get('notification');
  var ReloadNotification = $injector.get('ReloadNotification');

  $scope.context.ready = true;
  $scope.spaceId = spaceContext.space.getId();
  $scope.model = {name: spaceContext.space.data.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  function save() {
    return endpoint().payload($scope.model)
    .headers(header())
    .put()
    .then(function () {
      notification.info('Space renamed to ' + $scope.model.name + ' successfully.');
    })
    .then(tokenStore.refresh)
    .catch(handleSaveError);
  }

  function handleSaveError(err) {
    if (dotty.get(err, 'body.details.errors', []).length > 0) {
      notification.error('Please provide a valid space name.');
    } else {
      ReloadNotification.basicErrorHandler();
    }
  }

  function remove() {
    return endpoint().delete()
    .then(function () {
      notification.info('Space ' + $scope.model.name + ' deleted successfully.');
    })
    .then(tokenStore.refresh)
    .then(spaceTools.leaveCurrent)
    .catch(ReloadNotification.basicErrorHandler);
  }

  function endpoint() {
    return client.endpoint('spaces', spaceContext.space.getId());
  }

  function header() {
    return {'X-Contentful-Version': spaceContext.space.getVersion()};
  }

  function isSaveDisabled() {
    var input = dotty.get($scope, 'model.name');
    var currentName = dotty.get(spaceContext, 'space.data.name');

    return !input || input === currentName;
  }

  function openRemovalDialog() {
    var space = spaceContext.space;
    var scope = _.extend($rootScope.$new(), {
      space: space,
      input: {spaceName: ''},
      remove: Command.create(remove, {
        disabled: function () {
          return scope.input.spaceName !== space.data.name;
        }
      })
    });

    modalDialog.open({
      template: 'space_removal_dialog',
      noNewScope: true,
      scope: scope
    });

    return $q.when();
  }
}]);
