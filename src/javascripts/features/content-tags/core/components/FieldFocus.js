import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import React from 'react';

const styles = {
  focusContainer: css({
    borderLeft: '3px solid #c5d2d8',
    paddingLeft: '1em',
    marginBottom: '29px',
    marginTop: '19px',
    transition: 'border-color 0.18s linear',
    '&:focus-within': {
      borderColor: tokens.colorPrimary,
    },
  }),
};

const FieldFocus = ({ children }) => {
  return <div className={styles.focusContainer}>{children}</div>;
};

export { FieldFocus };
