import React from 'react';
import { css } from 'emotion';
import ContentfulLogo from 'svg/logo-label.svg';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  webAppIconWrapper: css({
    width: '32px',
    height: '32px',
    marginRight: tokens.spacingXs,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  webAppIcon: css({
    // override <AppSwitcher/> style on SVGs
    border: 'none !important',
    borderRadius: '0 !important',
    margin: '0 !important',
  }),
};

export const WebAppSwitcherIcon = () => (
  // eslint-disable-next-line react/react-in-jsx-scope
  <div className={styles.webAppIconWrapper}>
    <ContentfulLogo className={styles.webAppIcon} />
  </div>
);
