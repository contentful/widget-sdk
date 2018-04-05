import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Tooltip from 'ui/Components/Tooltip';
import {byName as colors} from 'Styles/Colors';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';
import {asReact} from 'ui/Framework/DOMRenderer';

const HelpIcon = createReactClass({
  propTypes: {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]).isRequired,
    tooltipWidth: PropTypes.number
  },
  render: function () {
    const {children, tooltipWidth} = this.props;
    const questionMarkIcon = <span className="help-icon__img">
      {asReact(QuestionMarkIcon({color: colors.textLight}))}
    </span>;

    return <Tooltip
      element={questionMarkIcon}
      tooltip={children}
      options={{width: tooltipWidth || 200}}
      className="help-icon"
    />;
  }
});

export default HelpIcon;
