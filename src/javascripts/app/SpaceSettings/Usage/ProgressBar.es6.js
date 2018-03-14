import React from 'libs/react';
import PropTypes from 'libs/prop-types';
import {byName as colors} from 'Styles/Colors';

export const ProgressBar = ({current, maximum}) => {
  const percentual = 100 / maximum * current;
  const width = `${Math.min(percentual, 100)}%`;
  const getColor = (percentual) => {
    if (percentual >= 100) {
      return colors.redLight;
    } else if (percentual >= 75) {
      return colors.orangeLight;
    }
    return colors.greenLight;
  };

  return (
    <div className="progress-bar">
      <span
        className="progress-bar__current"
        style={{width, backgroundColor: getColor(percentual)}}
      ></span>
    </div>
  );
};
ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  maximum: PropTypes.number.isRequired
};
