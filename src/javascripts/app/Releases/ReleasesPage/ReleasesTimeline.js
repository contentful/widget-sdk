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
};

const ReleasesTimeline = ({ releases, ...rest }) => {
  return (
    <List className={styles.list} testId="releases-timeline">
      {releases.map((release, index) => (
        <li key={`release-${index}`} className={styles.item}>
          <Release release={release} {...rest} />
        </li>
      ))}
    </List>
  );
};

ReleasesTimeline.propTypes = {
  releases: PropTypes.array,
};

export default ReleasesTimeline;
