import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Tooltip from 'ui/Components/Tooltip.es6';
import { byName as colors } from 'Styles/Colors.es6';
import QuestionMarkIcon from 'svg/QuestionMarkIcon.es6';
import { asReact } from 'ui/Framework/DOMRenderer.es6';

const HelpIcon = createReactClass({
  propTypes: {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
    tooltipWidth: PropTypes.number
  },
  render: function() {
    const { children, tooltipWidth } = this.props;
    const questionMarkIcon = (
      <span className="help-icon__img">
        {asReact(QuestionMarkIcon({ color: colors.textLight }))}
      </span>
    );

    return (
      <Tooltip tooltip={children} options={{ width: tooltipWidth || 200 }} className="help-icon">
        {questionMarkIcon}
      </Tooltip>
    );
  }
});

export default HelpIcon;
