import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { LoadingEmptyState } from './LoadingEmptyState';

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
};

interface LoadingOverlayProps {
  testId?: string;
}

export function LoadingOverlay({ testId }: LoadingOverlayProps): React.ReactElement {
  return (
    <div className={styles.overlay}>
      <LoadingEmptyState testId={testId} />
    </div>
  );
}
