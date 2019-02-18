import React from 'react';
import PropTypes from 'prop-types';

const TooltipContent = ({ imgSrc, imgAlt, copy }) => {
  return (
    <>
      {imgSrc && imgAlt && (
        <img className="walkthrough-tooltip__scheme-image" src={imgSrc} alt={imgAlt} />
      )}
      <p className="walkthrough-tooltip__copy">{copy}</p>
    </>
  );
};

TooltipContent.propTypes = {
  imgSrc: PropTypes.string,
  imgAlt: PropTypes.string,
  copy: PropTypes.string.isRequired
};

export default TooltipContent;
