import React from 'react';
import PropTypes from 'prop-types';

const TooltipContent = ({ illustration, copy }) => {
  return (
    <>
      <div className="walkthrough-tooltip__scheme-image">{illustration}</div>
      <p className="walkthrough-tooltip__copy">{copy}</p>
    </>
  );
};

TooltipContent.propTypes = {
  illustration: PropTypes.any,
  copy: PropTypes.string.isRequired
};

export default TooltipContent;
