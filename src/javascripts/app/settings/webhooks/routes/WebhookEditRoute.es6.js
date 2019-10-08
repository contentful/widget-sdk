import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { getWebhookRepo } from 'app/settings/webhooks/services/WebhookRepoInstance';

const WebhookFetcher = createFetcherComponent(props => {
  const { webhookId } = props;
  const webhookRepo = getWebhookRepo();
  return webhookRepo.get(webhookId);
});

export class WebhookEditRoute extends React.Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    webhookId: PropTypes.string.isRequired
  };

  render() {
    if (!getSectionVisibility()['webhooks']) {
      return <ForbiddenPage />;
    }
    return (
      <WebhookFetcher webhookId={this.props.webhookId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading webhook..." />;
          }
          if (isError) {
            return <StateRedirect to="^.list" />;
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

export default WebhookEditRoute;
