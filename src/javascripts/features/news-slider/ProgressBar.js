import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const ProgressBar = ({ current, total }) => {
  const styles = {
    container: css({
      display: 'flex',
      justifyContent: 'space-between',
    }),
    item: css({
      width: '18px',
      height: '18px',
      border: `2px solid ${tokens.colorTextDark}`,
      boxSizing: 'border-box',
      borderRadius: '50%',
      margin: `0 ${tokens.spacingL}`,
    }),
    highlightedItem: css({
      background: tokens.colorTextDark,
    }),
  };
  const items = new Array(total)
    .fill()
    .map((_, index) => (
      <div
        className={current === index ? cx(styles.highlightedItem, styles.item) : styles.item}
        key={index}
      />
    ));
  return <div className={styles.container}>{items}</div>;
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};
