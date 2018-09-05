import React from 'react';
import PropTypes from 'prop-types';
import { byName as colors } from 'Styles/Colors.es6';

export class ProgressBar extends React.Component {
  static propTypes = {
    current: PropTypes.number.isRequired,
    maximum: PropTypes.number.isRequired
  };

  getPercentual = () => {
    return (100 / this.props.maximum) * this.props.current;
  };

  getWidth = () => {
    return `${Math.min(this.getPercentual(), 100)}%`;
  };

  getColor = () => {
    const percentual = this.getPercentual();

    if (percentual >= 100) {
      return colors.redLight;
    } else if (percentual >= 75) {
      return colors.orangeLight;
    }
    return colors.greenLight;
  };

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
}
