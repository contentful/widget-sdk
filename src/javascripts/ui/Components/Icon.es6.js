import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';

import HomeWelcomeIcon from 'svg/home-welcome.es6';
import QuestionMarkIcon from 'svg/QuestionMarkIcon.es6';
import SubscriptionIcon from 'svg/subscription.es6';
import PageMediaIcon from 'svg/page-media.es6';
import ContentStructureGraphIcon from 'svg/content-structure-graph.es6';
import ContentGraphHighlightIcon from 'svg/content-graph-highlight.es6';
import CheckmarkDoneIcon from 'svg/icon-checkmark-done.es6';
import PageCTIcon from 'svg/page-ct.es6';
import PageAPISIcon from 'svg/page-apis.es6';
import PageContentIcon from 'svg/page-content.es6';
import UserIcon from 'svg/icon-users.es6';
import GithubIcon from 'svg/icon-github.es6';
import AddUserIcon from 'svg/onboarding-add-user.es6';
import PageSettings from 'svg/page-settings.es6';
import PageApps from 'svg/page-apps.es6';
import PageUsage from 'svg/page-usage.es6';
import PageUsers from 'svg/page-users.es6';
import Bubble from 'svg/bubble.es6';
import ArrowDown from 'svg/dd-arrow-down.es6';
import ArrowUp from 'svg/arrow-up.es6';
import InvoiceIcon from 'svg/invoice.es6';
import BackIcon from 'svg/breadcrumbs-icon-back.es6';
import SpaceIcon from 'svg/space.es6';
import PagesIcon from 'svg/icon-pages.es6';
import OnboardingArrowIcon from 'svg/icon-onboarding-arrow.es6';
import OnboardingContentfulFlowDiagram from 'svg/icon-onboarding-contentful-req-res.es6';
import AWSIcon from 'svg/aws.es6';
import DotNetIcon from 'svg/dotnet.es6';
import JavaScriptIcon from 'svg/javascript.es6';
import MetalSmithIcon from 'svg/metalsmith.es6';
import PythonIcon from 'svg/python.es6';
import RubyIcon from 'svg/ruby.es6';
import SwiftIcon from 'svg/swift.es6';
import AndroidIcon from 'svg/android.es6';
import PHPIcon from 'svg/php.es6';
import JekyllIcon from 'svg/jekyll.es6';
import ContentfulLogo from 'svg/ContentfulLogo.es6';
import ContentfulLogoLight from 'svg/ContentfulLogoLight.es6';
import BrunchIcon from 'svg/brunch.es6';
import GitBookIcon from 'svg/gitbook.es6';
import StackOverviewIcon from 'svg/infographic.es6';
import RelaunchOnboardingIcon from 'svg/icon-onboarding-relaunch.es6';
import SpaceDiagram from 'svg/space-diagram.es6';
import ErrorIcon from 'svg/error.es6';
import PlugIcon from 'svg/plug.es6';
import Checkmark from 'svg/checkmark.es6';
import Edit from 'svg/edit.es6';
import CheckboxWidget from 'svg/checkbox-widget.es6';
import DropdownWidget from 'svg/dropdown-widget.es6';
import RadioWidget from 'svg/radio-widget.es6';
import SlugWidget from 'svg/slug-widget.es6';
import TagsWidget from 'svg/tags-widget.es6';
import NumberWidget from 'svg/number-widget.es6';
import RatingWidget from 'svg/rating-widget.es6';
import PreviewWidget from 'svg/preview-widget.es6';
import WysiwigWidget from 'svg/wysiwig-widget.es6';
import MarkdownWidget from 'svg/markdown-widget.es6';
import ReferenceWidget from 'svg/reference-widget.es6';
import ReferencesWidget from 'svg/references-widget.es6';
import SingleLineWidget from 'svg/singleline-widget.es6';
import MultiLineWidget from 'svg/multipleline-widget.es6';
import ReferenceCardWidget from 'svg/reference-card-widget.es6';
import ReferencesCardWidget from 'svg/references-card-widget.es6';
import MediaPreviewWidget from 'svg/media-preview-widget.es6';
import MediaPreviewsWidget from 'svg/media-previews-widget.es6';
import MediaReferenceWidget from 'svg/media-reference-widget.es6';
import MediaReferencesWidget from 'svg/media-references-widget.es6';

