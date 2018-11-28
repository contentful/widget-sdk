import React from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm } from '@contentful/forma-36-react-components';

const URL_STYLE = {
  margin: '10px 0',
  fontFamily: 'monospace',
  fontSize: '.9em',
  wordWrap: 'break-word'
};

export default class WebhookRemovalDialog extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    webhookUrl: PropTypes.string.isRequired,
    isConfirmLoading: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  render() {
    return (
      <ModalConfirm
        isShown={this.props.isShown}
        title="Remove Webhook"
        intent="negative"
        confirmLabel="Remove"
        cancelLabel="Don't remove"
        isConfirmLoading={this.props.isConfirmLoading}
        confirmTestId="remove-webhook-confirm"
        cancelTestId="remove-webhook-cancel"
        onConfirm={this.props.onConfirm}
        onCancel={this.props.onCancel}>
        <p>You are about to remove webhook calling the following URL:</p>
        <div style={URL_STYLE}>{this.props.webhookUrl}</div>
        <p>
          After removal your external integrations may stop working properly. Do you want to
          proceed?
        </p>
      </ModalConfirm>
    );
  }
}
