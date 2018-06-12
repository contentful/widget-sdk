angular.module('contentful')

.directive('cfSpaceSettings', ['require', require => {
  var renderString = require('ui/Framework').renderString;
  var templates = require('components/tabs/space_settings/space_settings_templates');

  return {
    template: renderString(templates.form()),
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}])

.controller('SpaceSettingsController', ['require', '$scope', function (require, $scope) {
  var $state = require('$state');
  var spaceContext = require('spaceContext');
  var Command = require('command');
  var TokenStore = require('services/TokenStore');
  var notification = require('notification');
  var ReloadNotification = require('ReloadNotification');
  var openRemovalDialog = require('services/DeleteSpace').openDeleteSpaceDialog;
  var getSingleSpacePlan = require('account/pricing/PricingDataProvider').getSingleSpacePlan;
  var createOrganizationEndpoint = require('data/EndpointFactory').createOrganizationEndpoint;

  var space = spaceContext.space.data;

  $scope.context.ready = true;
  $scope.spaceId = space.sys.id;
  $scope.model = {name: space.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(async function () {
    const orgEndpoint = createOrganizationEndpoint(spaceContext.organizationContext.organization.sys.id);
    let plan;

    try {
      plan = await getSingleSpacePlan(orgEndpoint, spaceContext.space.getId());
    } catch (e) {
      // spaces on the old pricing model don't have a space plan
      // the the promise gets rejected
    } finally {
      openRemovalDialog({
        space,
        plan,
        onSuccess: () => $state.go('home')
      });
    }
  });

  function save () {
    return spaceContext.cma.renameSpace($scope.model.name, space.sys.version)
    .then(() => {
      TokenStore.refresh();
      return TokenStore.getSpace(space.sys.id);
    })
    .then(space => spaceContext.resetWithSpace(space))
    .then(() => {
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

  function isSaveDisabled () {
    var input = _.get($scope, 'model.name');
    var currentName = _.get(space, 'name');

    return !input || input === currentName;
  }
}]);
