import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import { asReact } from 'ui/Framework/DOMRenderer';
import $ from 'jquery';
import HomeWelcomeIcon from 'svg/home-welcome';

const SVGS = {
  'home-welcome': HomeWelcomeIcon
};

const propTypes = {
  name: PropTypes.string.isRequired,
  scale: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOf([PropTypes.string, PropTypes.number])
};

const Icon = createReactClass({
  getInitialState () {
    return {
      Icon: SVGS[this.props.name]
    };
  },
  componentDidMount () {
    const iconElem = $(this.container).children().get(0);
    if (!iconElem) {
      return;
    }

    const scale = parseFloat(this.props.scale);
    if (scale === 0) {
      iconElem.removeAttribute('width');
      iconElem.removeAttribute('height');
    } else if (!isNaN(scale)) {
      const width = parseInt(iconElem.getAttribute('width'), 10);
      const height = parseInt(iconElem.getAttribute('height'), 10);
      iconElem.setAttribute('width', width * scale);
      iconElem.setAttribute('height', height * scale);
    }

    const setHeight = parseFloat(this.props.height);
    if (!isNaN(setHeight)) {
      iconElem.setAttribute('height', setHeight);
    }
  },
  render () {
    const { className } = this.props;
    const { Icon } = this.state;
    return h('div', {className, ref: node => { this.container = node; }}, asReact(Icon));
  }
});

Icon.propTypes = propTypes;

export default Icon;
