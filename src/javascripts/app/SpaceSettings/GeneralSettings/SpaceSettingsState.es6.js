import { openDeleteSpaceDialog } from 'services/DeleteSpace.es6';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import * as TokenStore from 'services/TokenStore.es6';

export default {
  name: 'space',
  url: '/space',
  template:
    '<react-component name="app/SpaceSettings/GeneralSettings/SpaceSettingsContainer.es6" props="props" />',
  controller: [
    'spaceContext',
    '$scope',
    (spaceContext, $scope) => {
      const getSpacePlan = async () => {
        const orgId = spaceContext.organization.sys.id;
        const orgEndpoint = createOrganizationEndpoint(orgId);
        let plan;
        try {
          plan = await getSingleSpacePlan(orgEndpoint, spaceContext.space.getId());
        } catch (e) {
          // await getSingleSpacePlan throws for spaces on the old pricing
          // because they don't have a space plan. We catch it, dialog can handle lack of plan
        }
        return plan;
      };

      const renameSpace = (newName, spaceVersion) => {
        return spaceContext.cma
          .renameSpace(newName, spaceVersion)
          .then(() => {
            TokenStore.refresh();
            return TokenStore.getSpace(spaceContext.space.data.sys.id);
          })
          .then(newSpace => spaceContext.resetWithSpace(newSpace));
      };

      $scope.props = {
        getSpace: () => spaceContext.space,
        getSpacePlan,
        renameSpace,
        openDeleteSpaceDialog
      };
    }
  ]
};
