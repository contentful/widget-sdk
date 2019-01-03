import React from 'react';
import { get } from 'lodash';
import { getModule } from 'NgRegistry.es6';
import SpaceSettings from './SpaceSettings.es6';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification.es6';

const spaceContext = getModule('spaceContext');
const $state = getModule('$state');
const TokenStore = getModule('services/TokenStore.es6');
const DeleteSpace = getModule('services/DeleteSpace.es6');
const PricingDataProvider = getModule('account/pricing/PricingDataProvider.es6');
const EndpointFactory = getModule('data/EndpointFactory.es6');

export class SpaceSettingsRoute extends React.Component {
  getSpacePlan = async () => {
    const orgId = spaceContext.organization.sys.id;
    const orgEndpoint = EndpointFactory.createOrganizationEndpoint(orgId);
    let plan;
    try {
      plan = await PricingDataProvider.getSingleSpacePlan(orgEndpoint, spaceContext.space.getId());
    } catch (e) {
      // await getSingleSpacePlan throws for spaces on the old pricing
      // because they don't have a space plan. We catch it, dialog can handle lack of plan
    }
    return plan;
  };

  handleSaveError = err => {
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

  save = newName => {
    const space = spaceContext.space;
    return spaceContext.cma
      .renameSpace(newName, space.data.sys.version)
      .then(() => {
        TokenStore.refresh();
        return TokenStore.getSpace(spaceContext.space.data.sys.id);
      })
      .then(newSpace => spaceContext.resetWithSpace(newSpace))
      .then(() => {
        // re-render view with new space object
        this.forceUpdate();
        Notification.success(`Space renamed to ${newName} successfully.`);
      })
      .catch(this.handleSaveError);
  };

  openRemovalDialog = () => {
    this.getSpacePlan().then(plan => {
      DeleteSpace.openDeleteSpaceDialog({
        space: spaceContext.space.data,
        plan,
        onSuccess: () => $state.go('home')
      });
    });
  };

  render() {
    return (
      <SpaceSettings
        save={this.save}
        onRemoveClick={this.openRemovalDialog}
        spaceName={spaceContext.space.data.name}
        spaceId={spaceContext.space.getId()}
      />
    );
  }
}

export default SpaceSettingsRoute;
