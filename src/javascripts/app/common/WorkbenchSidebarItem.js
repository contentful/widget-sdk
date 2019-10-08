import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';

const styles = {
  root: css({
    marginBottom: tokens.spacingL,
    ul: {
      marginLeft: tokens.spacingM,
      color: tokens.colorTextMid
    },
    li: {
      listStyle: 'disc'
    }
  }),
  title: css({
    fontSize: tokens.fontSizeS,
    fontWeight: '500',
    lineHeight: 2,
    letterSpacing: '1px',
    borderBottom: `1px solid ${tokens.colorElementDark}`,
    color: tokens.colorTextLight,
    marginBottom: tokens.spacingM,
    textTransform: 'uppercase'
  })
};

export default function WorkbenchSidebarItem(props) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{props.title}</div>
      {props.children}
    </div>
  );
}

WorkbenchSidebarItem.propTypes = {
  title: PropTypes.string.isRequired
};
