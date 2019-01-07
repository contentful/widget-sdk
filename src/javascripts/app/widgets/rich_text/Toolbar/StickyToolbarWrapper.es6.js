import React from 'react';
import PropTypes from 'prop-types';
import Sticky from 'react-sticky-el';
import { detect as detectBrowser } from 'detect-browser';

const StickyToolbarWrapper = ({ children, isDisabled }) =>
  detectBrowser().name === 'ie' ? (
    <Sticky
      className="sticky-wrapper"
      boundaryElement=".rich-text"
      scrollElement=".sticky-parent"
      stickyStyle={{ zIndex: 2 }}
      disabled={isDisabled}>
      {children}
    </Sticky>
  ) : (
    <div className="native-sticky">{children}</div>
  );

StickyToolbarWrapper.propTypes = {
  isDisabled: PropTypes.bool
};

export default StickyToolbarWrapper;
