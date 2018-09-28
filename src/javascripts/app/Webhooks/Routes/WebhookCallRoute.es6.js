import React from 'react';
import PropTypes from 'prop-types';
import WebhookCall from '../WebhookCall.es6';

const ServicesConsumer = require('../../../reactServiceContext').default;

export class WebhookCallRoute extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      spaceContext: PropTypes.object.isRequired
    }).isRequired,
    webhookId: PropTypes.string.isRequired,
    callId: PropTypes.string.isRequired
  };

  state = {};

  componentDidMount() {
    const { webhookId, callId } = this.props;
    const webhookRepo = this.props.$services.spaceContext.webhookRepo;

    Promise.all([webhookRepo.get(webhookId), webhookRepo.logs.getCall(webhookId, callId)]).then(
      ([webhook, call]) => {
        this.setState({ webhook, call });
      }
    );
  }

  render() {
    if (this.state.webhook && this.state.call) {
      return <WebhookCall webhook={this.state.webhook} call={this.state.call} />;
    }
    return (
      <div className="loading-box--stretched">
        <div className="loading-box__spinner" />
        <div className="loading-box__message">Loading webhook call...</div>
      </div>
    );
  }
}

export default ServicesConsumer('spaceContext')(WebhookCallRoute);
