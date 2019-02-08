import React from 'react';
import PropTypes from 'prop-types';

const TooltipContent = ({ imgSrs, imgAlt, copy }) => {
  return (
    <>
      {imgSrs && imgAlt && (
        <img className="walkthrough-tooltip__scheme-image" src={imgSrs} alt={imgAlt} />
      )}
      <p className="walkthrough-tooltip__copy">{copy}</p>
    </>
  );
};

TooltipContent.propTypes = {
  imgSrs: PropTypes.string,
  imgAlt: PropTypes.string,
  copy: PropTypes.string
};

export default TooltipContent;
