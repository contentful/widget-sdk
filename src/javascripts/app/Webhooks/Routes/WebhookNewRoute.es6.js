import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';

const ServicesConsumer = require('../../../reactServiceContext').default;

export class WebhookNewRoute extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      spaceContext: PropTypes.object.isRequired
    }).isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  state = {
    webhook: { headers: [], topics: ['*.*'] }
  };

  render() {
    return (
      <WebhookEditor
        initialWebhook={this.state.webhook}
        webhookRepo={this.props.$services.spaceContext.webhookRepo}
        registerSaveAction={this.props.registerSaveAction}
        setDirty={this.props.setDirty}
      />
    );
  }
}

export default ServicesConsumer('spaceContext')(WebhookNewRoute);
