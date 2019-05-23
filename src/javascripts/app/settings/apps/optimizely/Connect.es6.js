import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import {
  Heading,
  Paragraph,
  HelpText,
  TextLink,
  TextField,
  Button
} from '@contentful/forma-36-react-components';

const styles = {
  form: css({
    marginTop: tokens.spacingM,
    display: 'grid',
    gridTemplateColumns: 'auto 12rem',
    gridColumnGap: tokens.spacingS
  }),
  button: css({
    marginTop: '1.8rem'
  }),
  deepLink: css({
    marginTop: tokens.spacingS
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
          <div>
            <TextField
              id="pat"
              name="pat"
              labelText="Personal Access Token"
              textInputProps={{ type: 'password', disabled: isConnected || isConnecting }}
              value={pat}
              onChange={onPATChange}
              required
            />
            <HelpText className={styles.deepLink}>
              Get a personal access token in the{' '}
              <TextLink href="https://app.optimizely.com/v2/profile/api">
                Optimizely web app
              </TextLink>
              .
            </HelpText>
          </div>
          <div className={styles.button}>
            <ConnectButton
              isConnecting={isConnecting}
              isConnected={isConnected}
              onClickConnect={onClickConnect}
              onClickDisconnect={onClickDisconnect}
            />
          </div>
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
