import React from 'react';

import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  root: css({
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    height: `calc(100% - ${tokens.spacingM})`,
    justifyContent: 'center',
    margin: 'auto',
    textAlign: 'center'
  }),
  title: css({
    color: tokens.colorTextDark,
    fontSize: tokens.fontSize2Xl,
    fontWeight: tokens.fontWeightMedium,
    lineHeight: tokens.lineHeightCondensed,
    marginTop: tokens.spacingL
  }),
  description: css({
    color: tokens.colorTextMid,
    fontSize: tokens.fontSizeXl,
    lineHeight: tokens.lineHeightDefault,
    margin: `${tokens.spacingL} auto 0`,
    maxWidth: '720px'
  }),
  action: css({
    marginTop: tokens.spacingL
  }),
  additional: css({
    color: tokens.colorTextLight,
    lineHeight: tokens.lineHeightDefault,
    marginTop: tokens.spacingL
  }),
  notes: css({
    marginTop: tokens.spacingL,
    width: 'auto'
  })
};

export default function Advice({ ['data-test-id']: dataTestId, children }) {
  const childrenArray = React.Children.toArray(children);
  const icon = childrenArray.find(child => child.type === Advice.Icon);
  const title = childrenArray.find(child => child.type === Advice.Title);
  const description = childrenArray.find(child => child.type === Advice.Description);
  const action = childrenArray.find(child => child.type === Advice.Action);
  const additional = childrenArray.find(child => child.type === Advice.AdditionalInfo);
  const notes = childrenArray.find(child => child.type === Advice.Notes);
  return (
    <div className={styles.root} data-test-id={dataTestId}>
      {icon}
      {title}
      {description}
      {action}
      {additional}
      {notes}
    </div>
  );
}

Advice.Icon = ({ children }) => <React.Fragment>{children}</React.Fragment>;
Advice.Title = ({ children }) => <div className={styles.title}>{children}</div>;
Advice.Description = ({ children }) => <div className={styles.description}>{children}</div>;
Advice.Action = ({ children }) => <div className={styles.action}>{children}</div>;
Advice.AdditionalInfo = ({ children }) => <div className={styles.additional}>{children}</div>;
Advice.Notes = ({ children }) => <div className={styles.notes}>{children}</div>;
