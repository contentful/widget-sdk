import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default ({ children }) => (
  <span className={css({ fontWeight: tokens.fontWeightDemiBold })}>{children}</span>
);
