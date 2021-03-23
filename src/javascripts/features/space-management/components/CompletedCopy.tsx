import React from 'react';
import { DisplayText, Subheading, Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  message: css({
    fontWeight: 'normal',
    color: tokens.colorTextLightest,
    fontSize: tokens.fontSizeL,
    marginTop: tokens.spacingL,
  }),
  icon: css({
    verticalAlign: 'text-bottom',
    marginRight: tokens.spacingXs,
  }),
};

export const CompletedCopy = () => (
  <>
    <DisplayText>
      <Icon icon="CheckCircle" color="positive" size="large" className={styles.icon} /> All done!
    </DisplayText>
    <Subheading className={styles.message}>Your space is ready to use.</Subheading>
  </>
);
