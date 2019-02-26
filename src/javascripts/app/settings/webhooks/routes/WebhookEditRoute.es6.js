import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';

const WebhookFetcher = createFetcherComponent(props => {
  const { webhookRepo, webhookId } = props;

  return webhookRepo.get(webhookId);
});

export class WebhookEditRoute extends React.Component {
  static propTypes = {
    webhookRepo: PropTypes.shape({ get: PropTypes.func.isRequired }).isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    webhookId: PropTypes.string.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <WebhookFetcher webhookId={this.props.webhookId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading webhook..." />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            return (
              <WebhookEditor
                initialWebhook={data}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
              />
            );
          }}
        </WebhookFetcher>
      </AdminOnly>
    );
  }
}

export default WebhookEditRoute;
