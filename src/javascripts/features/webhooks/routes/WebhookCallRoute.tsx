import React from 'react';
import { WebhookCall } from '../WebhookCall';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import { getSectionVisibility } from 'access_control/AccessChecker';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { getWebhookRepo } from '../services/WebhookRepoInstance';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { useRouteNavigate, RouteNavigate, useParams } from 'core/react-routing';

const WebhookCallFetcher = createFetcherComponent(
  (props: { callId: string; webhookId: string; spaceId: string }) => {
    const { webhookId, callId, spaceId } = props;
    const webhookRepo = getWebhookRepo({ spaceId });

    return Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]);
  }
);

export function WebhookCallRoute() {
  const navigate = useRouteNavigate();
  const { currentSpaceId } = useSpaceEnvContext();

  const { callId, webhookId } = useParams() as { webhookId: string; callId: string };

  function onGoBack() {
    return navigate({ path: 'webhooks.detail', webhookId });
  }

  if (!getSectionVisibility()['webhooks']) {
    return <ForbiddenPage />;
  }

  return (
    <WebhookCallFetcher callId={callId} webhookId={webhookId} spaceId={currentSpaceId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <WebhookSkeletons.WebhookLoading />;
        }
        if (isError) {
          return <RouteNavigate replace route={{ path: 'webhooks.detail', webhookId }} />;
        }
        const [webhook, call] = data;
        return <WebhookCall webhook={webhook} call={call} onGoBack={onGoBack} />;
      }}
    </WebhookCallFetcher>
  );
}
