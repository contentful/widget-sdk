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
    const questionMarkIcon = (
      <span className="help-icon__img">
        <QuestionMarkIcon color={colors.textLight} />
      </span>
    );

    return (
      <Tooltip tooltip={children} options={{ width: tooltipWidth || 200 }} className="help-icon">
        {questionMarkIcon}
      </Tooltip>
    );
  }
}

export default HelpIcon;
