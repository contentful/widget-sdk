import React from 'react';

import { css, cx } from 'emotion';
import { Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';

import Icon from 'ui/Components/Icon';

const styles = {
  heading: css({
    fontSize: tokens.fontSizeL,
    marginTop: '2px',
    fontWeight: 'bold',
    lineHeight: 1
  }),
  icon: css({
    marginLeft: tokens.spacingL
  }),
  contentType: css({
    fontSize: tokens.fontSizeS
  }),
  wrapper: css({
    paddingRight: tokens.spacingS,
    overflow: 'hidden',
    display: 'flex',
    cursor: 'pointer',
    WebkitBoxFlex: '1',
    msFlexPositive: '1',
    flexGrow: '1'
  }),
  titleWrapper: css({
    padding: `${tokens.spacingM} ${tokens.spacingXs}`
  }),
  expander: css({
    fontFamily: "'FontAwesome'",
    color: '#8091a5',
    fontSize: tokens.fontSizeL,
    marginLeft: '0.6em',
    marginTop: '2px',
    alignSelf: 'center',
    transition: 'transform 0.1s linear',
    '&::before': {
      content: `'\f0d7'`
    }
  }),
  contenType: css({
    color: tokens.colorTextLight
  }),
  expanderCollapsed: css({
    transform: 'rotate(-90deg)'
  })
};

export default function BulkEditorTitle({ title, isCollapsed, entityInfo }) {
  return (
    <div className={styles.wrapper}>
      <Icon className={styles.icon} name="page-content" scale="0.75" />
      <div className={styles.titleWrapper}>
        <div className={styles.contentType}>{entityInfo.contentType.name}</div>
        <Subheading className={styles.heading} testId="cf-bulk-editor-title">
          {title}
        </Subheading>
      </div>
      <div className={cx(styles.expander, isCollapsed && styles.expanderCollapsed)} />
    </div>
  );
}

BulkEditorTitle.propTypes = {
  title: PropTypes.string,
  entityInfo: PropTypes.shape({ contentType: PropTypes.shape({ name: PropTypes.string }) }),
  isCollapsed: PropTypes.bool
};
