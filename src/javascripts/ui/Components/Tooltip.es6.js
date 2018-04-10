import createReactClass from 'create-react-class';
import { createElement as h } from 'react';
import PropTypes from 'prop-types';

const Tooltip = createReactClass({
  propTypes: {
    element: PropTypes.node.isRequired,
    tooltip: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]).isRequired,
    style: PropTypes.object,
    className: PropTypes.string,
    options: PropTypes.shape({
      width: PropTypes.number
    })
  },
  render () {
    const {element, tooltip, className = '', style = {}, options = {}} = this.props;
    let tooltipStyle = {};
    if (options.width) {
      tooltipStyle = {
        width: `${options.width}px`,
        left: '50%',
        marginLeft: `-${options.width / 2}px`
      };
    }
    return h('div', {
      className: `tooltip-trigger ${className}`,
      style: style
    },
      element,
      h('div', {
        className: `tooltip fade bottom hidden`, // TODO support other tooltip positions
        style: tooltipStyle
      },
        h('div', {className: 'tooltip-arrow'}),
        h('div', {className: 'tooltip-inner'}, tooltip)
      )
    );
  }
});

export default Tooltip;
