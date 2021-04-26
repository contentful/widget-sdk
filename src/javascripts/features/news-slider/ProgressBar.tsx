import React from 'react';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

interface ProgressBar {
  current: number;
  total: number;
  goTo: (number) => void;
}

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

export const ProgressBar = ({ current, total, goTo }: ProgressBar) => {
  const items = new Array(total)
    .fill(total)
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
