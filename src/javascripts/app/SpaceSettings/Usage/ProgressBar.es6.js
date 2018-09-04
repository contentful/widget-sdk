import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { byName as colors } from 'Styles/Colors.es6';

export const ProgressBar = createReactClass({
  propTypes: {
    current: PropTypes.number.isRequired,
    maximum: PropTypes.number.isRequired
  },

  getPercentual() {
    return (100 / this.props.maximum) * this.props.current;
  },

  getWidth() {
    return `${Math.min(this.getPercentual(), 100)}%`;
  },

  getColor() {
    const percentual = this.getPercentual();

    if (percentual >= 100) {
      return colors.redLight;
    } else if (percentual >= 75) {
      return colors.orangeLight;
    }
    return colors.greenLight;
  },

  render() {
    return (
      <div className="progress-bar">
        <span
          className="progress-bar__current"
          style={{
            width: this.getWidth(),
            backgroundColor: this.getColor()
          }}
        />
      </div>
    );
  }
});
