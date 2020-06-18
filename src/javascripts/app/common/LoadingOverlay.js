import React from 'react';
import PropTypes from 'prop-types';
import { Spinner, Subheading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  overlay: css({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'rgba(255,255,255,.8)',
    top: 0,
    left: 0,
    zIndex: tokens.zIndexNotification,
  }),
  description: css({
    marginBottom: tokens.spacingS,
    display: 'flex',
    alignItems: 'center',
  }),
  spinner: css({
    marginRight: tokens.spacingS,
  }),
};

const LoadingOverlay = ({ message }) => {
  return (
    <div className={styles.overlay}>
      <div>
        <Subheading element="p" className={styles.description}>
          <Spinner className={styles.spinner} />
          {message}
        </Subheading>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  message: PropTypes.string,
};

export default LoadingOverlay;
