import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import cn from 'classnames';

import HomeWelcomeIcon from 'svg/home-welcome';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';
import SubscriptionIcon from 'svg/subscription';
import PageMediaIcon from 'svg/page-media';
import ContentStructureGraphIcon from 'svg/content-structure-graph';
import ContentGraphHighlightIcon from 'svg/content-graph-highlight';
import CheckmarkDoneIcon from 'svg/icon-checkmark-done';
import PageCTIcon from 'svg/page-ct';
import PageAPISIcon from 'svg/page-apis';
import PageContentIcon from 'svg/page-content';
import UserIcon from 'svg/icon-users';
import GithubIcon from 'svg/icon-github';
import AddUserIcon from 'svg/onboarding-add-user';
import PageSettings from 'svg/page-settings';
import PageApps from 'svg/page-apps';
import PageUsage from 'svg/page-usage';
import PageUsers from 'svg/page-users';
import PageTeams from 'svg/page-teams';
import PageSSO from 'svg/page-sso';
import Bubble from 'svg/bubble';
import ArrowDown from 'svg/dd-arrow-down';
import ArrowUp from 'svg/arrow-up';
import InvoiceIcon from 'svg/invoice';
import BackIcon from 'svg/breadcrumbs-icon-back';
import SpaceIcon from 'svg/space';
import PagesIcon from 'svg/icon-pages';
import OnboardingArrowIcon from 'svg/icon-onboarding-arrow';
import OnboardingContentfulFlowDiagram from 'svg/icon-onboarding-contentful-req-res';
import AWSIcon from 'svg/aws';
import DotNetIcon from 'svg/dotnet';
import JavaScriptIcon from 'svg/javascript';
import MetalSmithIcon from 'svg/metalsmith';
import PythonIcon from 'svg/python';
import RubyIcon from 'svg/ruby';
import SwiftIcon from 'svg/swift';
import AndroidIcon from 'svg/android';
import PHPIcon from 'svg/php';
import JekyllIcon from 'svg/jekyll';
import ContentfulLogo from 'svg/ContentfulLogo';
import ContentfulLogoLight from 'svg/ContentfulLogoLight';
import BrunchIcon from 'svg/brunch';
import GitBookIcon from 'svg/gitbook';
import StackOverviewIcon from 'svg/infographic';
import RelaunchOnboardingIcon from 'svg/icon-onboarding-relaunch';
import SpaceDiagram from 'svg/space-diagram';
import ErrorIcon from 'svg/error';
import Checkmark from 'svg/checkmark';
import Edit from 'svg/edit';
import CheckboxWidget from 'svg/checkbox-widget';
import DropdownWidget from 'svg/dropdown-widget';
import RadioWidget from 'svg/radio-widget';
import SlugWidget from 'svg/slug-widget';
import TagsWidget from 'svg/tags-widget';
import NumberWidget from 'svg/number-widget';
import RatingWidget from 'svg/rating-widget';
import PreviewWidget from 'svg/preview-widget';
import WysiwigWidget from 'svg/wysiwig-widget';
import MarkdownWidget from 'svg/markdown-widget';
import ReferenceWidget from 'svg/reference-widget';
import ReferencesWidget from 'svg/references-widget';
import SingleLineWidget from 'svg/singleline-widget';
import MultiLineWidget from 'svg/multipleline-widget';
import ReferenceCardWidget from 'svg/reference-card-widget';
import ReferencesCardWidget from 'svg/references-card-widget';
import MediaPreviewWidget from 'svg/media-preview-widget';
import MediaPreviewsWidget from 'svg/media-previews-widget';
import MediaReferenceWidget from 'svg/media-reference-widget';
import MediaReferencesWidget from 'svg/media-references-widget';
import FieldJSONSmall from 'svg/field-json-small';
import FieldShortTextSmall from 'svg/field-shorttext-small';
import FieldJSON from 'svg/field-json';
import FieldShortText from 'svg/field-shorttext';
import FieldLongTextSmall from 'svg/field-longtext-small';
import FieldNumberSmall from 'svg/field-number-small';
import FieldDecimalSmall from 'svg/field-decimal-small';
import FieldBooleanSmall from 'svg/field-boolean-small';
import FieldCalendarSmall from 'svg/field-calendar-small';
import FieldMediaSmall from 'svg/field-media-small';
import FieldLocationSmall from 'svg/field-location-small';
import FieldReferenceSmall from 'svg/field-reference-small';
import FieldLongText from 'svg/field-longtext';
import FieldNumber from 'svg/field-number';
import FieldDecimal from 'svg/field-decimal';
import FieldBoolean from 'svg/field-boolean';
import FieldCalendar from 'svg/field-calendar';
import FieldMedia from 'svg/field-media';
import FieldLocation from 'svg/field-location';
import FieldReference from 'svg/field-reference';
import FieldRichTextSmall from 'svg/field-richtext-small';
import FieldRichText from 'svg/field-richtext';
import InvitationNotFound from 'svg/invitation-not-found';
import ScheduleCalendar from 'svg/schedule-calendar';
import svgNavApiEs6 from 'svg/nav-api';
import svgNavAppsEs6 from 'svg/nav-apps';
import svgNavCtEs6 from 'svg/nav-ct';
import svgNavEntriesEs6 from 'svg/nav-entries';
import svgNavHomeEs6 from 'svg/nav-home';
import svgNavMediaEs6 from 'svg/nav-media';
import svgNavOrganizationBillingEs6 from 'svg/nav-organization-billing';
import svgNavOrganizationInformationEs6 from 'svg/nav-organization-information';
import svgNavOrganizationSsoEs6 from 'svg/nav-organization-sso';
import svgNavOrganizationSubscriptionEs6 from 'svg/nav-organization-subscription';
import svgNavOrganizationTeamsEs6 from 'svg/nav-organization-teams';
import svgNavOrganizationUsersEs6 from 'svg/nav-organization-users';
import svgNavSettingsEs6 from 'svg/nav-settings';
import svgNavSpacesEs6 from 'svg/nav-spaces';
import svgNavUsageEs6 from 'svg/nav-usage';
import svgNavUserApplicationsEs6 from 'svg/nav-user-applications';
import svgNavUserOauthEs6 from 'svg/nav-user-oauth';
import svgNavUserOrganizationsEs6 from 'svg/nav-user-organizations';
import svgNavUserSettingsEs6 from 'svg/nav-user-settings';

