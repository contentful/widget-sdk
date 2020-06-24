import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const ProgressBar = ({ current, total, goTo }) => {
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
      cursor: 'pointer',
      transition: 'opacity .2s ease-in-out',
      '&:hover': css({
        opacity: '80%',
      }),
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
        onClick={() => goTo(index)}
        role="button"
        data-test-id="progress-bar-nav"
        data-active={current === index}
      />
    ));
  return <div className={styles.container}>{items}</div>;
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  goTo: PropTypes.func,
};
