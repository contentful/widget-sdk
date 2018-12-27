import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

const WebhookFetcher = createFetcherComponent(props => {
  return spaceContext.webhookRepo.get(props.webhookId);
});

export class WebhookEditRoute extends React.Component {
  static propTypes = {
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
