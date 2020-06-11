import React from 'react';
import { css, cx } from 'emotion';
import PropTypes from 'prop-types';

import { List } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import Release from './Release';

const styles = {
  list: css({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  }),
  item: css({
    marginBottom: tokens.spacingM,
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
};

const ReleasesTimeline = ({ releases, onReleaseSelect, ...rest }) => {
  const handleClick = (release) => {
    if (onReleaseSelect) {
      onReleaseSelect(release);
    }
  };
  return (
    <List testId="releases-timeline" className={styles.list}>
      {releases.map((release, index) => (
        <li
          key={`release-${index}`}
          className={cx(styles.item, styles.cursorPointer)}
          onClick={() => handleClick(release)}>
          <Release release={release} {...rest} />
        </li>
      ))}
    </List>
  );
};

ReleasesTimeline.propTypes = {
  releases: PropTypes.array,
  onReleaseSelect: PropTypes.func,
};

export default ReleasesTimeline;
