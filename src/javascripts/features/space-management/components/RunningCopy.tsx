import React from 'react';
import { DisplayText, Subheading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  message: css({
    fontWeight: 'normal',
    color: tokens.colorTextLightest,
    fontSize: tokens.fontSizeL,
    marginTop: tokens.spacingL,
  }),
};

export const RunningCopy = () => (
  <>
    <DisplayText>Speedy delivery…</DisplayText>
    <Subheading className={styles.message}>
      We’re setting up your space. This could take up to a minute.
    </Subheading>
  </>
);
