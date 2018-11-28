import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm } from '@contentful/ui-component-library';

export default class AppUninstallDialog extends Component {
  static propTypes = {
    app: PropTypes.shape({
      title: PropTypes.string.isRequired
    }).isRequired,
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  render() {
    return (
      <ModalConfirm
        title="Uninstall app?"
        confirmLabel="Uninstall"
        intent="negative"
        isShown={this.props.isShown}
        onConfirm={this.props.onConfirm}
        onCancel={this.props.onCancel}>
        <p>
          This will delete <strong>{this.props.app.title}</strong> app and its settings.
        </p>
      </ModalConfirm>
    );
  }
}
