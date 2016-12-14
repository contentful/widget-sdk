'use strict';

angular.module('contentful')

.directive('cfSpaceSettings', [function () {
  return {
    template: JST['space_settings'](),
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}])

.controller('SpaceSettingsController', ['$scope', 'require', function ($scope, require) {
  var $q = require('$q');
  var $rootScope = require('$rootScope');
  var $location = require('$location');
  var spaceContext = require('spaceContext');
  var Command = require('command');
  var tokenStore = require('tokenStore');
  var modalDialog = require('modalDialog');
  var notification = require('notification');
  var ReloadNotification = require('ReloadNotification');
  var repo = require('SpaceSettingsController/createRepo').call();

  $scope.context.ready = true;
  $scope.spaceId = spaceContext.space.getId();
  $scope.model = {name: spaceContext.space.data.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  function save () {
    return repo.rename($scope.model.name)
    .then(tokenStore.refresh)
    .then(function () {
      notification.info('Space renamed to ' + $scope.model.name + ' successfully.');
    })
    .catch(handleSaveError);
  }

  function handleSaveError (err) {
    if (dotty.get(err, 'data.details.errors', []).length > 0) {
      notification.error('Please provide a valid space name.');
    } else {
      ReloadNotification.basicErrorHandler();
    }
  }

  function remove () {
    return repo.remove()
    .then(tokenStore.refresh)
    .then(function () {
      tokenStore.refresh();
      $location.url('/');
      notification.info('Space ' + $scope.model.name + ' deleted successfully.');
    })
    .catch(ReloadNotification.basicErrorHandler);
  }

  function isSaveDisabled () {
    var input = dotty.get($scope, 'model.name');
    var currentName = dotty.get(spaceContext, 'space.data.name');

    return !input || input === currentName;
  }

  function openRemovalDialog () {
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

.factory('SpaceSettingsController/createRepo', ['require', function (require) {
  var spaceContext = require('spaceContext');
  var spaceEndpoint = require('data/spaceEndpoint');
  var authentication = require('authentication');
  var environment = require('environment');

  return function createSpaceRepo () {
    var makeRequest = spaceEndpoint.create(
      authentication.token,
      '//' + environment.settings.api_host,
      spaceContext.space.getId()
    );

    return {
      rename: rename,
      remove: remove
    };

    function rename (newName) {
      return makeRequest({
        method: 'PUT',
        version: spaceContext.space.getVersion(),
        data: {name: newName}
      });
    }

    function remove () {
      return makeRequest({method: 'DELETE'});
    }
  };
}]);
