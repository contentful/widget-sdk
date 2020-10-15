import React from 'react';
import PropTypes from 'prop-types';
import { WebhookCall } from '../WebhookCall';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import { getSectionVisibility } from 'access_control/AccessChecker';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { getWebhookRepo } from '../services/WebhookRepoInstance';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const WebhookCallFetcher = createFetcherComponent((props) => {
  const { webhookId, callId, space, spaceId } = props;
  const webhookRepo = getWebhookRepo({ spaceId, space });

  return Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]);
});

export class WebhookCallRoute extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string.isRequired,
    callId: PropTypes.string.isRequired,
    onGoBack: PropTypes.func.isRequired,
  };

  static contextType = SpaceEnvContext;

  render() {
    const { currentSpaceId, currentSpace } = this.context;

    if (!getSectionVisibility()['webhooks']) {
      return <ForbiddenPage />;
    }
    return (
      <WebhookCallFetcher {...this.props} spaceId={currentSpaceId} space={currentSpace}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <WebhookSkeletons.WebhookLoading />;
          }
          if (isError) {
            return <StateRedirect path="^.^.detail" />;
          }
          const [webhook, call] = data;
          return <WebhookCall webhook={webhook} call={call} onGoBack={this.props.onGoBack} />;
        }}
      </WebhookCallFetcher>
    );
  }
}
