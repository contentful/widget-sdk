import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tag } from '@contentful/forma-36-react-components';

const styles = {
  tag: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: `${tokens.spacing2Xs}`,
  }),
};

export function NavigationItemTag({ label }: { label: string }) {
  return (
    <Tag tagType="primary-filled" size="small" className={styles.tag}>
      {label}
    </Tag>
  );
}
