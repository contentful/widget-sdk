import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { List } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import Release from './Release';

const styles = {
  list: css({
    margin: 'auto',
    width: '70%',
  }),
  item: css({
    marginBottom: tokens.spacingM,
    boxShadow: tokens.boxShadowDefault,
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
    <List className={styles.list} testId="releases-timeline">
      {releases.map((release, index) => (
        <li
          key={`release-${index}`}
          className={styles.item && styles.cursorPointer}
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
