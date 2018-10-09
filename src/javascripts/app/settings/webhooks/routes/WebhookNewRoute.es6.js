import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';
import AdminOnly from 'app/common/AdminOnly.es6';

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
        <WebhookEditor
          initialWebhook={this.state.webhook}
          registerSaveAction={this.props.registerSaveAction}
          setDirty={this.props.setDirty}
        />
      </AdminOnly>
    );
  }
}

export default WebhookNewRoute;
