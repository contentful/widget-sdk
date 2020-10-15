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
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const WebhookFetcher = createFetcherComponent((props) => {
  const { webhookId, spaceId, space } = props;
  const webhookRepo = getWebhookRepo({ spaceId, space });
  return webhookRepo.get(webhookId);
});

export class WebhookEditRoute extends React.Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    webhookId: PropTypes.string.isRequired,
  };

  static contextType = SpaceEnvContext;

  render() {
    const { currentSpaceId, currentSpace } = this.context;

    if (!getSectionVisibility()['webhooks']) {
      return <ForbiddenPage />;
    }
    return (
      <WebhookFetcher
        webhookId={this.props.webhookId}
        spaceId={currentSpaceId}
        space={currentSpace}>
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
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
              />
            </React.Fragment>
          );
        }}
      </WebhookFetcher>
    );
  }
}
