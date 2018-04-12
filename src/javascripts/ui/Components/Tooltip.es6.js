import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const Tooltip = createReactClass({
  propTypes: {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]).isRequired,
    tooltip: PropTypes.node.isRequired,
    style: PropTypes.object,
    className: PropTypes.string,
    options: PropTypes.shape({
      width: PropTypes.number
    })
  },
  render () {
    const {children, tooltip, className = '', style = {}, options = {}} = this.props;
    if (!options.width) { options.width = 200; }
    const tooltipStyle = {
      width: `${options.width}px`,
      left: '50%',
      marginLeft: `-${options.width / 2}px`
    };

    return <div
      className={`tooltip-trigger ${className}`}
      style={style}>
      {children}
      <div
        className="tooltip fade bottom hidden" // TODO support other tooltip positions
        style={tooltipStyle}>
        <div className="tooltip-arrow"></div>
        <div className="tooltip-inner">{tooltip}</div>
      </div>
    </div>;
  }
});

export default Tooltip;
