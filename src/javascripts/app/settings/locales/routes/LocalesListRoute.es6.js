import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getModule } from 'NgRegistry.es6';
import LocalesListPricingOne from '../LocalesListPricingOne.es6';
import LocalesListPricingTwo from '../LocalesListPricingTwo.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import * as EnvironmentUtils from 'utils/EnvironmentUtils.es6';

const spaceContext = getModule('spaceContext');
const ResourceUtils = getModule('utils/ResourceUtils.es6');
const ResourceService = getModule('services/ResourceService.es6');
const FeatureService = getModule('services/FeatureService.es6');
const OrganizationRoles = getModule('services/OrganizationRoles.es6');
const TheAccountView = getModule('TheAccountView');

const LocalesFetcher = createFetcherComponent(() => {
  const createResourceService = ResourceService.default;
  const createFeatureService = FeatureService.default;
  return Promise.all([
    spaceContext.localeRepo.getAll(),
    ResourceUtils.useLegacy(spaceContext.organization),
    createResourceService(spaceContext.getId()).get('locale'),
    createFeatureService(spaceContext.getId()).get('multipleLocales'),
    OrganizationRoles.isOwnerOrAdmin(spaceContext.organization),
    EnvironmentUtils.isInsideMasterEnv(spaceContext),
    TheAccountView.getSubscriptionState(),
    _.get(spaceContext.organization, ['subscriptionPlan', 'name'])
  ]);
});

class LocalesListRoute extends React.Component {
  static propTypes = {
    showUpgradeSpaceDialog: PropTypes.func.isRequired,
    getComputeLocalesUsageForOrganization: PropTypes.func.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <LocalesFetcher>
          {({ isLoading, isError, data, fetch }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading locales..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }
            const [
              locales,
              isLegacyOrganization,
              localeResource,
              isMultipleLocalesFeatureEnabled,
              isOwnerOrAdmin,
              insideMasterEnv,
              subscriptionState,
              subscriptionPlanName
            ] = data;
            if (isLegacyOrganization) {
              return (
                <LocalesListPricingOne
                  locales={locales}
                  canCreateMultipleLocales={isMultipleLocalesFeatureEnabled}
                  canChangeSpace={isOwnerOrAdmin}
                  localeResource={localeResource}
                  subscriptionState={subscriptionState}
                  insideMasterEnv={insideMasterEnv}
                  subscriptionPlanName={subscriptionPlanName}
                  getComputeLocalesUsageForOrganization={
                    this.props.getComputeLocalesUsageForOrganization
                  }
                />
              );
            }
            return (
              <LocalesListPricingTwo
                locales={locales}
                canChangeSpace={isOwnerOrAdmin}
                localeResource={localeResource}
                subscriptionState={subscriptionState}
                insideMasterEnv={insideMasterEnv}
                upgradeSpace={() =>
                  this.props.showUpgradeSpaceDialog({
                    onSubmit: () => fetch()
                  })
                }
              />
            );
          }}
        </LocalesFetcher>
      </AdminOnly>
    );
  }
}

export default LocalesListRoute;
