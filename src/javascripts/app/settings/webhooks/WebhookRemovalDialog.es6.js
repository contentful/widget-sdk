import React from 'react';
import PropTypes from 'prop-types';

const URL_STYLE = {
  margin: '10px 0',
  fontFamily: 'monospace',
  fontSize: '.9em',
  wordWrap: 'break-word'
};

export default class WebhookRemovalDialog extends React.Component {
  static propTypes = {
    webhookUrl: PropTypes.string.isRequired,
    remove: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { busy: false };
  }

  remove = () => {
    const { remove, confirm, cancel } = this.props;
    this.setState({ busy: true });
    return remove().then(confirm, cancel);
  };

  render() {
    const { webhookUrl, cancel } = this.props;

    return (
      <div className="modal-dialog">
        <header className="modal-dialog__header">
          <h1>Remove Webhook</h1>
        </header>
        <div className="modal-dialog__content">
          <div className="modal-dialog__richtext">
            You are about to remove webhook calling the following URL:
            <div style={URL_STYLE}>{webhookUrl}</div>
            After removal your external integrations may stop working properly. Do you want to
            proceed?
          </div>
        </div>
        <div className="modal-dialog__controls">
          <button className="btn-caution" disabled={this.state.busy} onClick={this.remove}>
            Remove
          </button>
          <button className="btn-secondary-action" onClick={cancel}>
            {"Don't remove"}
          </button>
        </div>
      </div>
    );
  }
}
