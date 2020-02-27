import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import cn from 'classnames';

import HomeWelcomeIcon from 'svg/home-welcome.svg';
import QuestionMarkIcon from 'svg/QuestionMarkIcon.svg';
import SubscriptionIcon from 'svg/subscription.svg';
import PageMediaIcon from 'svg/page-media.svg';
import ContentStructureGraphIcon from 'svg/content-structure-graph.svg';
import ContentGraphHighlightIcon from 'svg/content-graph-highlight.svg';
import CheckmarkDoneIcon from 'svg/icon-checkmark-done.svg';
import PageCTIcon from 'svg/page-ct.svg';
import PageAPISIcon from 'svg/page-apis.svg';
import PageContentIcon from 'svg/page-content.svg';
import UserIcon from 'svg/icon-users.svg';
import GithubIcon from 'svg/icon-github.svg';
import AddUserIcon from 'svg/onboarding-add-user.svg';
import PageSettings from 'svg/page-settings.svg';
import PageApps from 'svg/page-apps.svg';
import Bubble from 'svg/bubble.svg';
import ArrowDown from 'svg/dd-arrow-down.svg';
import ArrowUp from 'svg/arrow-up.svg';
import InvoiceIcon from 'svg/invoice.svg';
import BackIcon from 'svg/breadcrumbs-icon-back.svg';
import SpaceIcon from 'svg/space.svg';
import PagesIcon from 'svg/icon-pages.svg';
import OnboardingArrowIcon from 'svg/icon-onboarding-arrow.svg';
import OnboardingContentfulFlowDiagram from 'svg/icon-onboarding-contentful-req-res.svg';
import AWSIcon from 'svg/aws.svg';
import DotNetIcon from 'svg/dotnet.svg';
import JavaScriptIcon from 'svg/javascript.svg';
import MetalSmithIcon from 'svg/metalsmith.svg';
import PythonIcon from 'svg/python.svg';
import RubyIcon from 'svg/ruby.svg';
import SwiftIcon from 'svg/swift.svg';
import AndroidIcon from 'svg/android.svg';
import PHPIcon from 'svg/php.svg';
import JekyllIcon from 'svg/jekyll.svg';
import ContentfulLogo from 'svg/ContentfulLogo.svg';
import ContentfulLogoLight from 'svg/ContentfulLogoLight.svg';
import BrunchIcon from 'svg/brunch.svg';
import GitBookIcon from 'svg/gitbook.svg';
import StackOverviewIcon from 'svg/infographic.svg';
import RelaunchOnboardingIcon from 'svg/icon-onboarding-relaunch.svg';
import SpaceDiagram from 'svg/space-diagram.svg';
import ErrorIcon from 'svg/error.svg';
import Checkmark from 'svg/checkmark.svg';
import Edit from 'svg/edit.svg';
import CheckboxWidget from 'svg/checkbox-widget.svg';
import DropdownWidget from 'svg/dropdown-widget.svg';
import RadioWidget from 'svg/radio-widget.svg';
import SlugWidget from 'svg/slug-widget.svg';
import TagsWidget from 'svg/tags-widget.svg';
import NumberWidget from 'svg/number-widget.svg';
import RatingWidget from 'svg/rating-widget.svg';
import PreviewWidget from 'svg/preview-widget.svg';
import WysiwigWidget from 'svg/wysiwig-widget.svg';
import MarkdownWidget from 'svg/markdown-widget.svg';
import ReferenceWidget from 'svg/reference-widget.svg';
import ReferencesWidget from 'svg/references-widget.svg';
import SingleLineWidget from 'svg/singleline-widget.svg';
import MultiLineWidget from 'svg/multipleline-widget.svg';
import ReferenceCardWidget from 'svg/reference-card-widget.svg';
import ReferencesCardWidget from 'svg/references-card-widget.svg';
import MediaPreviewWidget from 'svg/media-preview-widget.svg';
import MediaPreviewsWidget from 'svg/media-previews-widget.svg';
import MediaReferenceWidget from 'svg/media-reference-widget.svg';
import MediaReferencesWidget from 'svg/media-references-widget.svg';
import FieldJSONSmall from 'svg/field-json-small.svg';
import FieldShortTextSmall from 'svg/field-shorttext-small.svg';
import FieldJSON from 'svg/field-json.svg';
import FieldShortText from 'svg/field-shorttext.svg';
import FieldLongTextSmall from 'svg/field-longtext-small.svg';
import FieldNumberSmall from 'svg/field-number-small.svg';
import FieldDecimalSmall from 'svg/field-decimal-small.svg';
import FieldBooleanSmall from 'svg/field-boolean-small.svg';
import FieldCalendarSmall from 'svg/field-calendar-small.svg';
import FieldMediaSmall from 'svg/field-media-small.svg';
import FieldLocationSmall from 'svg/field-location-small.svg';
import FieldReferenceSmall from 'svg/field-reference-small.svg';
import FieldLongText from 'svg/field-longtext.svg';
import FieldNumber from 'svg/field-number.svg';
import FieldDecimal from 'svg/field-decimal.svg';
import FieldBoolean from 'svg/field-boolean.svg';
import FieldCalendar from 'svg/field-calendar.svg';
import FieldMedia from 'svg/field-media.svg';
import FieldLocation from 'svg/field-location.svg';
import FieldReference from 'svg/field-reference.svg';
import FieldRichTextSmall from 'svg/field-richtext-small.svg';
import FieldRichText from 'svg/field-richtext.svg';
import InvitationNotFound from 'svg/invitation-not-found.svg';
import ScheduleCalendar from 'svg/schedule-calendar.svg';
import svgNavApiEs6 from 'svg/nav-api.svg';
import svgNavAppsEs6 from 'svg/nav-apps.svg';
import svgNavCtEs6 from 'svg/nav-ct.svg';
import svgNavEntriesEs6 from 'svg/nav-entries.svg';
import svgNavHomeEs6 from 'svg/nav-home.svg';
import svgNavMediaEs6 from 'svg/nav-media.svg';
import svgNavSettingsEs6 from 'svg/nav-settings.svg';

