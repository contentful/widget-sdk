import React from 'react';
import PropTypes from 'prop-types';
import WebhookCall from '../WebhookCall.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { getWebhookRepo } from 'app/settings/webhooks/services/WebhookRepoInstance';

const WebhookCallFetcher = createFetcherComponent(props => {
  const { webhookId, callId } = props;
  const webhookRepo = getWebhookRepo();

  return Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]);
});

export class WebhookCallRoute extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string.isRequired,
    callId: PropTypes.string.isRequired,
    onGoBack: PropTypes.func.isRequired
  };

  render() {
    if (!getSectionVisibility()['webhooks']) {
      return <ForbiddenPage />;
    }
    return (
      <WebhookCallFetcher {...this.props}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading webhook call..." />;
          }
          if (isError) {
            return <StateRedirect to="^.^.detail" />;
          }
          const [webhook, call] = data;
          return <WebhookCall webhook={webhook} call={call} onGoBack={this.props.onGoBack} />;
        }}
      </WebhookCallFetcher>
    );
  }
}

export default WebhookCallRoute;
