import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

export class WebhookNewRoute extends React.Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  state = {
    webhook: { headers: [], topics: ['*.*'] }
  };

  render() {
    return (
      <AdminOnly>
        <React.Fragment>
          <DocumentTitle title={['New Webhook', 'Webhooks']} />
          <WebhookEditor
            initialWebhook={this.state.webhook}
            registerSaveAction={this.props.registerSaveAction}
            setDirty={this.props.setDirty}
          />
        </React.Fragment>
      </AdminOnly>
    );
  }
}

export default WebhookNewRoute;
