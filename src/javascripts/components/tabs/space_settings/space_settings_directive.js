angular
  .module('contentful')

  .directive('cfSpaceSettings', () => ({
    template:
      '<react-component name="components/tabs/space_settings/SpaceSettings" props="props" />',
    restrict: 'E',
    controller: 'SpaceSettingsController'
  }))

  .controller('SpaceSettingsController', [
    'require',
    '$scope',
    function (require, $scope) {
      const $state = require('$state');
      const spaceContext = require('spaceContext');
      const TokenStore = require('services/TokenStore');
      const notification = require('notification');
      const ReloadNotification = require('ReloadNotification');
      const openDeleteSpaceDialog = require('services/DeleteSpace')
        .openDeleteSpaceDialog;
      const getSingleSpacePlan = require('account/pricing/PricingDataProvider')
        .getSingleSpacePlan;
      const createOrganizationEndpoint = require('data/EndpointFactory')
        .createOrganizationEndpoint;

      $scope.context.ready = true;

      let space = spaceContext.space.data;

      function handleSaveError (err) {
        if (_.get(err, 'data.details.errors', []).length > 0) {
          notification.error('Please provide a valid space name.');
        } else if (_.get(err, 'data.sys.id') === 'Conflict') {
          notification.error(
            'Unable to update space: Your data is outdated. Please reload and try again'
          );
        } else {
          ReloadNotification.basicErrorHandler();
        }
      }

      function save (newName) {
        return spaceContext.cma
          .renameSpace(newName, space.sys.version)
          .then(() => {
            TokenStore.refresh();
            return TokenStore.getSpace(space.sys.id);
          })
          .then(space => spaceContext.resetWithSpace(space))
          .then(() => {
            space = spaceContext.space.data;
            notification.info(`Space renamed to ${newName} successfully.`);
          })
          .catch(handleSaveError);
      }

      async function openRemovalDialog () {
        const orgEndpoint = createOrganizationEndpoint(
          spaceContext.organizationContext.organization.sys.id
        );
        let plan;

        try {
          plan = await getSingleSpacePlan(
            orgEndpoint,
            spaceContext.space.getId()
          );
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

      $scope.props = {
        save: save,
        openRemovalDialog: openRemovalDialog,
        spaceName: space.name,
        spaceId: spaceContext.space.getId()
      };
    }
  ]);
