import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

export default class NetlifyConnection extends Component {
  static propTypes = {
    connected: PropTypes.bool.isRequired,
    installed: PropTypes.bool.isRequired,
    email: PropTypes.string,
    netlifyCounts: PropTypes.shape({
      buildable: PropTypes.number.isRequired,
      unavailable: PropTypes.number.isRequired
    }),
    onConnectClick: PropTypes.func.isRequired
  };

  render() {
    return this.props.connected ? this.renderConnectionInfo() : this.renderConnectButton();
  }

  renderConnectButton() {
    return (
      <div className="netlify-app__section">
        <h3>Connect Netlify</h3>
        <p>
          In order to {this.props.installed ? 'update' : 'install'} Netlify app you need to connect
          with your Netlify account. Your credentials will not leave this browser window and will be
          forgotten as soon as you navigate away from this page.
        </p>
        <Button buttonType="primary" onClick={this.props.onConnectClick}>
          Connect Netlify account
        </Button>
      </div>
    );
  }

  renderConnectionInfo() {
    const { unavailable, buildable } = this.props.netlifyCounts;

    return (
      <div className="netlify-app__section">
        <h3>Netlify connection</h3>
        <p>
          You have successfully connected your Netlify account. The e-mail of the Netlify user is{' '}
          <code>{this.props.email}</code>.
        </p>
        {unavailable > 0 && (
          <p>
            There are {unavailable} sites in your account we cannot build because they do not have
            CI configured. Navigate to the{' '}
            <a href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">
              Netlify Web App
            </a>{' '}
            to find out more.
          </p>
        )}
        {buildable > 0 && (
          <p>
            There are {buildable} sites in your account we can build. Pick some of them in the
            section below!
          </p>
        )}
        {buildable < 1 && (
          <p>
            There are no Netlify sites we can build. Navigate to the{' '}
            <a href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">
              Netlify Web App
            </a>{' '}
            to create one!
          </p>
        )}
      </div>
    );
  }
}
