import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles';

const TooltipContent = ({ illustration, copy }) => {
  return (
    <>
      <div className={styles.tooltipIllustration}>{illustration}</div>
      <p className={styles.tooltipCopy}>{copy}</p>
    </>
  );
};

TooltipContent.propTypes = {
  illustration: PropTypes.any,
  copy: PropTypes.string.isRequired
};

export default TooltipContent;
