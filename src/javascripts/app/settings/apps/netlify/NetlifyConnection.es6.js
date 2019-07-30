import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Button, Subheading, Paragraph, TextLink } from '@contentful/forma-36-react-components';

const styles = {
  section: css({
    marginBottom: tokens.spacingXl
  }),
  connectAccountButton: css({
    marginTop: tokens.spacingM
  })
};

export default class NetlifyConnection extends Component {
  static propTypes = {
    connected: PropTypes.bool.isRequired,
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
      <div className={styles.section}>
        <Subheading element="h3">Netlify account</Subheading>
        <Paragraph>
          Connect your Netlify account so you can trigger builds and view status in the Contentful
          Web App.
        </Paragraph>
        <Button
          className={styles.connectAccountButton}
          buttonType="primary"
          onClick={this.props.onConnectClick}>
          Connect account
        </Button>
      </div>
    );
  }

  renderConnectionInfo() {
    const { unavailable, buildable } = this.props.netlifyCounts;

    return (
      <div className={styles.section}>
        <Subheading element="h3">Netlify account</Subheading>
        <Paragraph>
          Netlify account: <code>{this.props.email}</code>.
        </Paragraph>
        {unavailable > 0 && (
          <Paragraph>
            {unavailable} sites we can’t build (no Continuous Deployment configuration).{' '}
            <TextLink href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">
              View more in Netlify App
            </TextLink>
          </Paragraph>
        )}
        {buildable > 0 && <Paragraph>{buildable} sites we can build</Paragraph>}
        {buildable < 1 && (
          <Paragraph>
            There are no sites we can build. Navigate to the{' '}
            <TextLink href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">
              Netlify App
            </TextLink>{' '}
            to create one!
          </Paragraph>
        )}
      </div>
    );
  }
}
