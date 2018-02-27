import createReactClass from 'create-react-class';
import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';

const Tooltip = createReactClass({
  propTypes: {
    element: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
    tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
    style: PropTypes.object,
    options: PropTypes.shape({
      width: PropTypes.number
    })
  },
  render () {
    const {element, tooltip, style, options} = this.props;
    let tooltipStyle = {};
    if (options.width) {
      tooltipStyle = {
        width: `${options.width}px`,
        left: '50%',
        marginLeft: `-${options.width / 2}px`
      };
    }
    return h('div', {
      className: 'tooltip-trigger',
      style: Object.assign({position: 'relative'}, style)
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
