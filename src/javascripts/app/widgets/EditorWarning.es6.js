import React from 'react';
import { css } from 'emotion';
import Icon from 'ui/Components/Icon.es6';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  root: css({
    lineHeight: tokens.lineHeightDefault,
    background: tokens.colorPeachMid,
    border: `1px solid ${tokens.colorPeachDark}`,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    display: 'flex',
    alignItems: 'center'
  }),
  icon: css({
    marginRight: tokens.spacingM
  })
};

export default function EditorWarning(props) {
  const { children, ...rest } = props;
  return (
    <div {...rest} className={styles.root} role="alert">
      <Icon name="plug" scale="0.8" className={styles.icon} />
      <div>{children}</div>
    </div>
  );
}
