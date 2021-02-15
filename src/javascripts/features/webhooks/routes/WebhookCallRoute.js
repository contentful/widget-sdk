import React from 'react';
import PropTypes from 'prop-types';
import { WebhookCall } from '../WebhookCall';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import { getSectionVisibility } from 'access_control/AccessChecker';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { getWebhookRepo } from '../services/WebhookRepoInstance';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { go } from 'states/Navigator';

const WebhookCallFetcher = createFetcherComponent((props) => {
  const { webhookId, callId, spaceId } = props;
  const webhookRepo = getWebhookRepo({ spaceId });

  return Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]);
});

export function WebhookCallRoute(props) {
  const { currentSpaceId } = useSpaceEnvContext();

  function onGoBack() {
    return go({ path: '^' });
  }

  if (!getSectionVisibility()['webhooks']) {
    return <ForbiddenPage />;
  }

  return (
    <WebhookCallFetcher {...props} spaceId={currentSpaceId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <WebhookSkeletons.WebhookLoading />;
        }
        if (isError) {
          return <StateRedirect path="^.^.detail" />;
        }
        const [webhook, call] = data;
        return <WebhookCall webhook={webhook} call={call} onGoBack={onGoBack} />;
      }}
    </WebhookCallFetcher>
  );
}

WebhookCallRoute.propTypes = {
  webhookId: PropTypes.string.isRequired,
  callId: PropTypes.string.isRequired,
};