const SVGs = {
  'nav-api': svgNavApiEs6,
  'nav-apps': svgNavAppsEs6,
  'nav-ct': svgNavCtEs6,
  'nav-entries': svgNavEntriesEs6,
  'nav-home': svgNavHomeEs6,
  'nav-media': svgNavMediaEs6,
  'nav-organization-billing': svgNavOrganizationBillingEs6,
  'nav-organization-information': svgNavOrganizationInformationEs6,
  'nav-organization-sso': svgNavOrganizationSsoEs6,
  'nav-organization-subscription': svgNavOrganizationSubscriptionEs6,
  'nav-organization-teams': svgNavOrganizationTeamsEs6,
  'nav-organization-users': svgNavOrganizationUsersEs6,
  'nav-settings': svgNavSettingsEs6,
  'nav-spaces': svgNavSpacesEs6,
  'nav-usage': svgNavUsageEs6,
  'nav-user-applications': svgNavUserApplicationsEs6,
  'nav-user-oauth': svgNavUserOauthEs6,
  'nav-user-organizations': svgNavUserOrganizationsEs6,
  'nav-user-settings': svgNavUserSettingsEs6,
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
  'page-teams': PageTeams,
  'page-sso': PageSSO,
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
        {Icon && <Icon />}
      </span>
    );
  }
}

export default Icon;
