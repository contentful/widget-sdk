import React from 'react';
import { get } from 'lodash';
import { getModule } from 'core/NgRegistry';
import ReloadNotification from 'app/common/ReloadNotification';
import DocumentTitle from 'components/shared/DocumentTitle';
import * as TokenStore from 'services/TokenStore';
import { Notification } from '@contentful/forma-36-react-components';
import { SpaceSettings } from '../components/SpaceSettings';
import { openDeleteSpaceDialog } from '../services/DeleteSpace';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { beginSpaceChange, getNotificationMessage } from 'services/ChangeSpaceService';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';

import { Spinner } from '@contentful/forma-36-react-components';
import { getSpaceVersion, getOrganization } from 'core/services/SpaceEnvContext/utils';
import APIClient from 'data/APIClient';

export class SpaceSettingsRoute extends React.Component {
  state = { plan: null, isLoading: true };

  static contextType = SpaceEnvContext;

  async componentDidMount() {
    const plan = await this.getSpacePlan();
    this.setState({ plan: plan, isLoading: false });
  }

  getSpacePlan = async () => {
    const { currentSpaceId, currentOrganizationId } = this.context;
    const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
    let plan;
    try {
      plan = await getSingleSpacePlan(orgEndpoint, currentSpaceId);
    } catch (e) {
      // await getSingleSpacePlan throws for spaces on the old pricing
      // because they don't have a space plan. We catch it, dialog can handle lack of plan
    }

    return plan;
  };

  handleSaveError = (err) => {
    if (get(err, ['data', 'details', 'errors'], []).length > 0) {
      Notification.error('Please provide a valid space name.');
    } else if (get(err, ['data', 'sys', 'id']) === 'Conflict') {
      Notification.error(
        'Unable to update space: Your data is outdated. Please reload and try again'
      );
    } else {
      ReloadNotification.basicErrorHandler();
    }
  };

  save = (newName) => {
    const { currentSpace, currentSpaceId, currentEnvironmentId } = this.context;
    const currentSpaceVersion = getSpaceVersion(currentSpace);
    const spaceEndpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
    const cma = new APIClient(spaceEndpoint);
    const spaceContext = getModule('spaceContext'); // TODO: Only `resetWithSpace` needs it for now

    return cma
      .renameSpace(newName, currentSpaceVersion)
      .then(() => TokenStore.refresh())
      .then(() => TokenStore.getSpace(currentSpaceId))
      .then((newSpace) => spaceContext.resetWithSpace(newSpace))
      .then(() => {
        const $rootScope = getModule('$rootScope');
        $rootScope.$applyAsync();
        // re-render view with new space object
        this.forceUpdate();
        Notification.success(`Space renamed to ${newName} successfully.`);
      })
      .catch(this.handleSaveError);
  };

  openRemovalDialog = () => {
    const $state = getModule('$state');

    this.getSpacePlan().then((plan) => {
      openDeleteSpaceDialog({
        space: this.context.currentSpaceData,
        plan,
        onSuccess: () => $state.go('home'),
      });
    });
  };

  changeSpaceDialog = async () => {
    const { currentSpaceId, currentOrganizationId } = this.context;
    const space = await TokenStore.getSpace(currentSpaceId);

    trackCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
      organizationId: currentOrganizationId,
      spaceId: currentSpaceId,
    });

    beginSpaceChange({
      organizationId: currentOrganizationId,
      space,
      onSubmit: async (newProductRatePlan) => {
        Notification.success(getNotificationMessage(space, this.state.plan, newProductRatePlan));
        this.setState({ plan: newProductRatePlan });
      },
    });
  };

  render() {
    const { currentSpace, currentSpaceName, currentSpaceId } = this.context;
    const organization = getOrganization(currentSpace);

    return (
      <React.Fragment>
        <DocumentTitle title="Settings" />
        {this.state.isLoading && (
          <EmptyStateContainer data-test-id="loading-spinner">
            <Spinner size="large" />
          </EmptyStateContainer>
        )}

        {!this.state.isLoading && (
          <SpaceSettings
            save={this.save}
            onRemoveClick={this.openRemovalDialog}
            spaceName={currentSpaceName}
            plan={this.state.plan}
            onChangeSpace={this.changeSpaceDialog}
            spaceId={currentSpaceId}
            showDeleteButton={isOwnerOrAdmin(organization)}
            showChangeButton={isOwnerOrAdmin(organization)}
          />
        )}
      </React.Fragment>
    );
  }
}
