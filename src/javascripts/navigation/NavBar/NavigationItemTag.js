import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tag } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const styles = {
  tag: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: `${tokens.spacing2Xs}`,
  }),
};

export default function NavigationItemTag({ label }) {
  return (
    <Tag tagType="primary-filled" size="small" className={styles.tag}>
      {label}
    </Tag>
  );
}

NavigationItemTag.propTypes = {
  label: PropTypes.string.isRequired,
};
