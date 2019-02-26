import React from 'react';
import PropTypes from 'prop-types';
import WebhookCall from '../WebhookCall.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';

const WebhookCallFetcher = createFetcherComponent(props => {
  const { webhookRepo, webhookId, callId } = props;

  return Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]);
});

export class WebhookCallRoute extends React.Component {
  static propTypes = {
    webhookRepo: PropTypes.shape({
      get: PropTypes.func.isRequired,
      logs: PropTypes.shape({
        getCall: PropTypes.func.isRequired
      }).isRequired
    }).isRequired,
    webhookId: PropTypes.string.isRequired,
    callId: PropTypes.string.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <WebhookCallFetcher {...this.props}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading webhook call..." />;
            }
            if (isError) {
              return <StateRedirect to="^.^.detail" />;
            }
            const [webhook, call] = data;
            return <WebhookCall webhook={webhook} call={call} />;
          }}
        </WebhookCallFetcher>
      </AdminOnly>
    );
  }
}

export default WebhookCallRoute;
