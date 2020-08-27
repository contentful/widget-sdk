import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  ExpandablePanel: css({
    boxSizing: 'border-box',
    overflow: 'hidden',
    transition: `height ${tokens.transitionDurationDefault}`,
  }),
};

export function ExpandablePanel({ isExpanded, children, id }) {
  const panelEl = useRef(null);

  useLayoutEffect(() => {
    const { current } = panelEl;
    if (current) {
      // height + padding-top + padding-bottom of the accordion’s panel final state
      // we need this math because the height will depend on the accordion’s content
      const panelHeight = `${current.scrollHeight / 16}rem`; // converting height pixels into rem
      const finalHeight = `calc(${panelHeight})`;

      if (isExpanded) {
        window.requestAnimationFrame(function () {
          current.style.height = '0px';
          current.style.marginTop = '0px';

          window.requestAnimationFrame(function () {
            current.style.height = finalHeight;
            current.style.marginTop = tokens.spacingM;
          });
        });
      } else {
        window.requestAnimationFrame(function () {
          current.style.height = '0px';
          current.style.marginTop = '0px';
        });
      }
    }
  }, [isExpanded]);

  return (
    <div
      id={`expandable-panel--${id}`}
      data-test-id={`cf-ui-expandable-panel--${id}`}
      role="region"
      aria-labelledby={`expandable-panel--${id}`}
      aria-hidden={!isExpanded}
      className={styles.ExpandablePanel}
      ref={panelEl}>
      {children}
    </div>
  );
}

ExpandablePanel.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  id: PropTypes.number.isRequired,
};
