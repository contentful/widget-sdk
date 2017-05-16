angular.module('contentful')

.directive('cfSpaceSettings', ['require', function (require) {
  var templates = require('components/tabs/space_settings/space_settings_templates');

  return {
    template: templates.form(),
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}])

.controller('SpaceSettingsController', ['require', '$scope', function (require, $scope) {
  var $q = require('$q');
  var $rootScope = require('$rootScope');
  var $state = require('$state');
  var spaceContext = require('spaceContext');
  var Command = require('command');
  var tokenStore = require('tokenStore');
  var modalDialog = require('modalDialog');
  var notification = require('notification');
  var ReloadNotification = require('ReloadNotification');
  var templates = require('components/tabs/space_settings/space_settings_templates');

  $scope.context.ready = true;
  $scope.spaceId = spaceContext.space.getId();
  $scope.model = {name: spaceContext.space.data.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  function save () {
    return spaceContext.cma.renameSpace(
      $scope.model.name,
      spaceContext.space.getVersion()
    )
    .then(tokenStore.refresh)
    .then(function () {
      notification.info('Space renamed to ' + $scope.model.name + ' successfully.');
    })
    .catch(handleSaveError);
  }

  function handleSaveError (err) {
    if (_.get(err, 'data.details.errors', []).length > 0) {
      notification.error('Please provide a valid space name.');
    } else if (_.get(err, 'data.sys.id') === 'Conflict') {
      notification.error('Unable to update space: Your data is outdated. Please reload and try again');
    } else {
      ReloadNotification.basicErrorHandler();
    }
  }

  function remove () {
    return spaceContext.cma.deleteSpace()
    .then(tokenStore.refresh)
    .then(function () {
      $state.go('home');
      notification.info('Space ' + $scope.model.name + ' deleted successfully.');
    })
    .catch(ReloadNotification.basicErrorHandler);
  }

  function isSaveDisabled () {
    var input = _.get($scope, 'model.name');
    var currentName = _.get(spaceContext, 'space.data.name');

    return !input || input === currentName;
  }

  function openRemovalDialog () {
    var spaceName = spaceContext.space.data.name;
    var scope = _.extend($rootScope.$new(), {
      spaceName: spaceName,
      input: {spaceName: ''},
      remove: Command.create(remove, {
        disabled: function () {
          return scope.input.spaceName !== spaceName;
        }
      })
    });

    modalDialog.open({
      template: templates.removalConfirmation(),
      noNewScope: true,
      scope: scope
    });

    return $q.resolve();
  }
}]);
