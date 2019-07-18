import React from 'react';
import { css } from 'emotion';

import { Tag, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    paddingLeft: tokens.spacingL,
    display: 'flex',
    alignItems: 'center',
    lineHeight: '20px' // Make it smaller so it aligns better.
  }),
  label: css({
    paddingLeft: tokens.spacingXs
  })
};

export function NotInstalledTag() {
  return (
    <Tag tagType="negative" className={styles.container}>
      <Icon icon="ErrorCircle" color="negative" />
      <span className={styles.label}>Not installed yet</span>
    </Tag>
  );
}

export function InstalledTag() {
  return (
    <Tag tagType="positive" className={styles.container}>
      <Icon icon="CheckCircle" color="positive" />
      <span className={styles.label}>Installed</span>
    </Tag>
  );
}
