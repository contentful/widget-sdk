import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from 'ui/Components/Tooltip.es6';
import { byName as colors } from 'Styles/Colors.es6';
import QuestionMarkIcon from 'svg/QuestionMarkIcon.es6';

class HelpIcon extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
    tooltipWidth: PropTypes.number
  };

  render() {
    const { children, tooltipWidth } = this.props;

    return (
      <Tooltip tooltip={children} options={{ width: tooltipWidth || 200 }} className="help-icon">
        <span className="help-icon__img">
          <QuestionMarkIcon color={colors.textLight} />
        </span>
      </Tooltip>
    );
  }
}

export default HelpIcon;
