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
import {
  showDialog as showChangeSpaceModal,
  getNotificationMessage,
} from 'services/ChangeSpaceService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { track } from 'analytics/Analytics';
import { getSingleSpacePlan } from 'account/pricing/PricingDataProvider';

import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';

import { Spinner } from '@contentful/forma-36-react-components';

export class SpaceSettingsRoute extends React.Component {
  state = { plan: null, isLoading: true };

  async componentDidMount() {
    const plan = await this.getSpacePlan();
    this.setState({ plan: plan, isLoading: false });
  }

  getSpacePlan = async () => {
    const spaceContext = getModule('spaceContext');

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
    const spaceContext = getModule('spaceContext');

    const space = spaceContext.space;
    return spaceContext.cma
      .renameSpace(newName, space.data.sys.version)
      .then(() => {
        TokenStore.refresh();
        return TokenStore.getSpace(spaceContext.space.data.sys.id);
      })
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
    const spaceContext = getModule('spaceContext');

    this.getSpacePlan().then((plan) => {
      openDeleteSpaceDialog({
        space: spaceContext.space.data,
        plan,
        onSuccess: () => $state.go('home'),
      });
    });
  };

  changeSpaceDialog = async () => {
    const spaceContext = getModule('spaceContext');
    const organizationId = spaceContext.organization.sys.id;
    const space = await TokenStore.getSpace(spaceContext.space.data.sys.id);

    track('space_settings:upgrade_plan_link_clicked', {
      organizationId,
      spaceId: space.sys.id,
    });

    showChangeSpaceModal({
      organizationId,
      scope: 'space',
      space,
      action: 'change',
      onSubmit: async (newProductRatePlan) => {
        Notification.success(getNotificationMessage(space, this.state.plan, newProductRatePlan));
        this.setState({ plan: newProductRatePlan });
      },
    });
  };

  render() {
    const spaceContext = getModule('spaceContext');

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
            spaceName={spaceContext.space.data.name}
            plan={this.state.plan}
            onChangeSpace={this.changeSpaceDialog}
            spaceId={spaceContext.space.getId()}
            showDeleteButton={isOwnerOrAdmin(spaceContext.organization)}
          />
        )}
      </React.Fragment>
    );
  }
}
