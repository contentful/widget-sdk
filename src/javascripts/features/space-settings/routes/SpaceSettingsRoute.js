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
import { getSpacePlanForSpace } from 'features/pricing-entities';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { getSpaceContext } from 'classes/spaceContext';

import { LoadingEmptyState } from 'features/loading-state';
import { getSpaceVersion, getOrganization } from 'core/services/SpaceEnvContext/utils';
import APIClient from 'data/APIClient';
import { getUser } from 'access_control/OrganizationMembershipRepository';

export class SpaceSettingsRoute extends React.Component {
  state = { plan: null, isLoading: true };

  static contextType = SpaceEnvContext;

  async componentDidMount() {
    const [plan, createdBy] = await Promise.all([this.getSpacePlan(), this.getCreatedBy()]);

    this.setState({ plan: plan, createdBy, isLoading: false });
  }

  getSpacePlan = async () => {
    const { currentSpaceId, currentOrganizationId } = this.context;
    const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
    let plan;
    try {
      plan = await getSpacePlanForSpace(orgEndpoint, currentSpaceId);
    } catch (e) {
      // await getSpacePlanForSpace throws for spaces on the old pricing
      // because they don't have a space plan. We catch it, dialog can handle lack of plan
    }

    return plan;
  };

  getCreatedBy = async () => {
    const { currentOrganizationId, currentSpaceData } = this.context;
    const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
    try {
      return await getUser(orgEndpoint, currentSpaceData.sys.createdBy.sys.id);
    } catch {
      // user is not a member of the org. just return the link object
      return currentSpaceData.sys.createdBy;
    }
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
    const spaceContext = getSpaceContext(); // TODO: Only `resetWithSpace` needs it for now

    return cma
      .renameSpace(newName, currentSpaceVersion)
      .then(() => TokenStore.refresh())
      .then(() => TokenStore.getSpace(currentSpaceId))
      .then((newSpace) => spaceContext.resetWithSpace(newSpace))
      .then(() => {
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
    const { currentSpace, currentSpaceName, currentSpaceId, currentSpaceData } = this.context;
    const organization = getOrganization(currentSpace);

    return (
      <React.Fragment>
        <DocumentTitle title="Settings" />
        {this.state.isLoading && <LoadingEmptyState testId="loading-spinner" />}

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
            createdAt={currentSpaceData.sys.createdAt}
            createdBy={this.state.createdBy}
          />
        )}
      </React.Fragment>
    );
  }
}
