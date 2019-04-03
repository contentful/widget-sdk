import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.es6';

const TooltipContent = ({ imgStyles, copy, imgDescription }) => {
  return (
    <>
      {imgStyles && (
        <div
          className={`${imgStyles} ${styles.tooltipIllustration}`}
          aria-label={imgDescription}
          role="img"
        />
      )}
      <p className={styles.tooltipCopy}>{copy}</p>
    </>
  );
};

TooltipContent.propTypes = {
  imgStyles: PropTypes.any,
  copy: PropTypes.string.isRequired,
  imgDescription: PropTypes.string
};

export default TooltipContent;
