import React from 'react';
import PropTypes from 'prop-types';
import { WebhookCall } from '../WebhookCall';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import { getSectionVisibility } from 'access_control/AccessChecker';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { getWebhookRepo } from '../services/WebhookRepoInstance';

const WebhookCallFetcher = createFetcherComponent((props) => {
  const { webhookId, callId } = props;
  const webhookRepo = getWebhookRepo();

  return Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]);
});

export class WebhookCallRoute extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string.isRequired,
    callId: PropTypes.string.isRequired,
    onGoBack: PropTypes.func.isRequired,
  };

  render() {
    if (!getSectionVisibility()['webhooks']) {
      return <ForbiddenPage />;
    }
    return (
      <WebhookCallFetcher {...this.props}>
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
