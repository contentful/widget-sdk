import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { getModule } from 'NgRegistry';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import LocalesListPricingOne from '../LocalesListPricingOne';
import LocalesListPricingTwo from '../LocalesListPricingTwo';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import StateRedirect from 'app/common/StateRedirect';
import createLegacyFeatureService from 'services/LegacyFeatureService';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSubscriptionState } from 'account/AccountUtils';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags';

import * as OrganizationRoles from 'services/OrganizationRoles';
import * as ResourceService from 'services/ResourceService';

const LocalesFetcher = createFetcherComponent(() => {
  const spaceContext = getModule('spaceContext');

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

function LocalesLoadingShell() {
  return (
    <Workbench testId="locale-list-workbench">
      <Workbench.Header icon={<Icon name="page-settings" scale="0.8" />} title="Locales" />
      <Workbench.Content type="full">
        <SkeletonContainer
          svgWidth={600}
          svgHeight={300}
          ariaLabel="Loading locales..."
          clipId="loading-locales-list">
          <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
        </SkeletonContainer>
      </Workbench.Content>
    </Workbench>
  );
}

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
              return <LocalesLoadingShell />;
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