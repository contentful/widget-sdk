import React from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';

export const Wrapper = ({ entityType, children, showSelected, isLast }) => {
  if (showSelected) {
    return (
      <div
        className="entity-selector__item x--selected"
        style={entityType === 'Entry' ? { width: '100%' } : {}}>
        {children}
      </div>
    );
  }

  return (
    <div
      data-test-id="entity-selector-item"
      className={cx('entity-selector__item', {
        'x--selected': showSelected,
        'entity-selector__last-item': isLast,
      })}>
      {children}
    </div>
  );
};

Wrapper.propTypes = {
  entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
  children: PropTypes.node,
  showSelected: PropTypes.bool,
  isLast: PropTypes.bool,
};

Wrapper.defaultProps = {
  hasMore: false,
  showSelected: false,
  isLast: false,
};
