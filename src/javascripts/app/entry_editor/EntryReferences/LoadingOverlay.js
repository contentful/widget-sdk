import React from 'react';
import PropTypes from 'prop-types';
import { Spinner, Subheading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { pluralize } from './utils';

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

const renderReferenceAmount = (referencesAmount) =>
  referencesAmount ? `${referencesAmount} ${pluralize(referencesAmount, 'reference')}` : null;

const LoadingOverlay = ({ actionName, entityTitle, referencesAmount }) => {
  const references = [entityTitle, renderReferenceAmount(referencesAmount)]
    .filter((str) => str)
    .join(' and ');

  return (
    <div className={styles.overlay}>
      <div>
        <Subheading element="p" className={styles.description}>
          <Spinner className={styles.spinner} />
          {actionName} {references}
        </Subheading>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  actionName: PropTypes.string,
  entityTitle: PropTypes.string,
  referencesAmount: PropTypes.number,
};

export default LoadingOverlay;
