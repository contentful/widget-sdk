import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { Heading, Paragraph, TextField, Button } from '@contentful/forma-36-react-components';

const styles = {
  form: css({
    marginTop: tokens.spacingM,
    display: 'grid',
    gridTemplateColumns: 'auto 12rem',
    gridColumnGap: tokens.spacingS,
    alignItems: 'end'
  })
};

ConnectButton.propTypes = {
  isConnecting: PropTypes.bool.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onClickConnect: PropTypes.func.isRequired,
  onClickDisconnect: PropTypes.func.isRequired
};

Connect.propTypes = {
  ...ConnectButton.propTypes,
  pat: PropTypes.string.isRequired,
  onPATChange: PropTypes.func.isRequired
};

export default function Connect({
  isConnecting,
  isConnected,
  pat,
  onPATChange,
  onClickConnect,
  onClickDisconnect
}) {
  return (
    <div className="f36-margin-top--xl">
      <Heading>Connect Optimizely</Heading>
      <Paragraph className="f36-margin-top--m">
        Connect your Optimizely account to get started.
        <section className={styles.form}>
          <TextField
            id="pat"
            name="pat"
            labelText="Personal Access Token"
            textInputProps={{ type: 'password', disabled: isConnected || isConnecting }}
            value={pat}
            onChange={onPATChange}
            required
          />
          <ConnectButton
            isConnecting={isConnecting}
            isConnected={isConnected}
            onClickConnect={onClickConnect}
            onClickDisconnect={onClickDisconnect}
          />
        </section>
      </Paragraph>
    </div>
  );
}

function ConnectButton({ isConnecting, isConnected, onClickConnect, onClickDisconnect }) {
  if (isConnecting) {
    return (
      <Button buttonType="muted" loading={isConnecting} disabled>
        Connecting...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <Button onClick={onClickDisconnect} buttonType="muted">
        Disconnect account
      </Button>
    );
  }

  return (
    <Button onClick={onClickConnect} buttonType="positive">
      Connect account
    </Button>
  );
}
