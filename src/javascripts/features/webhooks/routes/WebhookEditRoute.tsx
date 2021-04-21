import React from 'react';
import { WebhookEditor } from '../WebhookEditor';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getWebhookRepo } from '../services/WebhookRepoInstance';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { useUnsavedChangesModal } from 'core/hooks';
import { useParams, RouteNavigate } from 'core/react-routing';

const WebhookFetcher = createFetcherComponent((props: { spaceId: string; webhookId: string }) => {
  const { webhookId, spaceId } = props;
  const webhookRepo = getWebhookRepo({ spaceId });
  return webhookRepo.get(webhookId);
});

export function WebhookEditRoute() {
  const { webhookId } = useParams() as { webhookId: string };
  const { currentSpaceId } = useSpaceEnvContext();
  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

  if (!getSectionVisibility()['webhooks']) {
    return <ForbiddenPage />;
  }

  return (
    <WebhookFetcher webhookId={webhookId} spaceId={currentSpaceId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <WebhookSkeletons.WebhookLoading />;
        }
        if (isError) {
          return <RouteNavigate route={{ path: 'webhooks.list' }} replace />;
        }
        return (
          <React.Fragment>
            <DocumentTitle title={[data.name, 'Webhooks']} />
            <WebhookEditor
              initialWebhook={data}
              registerSaveAction={registerSaveAction}
              setDirty={setDirty}
            />
          </React.Fragment>
        );
      }}
    </WebhookFetcher>
  );
}
