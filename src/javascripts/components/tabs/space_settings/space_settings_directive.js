angular.module('contentful')

.directive('cfSpaceSettings', ['require', require => {
  const renderString = require('ui/Framework').renderString;
  const templates = require('components/tabs/space_settings/space_settings_templates');

  return {
    template: renderString(templates.form()),
    restrict: 'E',
    controller: 'SpaceSettingsController'
  };
}])

.controller('SpaceSettingsController', ['require', '$scope', function (require, $scope) {
  const $state = require('$state');
  const spaceContext = require('spaceContext');
  const Command = require('command');
  const TokenStore = require('services/TokenStore');
  const notification = require('notification');
  const ReloadNotification = require('ReloadNotification');
  const openDeleteSpaceDialog = require('services/DeleteSpace').openDeleteSpaceDialog;
  const getSingleSpacePlan = require('account/pricing/PricingDataProvider').getSingleSpacePlan;
  const createOrganizationEndpoint = require('data/EndpointFactory').createOrganizationEndpoint;

  let space = spaceContext.space.data;

  $scope.context.ready = true;
  $scope.spaceId = space.sys.id;
  $scope.model = {name: space.name};
  $scope.save = Command.create(save, {disabled: isSaveDisabled});
  $scope.openRemovalDialog = Command.create(openRemovalDialog);

  async function openRemovalDialog () {
    const orgEndpoint = createOrganizationEndpoint(spaceContext.organizationContext.organization.sys.id);
    let plan;

    try {
      plan = await getSingleSpacePlan(orgEndpoint, spaceContext.space.getId());
    } catch (e) {
      // spaces on the old pricing model don't have a space plan
      // the the promise gets rejected
    } finally {
      openDeleteSpaceDialog({
        space,
        plan,
        onSuccess: () => $state.go('home')
      });
    }
  }

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
    const input = _.get($scope, 'model.name');
    const currentName = _.get(space, 'name');

    return !input || input === currentName;
  }
}]);
