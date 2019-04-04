import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.es6';

const TooltipContent = ({ imgPath, copy, imgDescription }) => (
  <>
    {imgPath && (
      <div
        style={{ backgroundImage: `url("${imgPath}")` }}
        className={styles.tooltipIllustration}
        aria-label={imgDescription}
        role="img"
      />
    )}
    <p className={styles.tooltipCopy}>{copy}</p>
  </>
);

TooltipContent.propTypes = {
  imgPath: PropTypes.any,
  copy: PropTypes.string.isRequired,
  imgDescription: PropTypes.string
};

export default TooltipContent;
