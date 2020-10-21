import React from 'react';
import { css } from 'emotion';

import { SectionHeading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  currentSpaceLabel: css({
    lineHeight: '40px', // necessary to align the label with the other buttons
    color: tokens.colorTextMid,
    marginBottom: 0,
  }),
};

export function CurrentSpaceLabel() {
  return (
    <SectionHeading className={styles.currentSpaceLabel} element="p">
      <span role="img" aria-label="Pin">
        📍
      </span>{' '}
      Current space
    </SectionHeading>
  );
}
