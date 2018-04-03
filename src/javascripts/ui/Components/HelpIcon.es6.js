import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Tooltip from 'ui/Components/Tooltip';
import {byName as colors} from 'Styles/Colors';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';
import {asReact} from 'ui/Framework/DOMRenderer';

export default createReactClass({
  propTypes: {
    children: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element
    ]).isRequired,
    tooltipWidth: PropTypes.number
  },
  render: function () {
    const {children, tooltipWidth = {}} = this.props;
    const questionMarkIcon = <span>
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