const SVGs = {
  'home-welcome': HomeWelcomeIcon,
  'page-media': PageMediaIcon,
  'question-mark': QuestionMarkIcon,
  subscription: SubscriptionIcon,
  'content-structure-graph': ContentStructureGraphIcon,
  'content-graph-highlight': ContentGraphHighlightIcon,
  'icon-checkmark-done': CheckmarkDoneIcon,
  'page-ct': PageCTIcon,
  'page-apis': PageAPISIcon,
  'page-content': PageContentIcon,
  'icon-users': UserIcon,
  'icon-github': GithubIcon,
  'onboarding-add-user': AddUserIcon,
  'page-settings': PageSettings,
  'page-apps': PageApps,
  'page-usage': PageUsage,
  'page-users': PageUsers,
  bubble: Bubble,
  'dd-arrow-down': ArrowDown,
  back: BackIcon,
  invoice: InvoiceIcon,
  space: SpaceIcon,
  'icon-pages': PagesIcon,
  'icon-onboarding-arrow': OnboardingArrowIcon,
  'icon-onboarding-contentful-req-res': OnboardingContentfulFlowDiagram,
  aws: AWSIcon,
  dotnet: DotNetIcon,
  javascript: JavaScriptIcon,
  metalsmith: MetalSmithIcon,
  python: PythonIcon,
  ruby: RubyIcon,
  swift: SwiftIcon,
  android: AndroidIcon,
  php: PHPIcon,
  jekyll: JekyllIcon,
  'contentful-logo': ContentfulLogo,
  'contentful-logo-light': ContentfulLogoLight,
  brunch: BrunchIcon,
  gitbook: GitBookIcon,
  'stack-overview': StackOverviewIcon,
  'relaunch-onboarding': RelaunchOnboardingIcon,
  'space-diagram': SpaceDiagram,
  error: ErrorIcon,
  plug: PlugIcon,
  checkmark: Checkmark,
  edit: Edit,
  'checkbox-widget': CheckboxWidget,
  'dropdown-widget': DropdownWidget,
  'radio-widget': RadioWidget,
  'tags-widget': TagsWidget,
  'number-widget': NumberWidget,
  'rating-widget': RatingWidget,
  'preview-widget': PreviewWidget,
  'wysiwig-widget': WysiwigWidget,
  'markdown-widget': MarkdownWidget,
  'reference-widget': ReferenceWidget,
  'references-widget': ReferencesWidget,
  'singleline-widget': SingleLineWidget,
  'multipleline-widget': MultiLineWidget,
  'reference-card-widget': ReferenceCardWidget,
  'references-card-widget': ReferencesCardWidget,
  'media-preview-widget': MediaPreviewWidget,
  'media-previews-widget': MediaPreviewsWidget,
  'media-reference-widget': MediaReferenceWidget,
  'media-references-widget': MediaReferencesWidget,
  'slug-widget': SlugWidget,
  'arrow-up': ArrowUp
};

class Icon extends React.Component {
  static displayName = 'Icon';

  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    name: PropTypes.string.isRequired,
    scale: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  componentDidMount() {
    const iconElem = $(this.container)
      .children()
      .get(0);
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
  }

  render() {
    const { className, style, name } = this.props;
    const Icon = SVGs[name];

    if (!Icon) {
      // eslint-disable-next-line
      console.warn(`"${name}" is not imported in Icon.es6`);
    }

    return (
      <span
        className={className}
        style={style}
        ref={node => {
          this.container = node;
        }}>
        {Icon && <Icon />}
      </span>
    );
  }
}

export default Icon;
