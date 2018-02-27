import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import { asReact } from 'ui/Framework/DOMRenderer';
import $ from 'jquery';

import HomeWelcomeIcon from 'svg/home-welcome';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';
import SubscriptionIcon from 'svg/subscription';
import PageMediaIcon from 'svg/page-media';
import ContentStructureGraphIcon from 'svg/content-structure-graph';

const SVGS = {
  'home-welcome': HomeWelcomeIcon,
  'page-media': PageMediaIcon,
  'question-mark': QuestionMarkIcon(),
  'subscription': SubscriptionIcon,
  'content-structure-graph': ContentStructureGraphIcon
};

const Icon = createReactClass({
  propTypes: {
    className: PropTypes.string,
    style: PropTypes.object,
    name: PropTypes.string.isRequired,
    scale: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOf([PropTypes.string, PropTypes.number])
  },
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
    const { className, style } = this.props;
    const { Icon } = this.state;
    return h('div', {className, style, ref: node => { this.container = node; }}, asReact(Icon));
  }
});

export default Icon;
