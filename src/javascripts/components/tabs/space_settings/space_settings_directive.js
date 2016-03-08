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
  var Command            = $injector.get('command');
  var tokenStore         = $injector.get('tokenStore');
  var spaceTools         = $injector.get('spaceTools');
  var modalDialog        = $injector.get('modalDialog');
  var notification       = $injector.get('notification');
  var ReloadNotification = $injector.get('ReloadNotification');
  var repo               = $injector.get('SpaceSettingsController/createRepo').call();

  $scope.context.ready = true;
  $scope.spaceId = spaceContext.space.getId();
  $scope.model = {name: spaceContext.space.data.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  function save() {
    return repo.rename($scope.model.name)
    .then(tokenStore.refresh)
    .then(function () {
      notification.info('Space renamed to ' + $scope.model.name + ' successfully.');
    })
    .catch(handleSaveError);
  }

  function handleSaveError(err) {
    if (dotty.get(err, 'data.details.errors', []).length > 0) {
      notification.error('Please provide a valid space name.');
    } else {
      ReloadNotification.basicErrorHandler();
    }
  }

  function remove() {
    return repo.remove()
    .then(tokenStore.refresh)
    .then(spaceTools.leaveCurrent)
    .then(function () {
      notification.info('Space ' + $scope.model.name + ' deleted successfully.');
    })
    .catch(ReloadNotification.basicErrorHandler);
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
}])

.factory('SpaceSettingsController/createRepo', ['$injector', function ($injector) {

  var spaceContext   = $injector.get('spaceContext');
  var spaceEndpoint  = $injector.get('data/spaceEndpoint');
  var authentication = $injector.get('authentication');
  var environment    = $injector.get('environment');

  return function createSpaceRepo() {
    var makeRequest = spaceEndpoint.create(
      authentication.token,
      '//' + environment.settings.api_host,
      spaceContext.space.getId()
    );

    return {
      rename: rename,
      remove: remove
    };

    function rename(newName) {
      return makeRequest({
        method: 'PUT',
        version: spaceContext.space.getVersion(),
        data: {name: newName}
      });
    }

    function remove() {
      return makeRequest({method: 'DELETE'});
    }
  };
}]);
