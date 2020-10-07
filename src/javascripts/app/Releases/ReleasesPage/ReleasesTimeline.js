import React from 'react';
import { css, cx } from 'emotion';
import PropTypes from 'prop-types';

import { List } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { indexById } from 'core/utils/entities';

import Release from './Release';

const styles = {
  list: css({
    display: 'grid',
    gridTemplateColumns: 'auto auto auto',
    gridGap: `${tokens.spacingXs} ${tokens.spacingXs}`,
  }),
  item: css({
    marginBottom: tokens.spacingM,
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
};

const ReleasesTimeline = ({ releases, lastActions, onReleaseSelect, ...rest }) => {
  const handleClick = (release) => {
    if (onReleaseSelect) {
      onReleaseSelect(release);
    }
  };
  const releaseActionsById = indexById(lastActions);
  return (
    <List testId="releases-timeline" className={styles.list}>
      {releases.map((release, index) => (
        <li
          key={`release-${index}`}
          className={cx(styles.item, styles.cursorPointer)}
          onClick={() => handleClick(release)}>
          <Release
            release={release}
            lastAction={releaseActionsById[release.sys.lastAction?.sys.id]}
            {...rest}
          />
        </li>
      ))}
    </List>
  );
};

ReleasesTimeline.propTypes = {
  releases: PropTypes.array,
  lastActions: PropTypes.array,
  onReleaseSelect: PropTypes.func,
};

export default ReleasesTimeline;
