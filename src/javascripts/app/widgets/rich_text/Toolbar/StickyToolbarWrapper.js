import React from 'react';
import PropTypes from 'prop-types';

const StickyToolbarWrapper = ({ children }) => <div className="native-sticky">{children}</div>;

StickyToolbarWrapper.propTypes = {
  isDisabled: PropTypes.bool,
};

export default StickyToolbarWrapper;