const SVGs = {
  'nav-api': svgNavApiEs6,
  'nav-apps': svgNavAppsEs6,
  'nav-ct': svgNavCtEs6,
  'nav-entries': svgNavEntriesEs6,
  'nav-home': svgNavHomeEs6,
  'nav-media': svgNavMediaEs6,
  'nav-settings': svgNavSettingsEs6,
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
  'arrow-up': ArrowUp,
  'invitation-not-found': InvitationNotFound,

  // fields
  'field-json-small': FieldJSONSmall,
  'field-shorttext-small': FieldShortTextSmall,
  'field-longtext-small': FieldLongTextSmall,
  'field-number-small': FieldNumberSmall,
  'field-decimal-small': FieldDecimalSmall,
  'field-boolean-small': FieldBooleanSmall,
  'field-calendar-small': FieldCalendarSmall,
  'field-media-small': FieldMediaSmall,
  'field-location-small': FieldLocationSmall,
  'field-reference-small': FieldReferenceSmall,
  'field-json': FieldJSON,
  'field-shorttext': FieldShortText,
  'field-longtext': FieldLongText,
  'field-number': FieldNumber,
  'field-decimal': FieldDecimal,
  'field-boolean': FieldBoolean,
  'field-calendar': FieldCalendar,
  'schedule-calendar': ScheduleCalendar,
  'field-media': FieldMedia,
  'field-location': FieldLocation,
  'field-reference': FieldReference,
  'field-richtext': FieldRichText,
  'field-richtext-small': FieldRichTextSmall
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

  static defaultProps = {
    scale: '1.0'
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

      if (width) {
        iconElem.setAttribute('width', `${width * scale}px`);
      }

      if (height) {
        iconElem.setAttribute('height', `${height * scale}px`);
      }
    }

    const setHeight = parseFloat(this.props.height);

    if (!isNaN(setHeight)) {
      iconElem.setAttribute('height', `${setHeight}px`);
    }
  }

  render() {
    const { className, style, name } = this.props;
    const IconComponent = SVGs[name];

    if (!IconComponent) {
      // eslint-disable-next-line
      console.warn(`"${name}" is not imported in Icon`);
    }

    return (
      <span
        data-icon-name={name}
        className={cn('icon-component', className)}
        style={style}
        ref={node => {
          this.container = node;
        }}>
        {IconComponent && <IconComponent />}
      </span>
    );
  }
}

export default Icon;
