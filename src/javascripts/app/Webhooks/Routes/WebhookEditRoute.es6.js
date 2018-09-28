import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor.es6';

const ServicesConsumer = require('../../../reactServiceContext').default;

export class WebhookEditRoute extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      spaceContext: PropTypes.object.isRequired,
      $state: PropTypes.object.isRequired
    }).isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    webhookId: PropTypes.string.isRequired
  };

  state = {};

  componentDidMount() {
    this.props.$services.spaceContext.webhookRepo
      .get(this.props.webhookId)
      .then(webhook => {
        this.setState({ webhook });
      })
      .catch(() => {
        this.props.$services.$state.go('^.list');
      });
  }

  render() {
    if (!this.state.webhook) {
      return (
        <div className="loading-box--stretched">
          <div className="loading-box__spinner" />
          <div className="loading-box__message">Loading webhook...</div>
        </div>
      );
    }
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

export default ServicesConsumer('spaceContext', '$state')(WebhookEditRoute);
