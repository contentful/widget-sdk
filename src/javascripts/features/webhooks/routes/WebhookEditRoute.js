import React from 'react';
import PropTypes from 'prop-types';
import { WebhookEditor } from '../WebhookEditor';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getWebhookRepo } from '../services/WebhookRepoInstance';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { useUnsavedChangesModal } from 'core/hooks/useUnsavedChangesModal/useUnsavedChangesModal';

const WebhookFetcher = createFetcherComponent((props) => {
  const { webhookId, spaceId } = props;
  const webhookRepo = getWebhookRepo({ spaceId });
  return webhookRepo.get(webhookId);
});

export function WebhookEditRoute(props) {
  const { currentSpaceId } = useSpaceEnvContext();
  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

  if (!getSectionVisibility()['webhooks']) {
    return <ForbiddenPage />;
  }

  return (
    <WebhookFetcher webhookId={props.webhookId} spaceId={currentSpaceId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <WebhookSkeletons.WebhookLoading />;
        }
        if (isError) {
          return <StateRedirect path="^.list" />;
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

WebhookEditRoute.propTypes = {
  webhookId: PropTypes.string.isRequired,
};
