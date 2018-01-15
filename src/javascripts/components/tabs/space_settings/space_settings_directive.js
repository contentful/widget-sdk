angular.module('contentful')

.directive('cfSpaceSettings', ['require', function (require) {
  var renderString = require('ui/Framework').renderString;
  var templates = require('components/tabs/space_settings/space_settings_templates');

  return {
    template: renderString(templates.form()),
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
  var TokenStore = require('services/TokenStore');
  var modalDialog = require('modalDialog');
  var notification = require('notification');
  var ReloadNotification = require('ReloadNotification');
  var templates = require('components/tabs/space_settings/space_settings_templates');

  var space = spaceContext.space.data;

  $scope.context.ready = true;
  $scope.spaceId = space.sys.id;
  $scope.model = {name: space.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  function save () {
    return spaceContext.cma.renameSpace($scope.model.name, space.sys.version)
    .then(function () {
      TokenStore.refresh();
      return TokenStore.getSpace(space.sys.id);
    })
    .then(function (space) {
      return spaceContext.resetWithSpace(space);
    })
    .then(function () {
      space = spaceContext.space.data;
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
    .then(TokenStore.refresh)
    .then(function () {
      $state.go('home');
      notification.info('Space ' + $scope.model.name + ' deleted successfully.');
    })
    .catch(ReloadNotification.basicErrorHandler);
  }

  function isSaveDisabled () {
    var input = _.get($scope, 'model.name');
    var currentName = _.get(space, 'name');

    return !input || input === currentName;
  }

  function openRemovalDialog () {
    var spaceName = space.name;
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
