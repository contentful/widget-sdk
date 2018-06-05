import { createElement as h } from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import { asReact } from 'ui/Framework/DOMRenderer';
import $ from 'jquery';

import HomeWelcomeIcon from 'svg/home-welcome';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';
import SubscriptionIcon from 'svg/subscription';
import PageMediaIcon from 'svg/page-media';
import ContentStructureGraphIcon from 'svg/content-structure-graph';
import TeaScreenshotIcon from 'svg/tea-screenshot';
import ContentGraphHighlightIcon from 'svg/content-graph-highlight';
import CheckmarkDoneIcon from 'svg/icon-checkmark-done';
import PageCTIcon from 'svg/page-ct';
import PageAPISIcon from 'svg/page-apis';
import PageContentIcon from 'svg/page-content';
import UserIcon from 'svg/icon-users';
import GithubIcon from 'svg/icon-github';
import AddUserIcon from 'svg/onboarding-add-user';
import PageSettings from 'svg/page-settings';
import PageUsage from 'svg/page-usage';
import Bubble from 'svg/bubble';
import ArrowDown from 'svg/dd-arrow-down';
import InvoiceIcon from 'svg/invoice';
import BackIcon from 'svg/breadcrumbs-icon-back';
import SpaceIcon from 'svg/space';
import PagesIcon from 'svg/icon-pages';

const SVGS = {
  'home-welcome': HomeWelcomeIcon,
  'page-media': PageMediaIcon,
  'question-mark': QuestionMarkIcon(),
  'subscription': SubscriptionIcon,
  'content-structure-graph': ContentStructureGraphIcon,
  'tea-screenshot': TeaScreenshotIcon,
  'content-graph-highlight': ContentGraphHighlightIcon,
  'icon-checkmark-done': CheckmarkDoneIcon,
  'page-ct': PageCTIcon,
  'page-apis': PageAPISIcon,
  'page-content': PageContentIcon,
  'icon-users': UserIcon,
  'icon-github': GithubIcon,
  'onboarding-add-user': AddUserIcon,
  'page-settings': PageSettings,
  'page-usage': PageUsage,
  'bubble': Bubble,
  'dd-arrow-down': ArrowDown,
  'back': BackIcon,
  'invoice': InvoiceIcon,
  'space': SpaceIcon,
  'icon-pages': PagesIcon
};

const Icon = createReactClass({
  propTypes: {
    className: PropTypes.string,
    style: PropTypes.object,
    name: PropTypes.string.isRequired,
    scale: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
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
    return h('span', {className, style, ref: node => { this.container = node; }}, asReact(Icon));
  }
});

export default Icon;
