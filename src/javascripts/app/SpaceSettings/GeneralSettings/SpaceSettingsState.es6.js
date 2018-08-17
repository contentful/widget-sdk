import { openDeleteSpaceDialog } from 'services/DeleteSpace';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import * as TokenStore from 'services/TokenStore';

export default {
  name: 'space',
  url: '/space',
  template:
    '<react-component name="app/SpaceSettings/GeneralSettings/SpaceSettingsContainer" props="props" />',
  controller: [
    'spaceContext',
    '$scope',
    (spaceContext, $scope) => {
      const getSpacePlan = async () => {
        const organization = spaceContext.organizationContext.organization;
        const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
        let plan;
        try {
          plan = await getSingleSpacePlan(
            orgEndpoint,
            spaceContext.space.getId()
          );
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
