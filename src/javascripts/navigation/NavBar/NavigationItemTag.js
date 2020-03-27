import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tag } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const styles = {
  tag: css({
    position: 'absolute',
    top: tokens.spacingXs,
    right: `-${tokens.spacing2Xs}`,
    background: tokens.colorBlueDark,
    color: tokens.colorWhite,
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.05rem',
  }),
};

export default function NavigationItemTag({ label }) {
  return <Tag className={styles.tag}>{label}</Tag>;
}

NavigationItemTag.propTypes = {
  label: PropTypes.string.isRequired,
};
