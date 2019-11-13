import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ModalConfirm } from '@contentful/forma-36-react-components';

export default class NoConnectionUninstallDialog extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  render() {
    return (
      <ModalConfirm
        title="Uninstall app?"
        confirmLabel="Uninstall without Netlify connection"
        intent="negative"
        isShown={this.props.isShown}
        onConfirm={this.props.onConfirm}
        onCancel={this.props.onCancel}>
        <p>
          You are not connected to Netlify right now. You can proceed uninstalling this app but we
          will not be able to perform a clean-up on the Netlify side. It is highly recommended to
          connect to Netlify before uninstalling.
        </p>
      </ModalConfirm>
    );
  }
}
