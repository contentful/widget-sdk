import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getModule } from 'NgRegistry.es6';
import LocalesListPricingOne from '../LocalesListPricingOne.es6';
import LocalesListPricingTwo from '../LocalesListPricingTwo.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import { isLegacyOrganization } from 'utils/ResourceUtils.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createLegacyFeatureService from 'services/LegacyFeatureService.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { getSubscriptionState } from 'account/AccountUtils.es6';
import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';
import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags.es6';

const spaceContext = getModule('spaceContext');
const ResourceService = getModule('services/ResourceService.es6');
const OrganizationRoles = getModule('services/OrganizationRoles.es6');

const LocalesFetcher = createFetcherComponent(() => {
  const createResourceService = ResourceService.default;

  return Promise.all([
    spaceContext.localeRepo.getAll(),
    isLegacyOrganization(spaceContext.organization),
    createResourceService(spaceContext.getId()).get('locale', spaceContext.getEnvironmentId()),
    createLegacyFeatureService(spaceContext.getId()).get('multipleLocales'),
    OrganizationRoles.isOwnerOrAdmin(spaceContext.organization),
    spaceContext.isMasterEnvironment(),
    getSpaceFeature(spaceContext.getId(), ENVIRONMENT_USAGE_ENFORCEMENT),
    _.get(spaceContext.organization, ['subscriptionPlan', 'name'])
  ]);
});

class LocalesListRoute extends React.Component {
  static propTypes = {
    showUpgradeSpaceDialog: PropTypes.func.isRequired,
    getComputeLocalesUsageForOrganization: PropTypes.func.isRequired
  };

  render() {
    if (!getSectionVisibility()['locales']) {
      return <ForbiddenPage />;
    }

    return (
      <React.Fragment>
        <DocumentTitle title="Locales" />
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
              isLegacy,
              localeResource,
              isMultipleLocalesFeatureEnabled,
              isOwnerOrAdmin,
              insideMasterEnv,
              allowedToEnforceLimits,
              subscriptionPlanName
            ] = data;
            if (isLegacy) {
              return (
                <LocalesListPricingOne
                  locales={locales}
                  canCreateMultipleLocales={isMultipleLocalesFeatureEnabled}
                  canChangeSpace={isOwnerOrAdmin}
                  localeResource={localeResource}
                  subscriptionState={getSubscriptionState()}
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
                allowedToEnforceLimits={allowedToEnforceLimits}
                canChangeSpace={isOwnerOrAdmin}
                localeResource={localeResource}
                subscriptionState={getSubscriptionState()}
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
      </React.Fragment>
    );
  }
}

export default LocalesListRoute;
