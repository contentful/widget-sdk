import { registerDirective } from 'NgRegistry';
import createMountPoint from 'ui/Framework/DOMRenderer';
import { isFunction } from 'lodash';

import svgBynderIconEs6 from 'svg/BynderIcon';
import svgCloudinaryIconEs6 from 'svg/CloudinaryIcon';
import svgContentfulLogoEs6 from 'svg/ContentfulLogo';
import svgContentfulLogoLightEs6 from 'svg/ContentfulLogoLight';
import svgGatsbyIconEs6 from 'svg/GatsbyIcon';
import svgQuestionMarkIconEs6 from 'svg/QuestionMarkIcon';
import svgAddFolderEs6 from 'svg/add-folder';
import svgAddTeamIllustrationEs6 from 'svg/add-team-illustration';
import svgAddTeamToSpaceIllustrationEs6 from 'svg/add-team-to-space-illustration';
import svgAddUserBlankEs6 from 'svg/add-user-blank';
import svgAddUserIllustrationEs6 from 'svg/add-user-illustration';
import svgAddViewEs6 from 'svg/add-view';
import svgAddEs6 from 'svg/add';
import svgAliasEs6 from 'svg/alias';
import svgAliasesIllustrationEs6 from 'svg/aliases-illustration';
import svgAndroidEs6 from 'svg/android';
import svgArrowUpEs6 from 'svg/arrow-up';
import svgAssetsEs6 from 'svg/assets';
import svgAwsEs6 from 'svg/aws';
import svgBinocularsIllustrationEs6 from 'svg/binoculars-illustration';
import svgBreadcrumbsIconAncestorsEs6 from 'svg/breadcrumbs-icon-ancestors';
import svgBreadcrumbsIconAssetEs6 from 'svg/breadcrumbs-icon-asset';
import svgBreadcrumbsIconAssetsEs6 from 'svg/breadcrumbs-icon-assets';
import svgBreadcrumbsIconBackEs6 from 'svg/breadcrumbs-icon-back';
import svgBreadcrumbsIconEntriesEs6 from 'svg/breadcrumbs-icon-entries';
import svgBreadcrumbsIconEntryEs6 from 'svg/breadcrumbs-icon-entry';
import svgBreadcrumbsIconModelEs6 from 'svg/breadcrumbs-icon-model';
import svgBreadcrumbsIconSettingsEs6 from 'svg/breadcrumbs-icon-settings';
import svgBrunchEs6 from 'svg/brunch';
import svgBubbleEs6 from 'svg/bubble';
import svgCalendarEs6 from 'svg/calendar';
import svgCaseStudySpaceHomeIllEs6 from 'svg/case-study-space-home-ill';
import svgChartSymbolCircleEs6 from 'svg/chart-symbol-circle';
import svgChartSymbolDiamondEs6 from 'svg/chart-symbol-diamond';
import svgChartSymbolTriangleEs6 from 'svg/chart-symbol-triangle';
import svgCheckboxWidgetEs6 from 'svg/checkbox-widget';
import svgCheckmarkAltEs6 from 'svg/checkmark-alt';
import svgCheckmarkEs6 from 'svg/checkmark';
import svgChevronBlueEs6 from 'svg/chevron-blue';
import svgCloseEs6 from 'svg/close';
import svgCoffeeCupIllustrationEs6 from 'svg/coffee-cup-illustration';
import svgCommunitySpaceHomeIllEs6 from 'svg/community-space-home-Ill';
import svgConnectedFormsIllustrationEs6 from 'svg/connected-forms-illustration';
import svgConnectedShapesEs6 from 'svg/connected-shapes';
import svgContentGraphHighlightEs6 from 'svg/content-graph-highlight';
import svgContentPreviewEmptyStateEs6 from 'svg/content-preview-empty-state';
import svgContentStructureGraphEs6 from 'svg/content-structure-graph';
import svgContentTabIllustrationEs6 from 'svg/content-tab-illustration';
import svgDdArrowDownDisabledEs6 from 'svg/dd-arrow-down-disabled';
import svgDdArrowDownEs6 from 'svg/dd-arrow-down';
import svgDeleteEs6 from 'svg/delete';
import svgDotnetEs6 from 'svg/dotnet';
import svgDottedBorderEs6 from 'svg/dotted-border';
import svgDownloadEs6 from 'svg/download';
import svgDragHandle2Es6 from 'svg/drag-handle-2';
import svgDragHandleEs6 from 'svg/drag-handle';
import svgDropdownWidgetEs6 from 'svg/dropdown-widget';
import svgEditEs6 from 'svg/edit';
import svgEmptyContentModelEs6 from 'svg/empty-content-model';
import svgEmptyContentEs6 from 'svg/empty-content';
import svgEmptyMediaEs6 from 'svg/empty-media';
import svgEmptyStateTeamsEs6 from 'svg/empty-state-teams';
import svgEntriesEs6 from 'svg/entries';
import svgEnvironmentEs6 from 'svg/environment';
import svgErrorEs6 from 'svg/error';
import svgFdHeadingsEs6 from 'svg/fd-headings';
import svgFdInfoTextEs6 from 'svg/fd-info-text';
import svgFieldBooleanSmallEs6 from 'svg/field-boolean-small';
import svgFieldBooleanEs6 from 'svg/field-boolean';
import svgFieldCalendarSmallEs6 from 'svg/field-calendar-small';
import svgFieldCalendarEs6 from 'svg/field-calendar';
import svgFieldDecimalSmallEs6 from 'svg/field-decimal-small';
import svgFieldDecimalEs6 from 'svg/field-decimal';
import svgFieldJsonSmallEs6 from 'svg/field-json-small';
import svgFieldJsonEs6 from 'svg/field-json';
import svgFieldLocationSmallEs6 from 'svg/field-location-small';
import svgFieldLocationEs6 from 'svg/field-location';
import svgFieldLongtextSmallEs6 from 'svg/field-longtext-small';
import svgFieldLongtextEs6 from 'svg/field-longtext';
import svgFieldMediaArraySmallEs6 from 'svg/field-media-array-small';
import svgFieldMediaSmallEs6 from 'svg/field-media-small';
import svgFieldMediaEs6 from 'svg/field-media';
import svgFieldNumberSmallEs6 from 'svg/field-number-small';
import svgFieldNumberEs6 from 'svg/field-number';
import svgFieldReferenceSmallEs6 from 'svg/field-reference-small';
import svgFieldReferenceEs6 from 'svg/field-reference';
import svgFieldRichtextSmallEs6 from 'svg/field-richtext-small';
import svgFieldRichtextEs6 from 'svg/field-richtext';
import svgFieldShorttextArraySmallEs6 from 'svg/field-shorttext-array-small';
import svgFieldShorttextSmallEs6 from 'svg/field-shorttext-small';
import svgFieldShorttextEs6 from 'svg/field-shorttext';
import svgFilterEs6 from 'svg/filter';
import svgFlowerPenEs6 from 'svg/flower-pen';
import svgFolderIllustrationEs6 from 'svg/folder-illustration';
import svgFolderEs6 from 'svg/folder';
import svgGitbookEs6 from 'svg/gitbook';
import svgHamburgerEs6 from 'svg/hamburger';
import svgHeaderIllustrationWideEs6 from 'svg/header-illustration-wide';
import svgHintArrowEs6 from 'svg/hint-arrow';
import svgHomeWelcomeEs6 from 'svg/home-welcome';
import svgIconCartEs6 from 'svg/icon-cart';
import svgIconCheckmarkDoneEs6 from 'svg/icon-checkmark-done';
import svgIconFolderEs6 from 'svg/icon-folder';
import svgIconGithubEs6 from 'svg/icon-github';
import svgIconInfoEs6 from 'svg/icon-info';
import svgIconOnboardingArrowEs6 from 'svg/icon-onboarding-arrow';
import svgIconOnboardingContentfulReqResEs6 from 'svg/icon-onboarding-contentful-req-res';
import svgIconOnboardingRelaunchEs6 from 'svg/icon-onboarding-relaunch';
import svgIconPagesEs6 from 'svg/icon-pages';
import svgIconThumbsDownEs6 from 'svg/icon-thumbs-down';
import svgIconThumbsUpEs6 from 'svg/icon-thumbs-up';
import svgIconUsersEs6 from 'svg/icon-users';
import svgInfoEs6 from 'svg/info';
import svgInfographicEs6 from 'svg/infographic';
import svgInvitationNotFoundEs6 from 'svg/invitation-not-found';
import svgInvoiceEs6 from 'svg/invoice';
import svgJavascriptEs6 from 'svg/javascript';
import svgJekyllEs6 from 'svg/jekyll';
import svgLanguageAndroidEs6 from 'svg/language-android';
import svgLanguageBrowserEs6 from 'svg/language-browser';
import svgLanguageHttpEs6 from 'svg/language-http';
import svgLanguageIosEs6 from 'svg/language-ios';
import svgLanguageJsEs6 from 'svg/language-js';
import svgLanguagePhpEs6 from 'svg/language-php';
import svgLanguageRubyEs6 from 'svg/language-ruby';
import svgLanguageObjcEs6 from 'svg/language_objc';
import svgLinkEs6 from 'svg/link';
import svgLockEs6 from 'svg/lock';
import svgLogoAlgoliaEs6 from 'svg/logo-algolia';
import svgLogoImageManagementEs6 from 'svg/logo-image-management';
import svgLogoLabelEs6 from 'svg/logo-label';
import svgLogoNetlifyEs6 from 'svg/logo-netlify';
import svgMarkdownWidgetEs6 from 'svg/markdown-widget';
import svgMarkdownEs6 from 'svg/markdown';
import svgMediaEmptyStateEs6 from 'svg/media-empty-state';
import svgMediaPreviewWidgetEs6 from 'svg/media-preview-widget';
import svgMediaPreviewsWidgetEs6 from 'svg/media-previews-widget';
import svgMediaReferenceWidgetEs6 from 'svg/media-reference-widget';
import svgMediaReferencesWidgetEs6 from 'svg/media-references-widget';
import svgMetalsmithEs6 from 'svg/metalsmith';
import svgMultiplelineWidgetEs6 from 'svg/multipleline-widget';
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
import svgNewCtEs6 from 'svg/new-ct';
import svgNoteInfoEs6 from 'svg/note-info';
import svgNoteSuccessEs6 from 'svg/note-success';
import svgNoteWarningEs6 from 'svg/note-warning';
import svgNumberWidgetEs6 from 'svg/number-widget';
import svgOnboardingAddUserEs6 from 'svg/onboarding-add-user';
import svgOnboardingLocalesEs6 from 'svg/onboarding-locales';
import svgOnboardingSpaceEs6 from 'svg/onboarding-space';
import svgOnboardingWebhooksEs6 from 'svg/onboarding-webhooks';
import svgOrgSliderIllustrationEs6 from 'svg/org-slider-illustration';
import svgPageApisEs6 from 'svg/page-apis';
import svgPageAppsEs6 from 'svg/page-apps';
import svgPageContentEs6 from 'svg/page-content';
import svgPageCtEs6 from 'svg/page-ct';
import svgPageEntriesEs6 from 'svg/page-entries';
import svgPageMediaEs6 from 'svg/page-media';
import svgPageSettingsEs6 from 'svg/page-settings';
import svgPageSsoEs6 from 'svg/page-sso';
import svgPageTeamsEs6 from 'svg/page-teams';
import svgPageUsageEs6 from 'svg/page-usage';
import svgPageUsersEs6 from 'svg/page-users';
import svgPaywallPlanplusEs6 from 'svg/paywall-planplus';
import svgPenIllustrationEs6 from 'svg/pen-illustration';
import svgPhpEs6 from 'svg/php';
import svgPlus2Es6 from 'svg/plus-2';
import svgPlusEs6 from 'svg/plus';
import svgPreviewWidgetEs6 from 'svg/preview-widget';
import svgPricingPlanTeamEditionEs6 from 'svg/pricing-plan-team_edition';
import svgPythonEs6 from 'svg/python';
import svgRadioWidgetEs6 from 'svg/radio-widget';
import svgRatingWidgetEs6 from 'svg/rating-widget';
import svgReadonlySpaceHomeIllEs6 from 'svg/readonly-space-home-ill';
import svgReadonlySpaceIllEs6 from 'svg/readonly-space-ill';
import svgReferenceCardWidgetEs6 from 'svg/reference-card-widget';
import svgReferenceWidgetEs6 from 'svg/reference-widget';
import svgReferencesCardWidgetEs6 from 'svg/references-card-widget';
import svgReferencesWidgetEs6 from 'svg/references-widget';
import svgRubyEs6 from 'svg/ruby';
import svgScheduleCalendarEs6 from 'svg/schedule-calendar';
import svgSearchEs6 from 'svg/search';
import svgSettingsEs6 from 'svg/settings';
import svgSidepanelSpacesAdviceEs6 from 'svg/sidepanel-spaces-advice';
import svgSinglelineWidgetEs6 from 'svg/singleline-widget';
import svgSlugWidgetEs6 from 'svg/slug-widget';
import svgSpaceDiagramEs6 from 'svg/space-diagram';
import svgSpaceHomeDocumentationIllEs6 from 'svg/space-home-documentation-ill';
import svgSpaceEs6 from 'svg/space';
import svgSpacetemplateBlogEs6 from 'svg/spacetemplate-blog';
import svgSpacetemplateCatalogueEs6 from 'svg/spacetemplate-catalogue';
import svgSpacetemplateGalleryEs6 from 'svg/spacetemplate-gallery';
import svgSpacetemplateTeaEs6 from 'svg/spacetemplate-tea';
import svgSubscriptionEs6 from 'svg/subscription';
import svgSwiftEs6 from 'svg/swift';
import svgTagsWidgetEs6 from 'svg/tags-widget';
import svgTextFieldsEs6 from 'svg/text-fields';
import svgTranslationsIconEs6 from 'svg/translations-icon';
import svgUnknownErrorIllustrationEs6 from 'svg/unknown-error-illustration';
import svgVideoPreviewWidgetEs6 from 'svg/video-preview-widget';
import svgWavyBackgroundEs6 from 'svg/wavy-background';
import svgWysiwigWidgetEs6 from 'svg/wysiwig-widget';

const SVGs = {
  BynderIcon: svgBynderIconEs6,
  CloudinaryIcon: svgCloudinaryIconEs6,
  ContentfulLogo: svgContentfulLogoEs6,
  ContentfulLogoLight: svgContentfulLogoLightEs6,
  GatsbyIcon: svgGatsbyIconEs6,
  QuestionMarkIcon: svgQuestionMarkIconEs6,
  'add-folder': svgAddFolderEs6,
  'add-team-illustration': svgAddTeamIllustrationEs6,
  'add-team-to-space-illustration': svgAddTeamToSpaceIllustrationEs6,
  'add-user-blank': svgAddUserBlankEs6,
  'add-user-illustration': svgAddUserIllustrationEs6,
  'add-view': svgAddViewEs6,
  add: svgAddEs6,
  alias: svgAliasEs6,
  'aliases-illustration': svgAliasesIllustrationEs6,
  android: svgAndroidEs6,
  'arrow-up': svgArrowUpEs6,
  assets: svgAssetsEs6,
  aws: svgAwsEs6,
  'binoculars-illustration': svgBinocularsIllustrationEs6,
  'breadcrumbs-icon-ancestors': svgBreadcrumbsIconAncestorsEs6,
  'breadcrumbs-icon-asset': svgBreadcrumbsIconAssetEs6,
  'breadcrumbs-icon-assets': svgBreadcrumbsIconAssetsEs6,
  'breadcrumbs-icon-back': svgBreadcrumbsIconBackEs6,
  'breadcrumbs-icon-entries': svgBreadcrumbsIconEntriesEs6,
  'breadcrumbs-icon-entry': svgBreadcrumbsIconEntryEs6,
  'breadcrumbs-icon-model': svgBreadcrumbsIconModelEs6,
  'breadcrumbs-icon-settings': svgBreadcrumbsIconSettingsEs6,
  brunch: svgBrunchEs6,
  bubble: svgBubbleEs6,
  calendar: svgCalendarEs6,
  'case-study-space-home-ill': svgCaseStudySpaceHomeIllEs6,
  'chart-symbol-circle': svgChartSymbolCircleEs6,
  'chart-symbol-diamond': svgChartSymbolDiamondEs6,
  'chart-symbol-triangle': svgChartSymbolTriangleEs6,
  'checkbox-widget': svgCheckboxWidgetEs6,
  'checkmark-alt': svgCheckmarkAltEs6,
  checkmark: svgCheckmarkEs6,
  'chevron-blue': svgChevronBlueEs6,
  close: svgCloseEs6,
  'coffee-cup-illustration': svgCoffeeCupIllustrationEs6,
  'community-space-home-Ill': svgCommunitySpaceHomeIllEs6,
  'connected-forms-illustration': svgConnectedFormsIllustrationEs6,
  'connected-shapes': svgConnectedShapesEs6,
  'content-graph-highlight': svgContentGraphHighlightEs6,
  'content-preview-empty-state': svgContentPreviewEmptyStateEs6,
  'content-structure-graph': svgContentStructureGraphEs6,
  'content-tab-illustration': svgContentTabIllustrationEs6,
  'dd-arrow-down-disabled': svgDdArrowDownDisabledEs6,
  'dd-arrow-down': svgDdArrowDownEs6,
  delete: svgDeleteEs6,
  dotnet: svgDotnetEs6,
  'dotted-border': svgDottedBorderEs6,
  download: svgDownloadEs6,
  'drag-handle-2': svgDragHandle2Es6,
  'drag-handle': svgDragHandleEs6,
  'dropdown-widget': svgDropdownWidgetEs6,
  edit: svgEditEs6,
  'empty-content-model': svgEmptyContentModelEs6,
  'empty-content': svgEmptyContentEs6,
  'empty-media': svgEmptyMediaEs6,
  'empty-state-teams': svgEmptyStateTeamsEs6,
  entries: svgEntriesEs6,
  environment: svgEnvironmentEs6,
  error: svgErrorEs6,
  'fd-headings': svgFdHeadingsEs6,
  'fd-info-text': svgFdInfoTextEs6,
  'field-boolean-small': svgFieldBooleanSmallEs6,
  'field-boolean': svgFieldBooleanEs6,
  'field-calendar-small': svgFieldCalendarSmallEs6,
  'field-calendar': svgFieldCalendarEs6,
  'field-decimal-small': svgFieldDecimalSmallEs6,
  'field-decimal': svgFieldDecimalEs6,
  'field-json-small': svgFieldJsonSmallEs6,
  'field-json': svgFieldJsonEs6,
  'field-location-small': svgFieldLocationSmallEs6,
  'field-location': svgFieldLocationEs6,
  'field-longtext-small': svgFieldLongtextSmallEs6,
  'field-longtext': svgFieldLongtextEs6,
  'field-media-array-small': svgFieldMediaArraySmallEs6,
  'field-media-small': svgFieldMediaSmallEs6,
  'field-media': svgFieldMediaEs6,
  'field-number-small': svgFieldNumberSmallEs6,
  'field-number': svgFieldNumberEs6,
  'field-reference-small': svgFieldReferenceSmallEs6,
  'field-reference': svgFieldReferenceEs6,
  'field-richtext-small': svgFieldRichtextSmallEs6,
  'field-richtext': svgFieldRichtextEs6,
  'field-shorttext-array-small': svgFieldShorttextArraySmallEs6,
  'field-shorttext-small': svgFieldShorttextSmallEs6,
  'field-shorttext': svgFieldShorttextEs6,
  filter: svgFilterEs6,
  'flower-pen': svgFlowerPenEs6,
  'folder-illustration': svgFolderIllustrationEs6,
  folder: svgFolderEs6,
  gitbook: svgGitbookEs6,
  hamburger: svgHamburgerEs6,
  'header-illustration-wide': svgHeaderIllustrationWideEs6,
  'hint-arrow': svgHintArrowEs6,
  'home-welcome': svgHomeWelcomeEs6,
  'icon-cart': svgIconCartEs6,
  'icon-checkmark-done': svgIconCheckmarkDoneEs6,
  'icon-folder': svgIconFolderEs6,
  'icon-github': svgIconGithubEs6,
  'icon-info': svgIconInfoEs6,
  'icon-onboarding-arrow': svgIconOnboardingArrowEs6,
  'icon-onboarding-contentful-req-res': svgIconOnboardingContentfulReqResEs6,
  'icon-onboarding-relaunch': svgIconOnboardingRelaunchEs6,
  'icon-pages': svgIconPagesEs6,
  'icon-thumbs-down': svgIconThumbsDownEs6,
  'icon-thumbs-up': svgIconThumbsUpEs6,
  'icon-users': svgIconUsersEs6,
  info: svgInfoEs6,
  infographic: svgInfographicEs6,
  'invitation-not-found': svgInvitationNotFoundEs6,
  invoice: svgInvoiceEs6,
  javascript: svgJavascriptEs6,
  jekyll: svgJekyllEs6,
  'language-android': svgLanguageAndroidEs6,
  'language-browser': svgLanguageBrowserEs6,
  'language-http': svgLanguageHttpEs6,
  'language-ios': svgLanguageIosEs6,
  'language-js': svgLanguageJsEs6,
  'language-php': svgLanguagePhpEs6,
  'language-ruby': svgLanguageRubyEs6,
  language_objc: svgLanguageObjcEs6,
  link: svgLinkEs6,
  lock: svgLockEs6,
  'logo-algolia': svgLogoAlgoliaEs6,
  'logo-image-management': svgLogoImageManagementEs6,
  'logo-label': svgLogoLabelEs6,
  'logo-netlify': svgLogoNetlifyEs6,
  'markdown-widget': svgMarkdownWidgetEs6,
  markdown: svgMarkdownEs6,
  'media-empty-state': svgMediaEmptyStateEs6,
  'media-preview-widget': svgMediaPreviewWidgetEs6,
  'media-previews-widget': svgMediaPreviewsWidgetEs6,
  'media-reference-widget': svgMediaReferenceWidgetEs6,
  'media-references-widget': svgMediaReferencesWidgetEs6,
  metalsmith: svgMetalsmithEs6,
  'multipleline-widget': svgMultiplelineWidgetEs6,
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
  'new-ct': svgNewCtEs6,
  'note-info': svgNoteInfoEs6,
  'note-success': svgNoteSuccessEs6,
  'note-warning': svgNoteWarningEs6,
  'number-widget': svgNumberWidgetEs6,
  'onboarding-add-user': svgOnboardingAddUserEs6,
  'onboarding-locales': svgOnboardingLocalesEs6,
  'onboarding-space': svgOnboardingSpaceEs6,
  'onboarding-webhooks': svgOnboardingWebhooksEs6,
  'org-slider-illustration': svgOrgSliderIllustrationEs6,
  'page-apis': svgPageApisEs6,
  'page-apps': svgPageAppsEs6,
  'page-content': svgPageContentEs6,
  'page-ct': svgPageCtEs6,
  'page-entries': svgPageEntriesEs6,
  'page-media': svgPageMediaEs6,
  'page-settings': svgPageSettingsEs6,
  'page-sso': svgPageSsoEs6,
  'page-teams': svgPageTeamsEs6,
  'page-usage': svgPageUsageEs6,
  'page-users': svgPageUsersEs6,
  'paywall-planplus': svgPaywallPlanplusEs6,
  'pen-illustration': svgPenIllustrationEs6,
  php: svgPhpEs6,
  'plus-2': svgPlus2Es6,
  plus: svgPlusEs6,
  'preview-widget': svgPreviewWidgetEs6,
  'pricing-plan-team_edition': svgPricingPlanTeamEditionEs6,
  python: svgPythonEs6,
  'radio-widget': svgRadioWidgetEs6,
  'rating-widget': svgRatingWidgetEs6,
  'readonly-space-home-ill': svgReadonlySpaceHomeIllEs6,
  'readonly-space-ill': svgReadonlySpaceIllEs6,
  'reference-card-widget': svgReferenceCardWidgetEs6,
  'reference-widget': svgReferenceWidgetEs6,
  'references-card-widget': svgReferencesCardWidgetEs6,
  'references-widget': svgReferencesWidgetEs6,
  ruby: svgRubyEs6,
  'schedule-calendar': svgScheduleCalendarEs6,
  search: svgSearchEs6,
  settings: svgSettingsEs6,
  'sidepanel-spaces-advice': svgSidepanelSpacesAdviceEs6,
  'singleline-widget': svgSinglelineWidgetEs6,
  'slug-widget': svgSlugWidgetEs6,
  'space-diagram': svgSpaceDiagramEs6,
  'space-home-documentation-ill': svgSpaceHomeDocumentationIllEs6,
  space: svgSpaceEs6,
  'spacetemplate-blog': svgSpacetemplateBlogEs6,
  'spacetemplate-catalogue': svgSpacetemplateCatalogueEs6,
  'spacetemplate-gallery': svgSpacetemplateGalleryEs6,
  'spacetemplate-tea': svgSpacetemplateTeaEs6,
  subscription: svgSubscriptionEs6,
  swift: svgSwiftEs6,
  'tags-widget': svgTagsWidgetEs6,
  'text-fields': svgTextFieldsEs6,
  'translations-icon': svgTranslationsIconEs6,
  'unknown-error-illustration': svgUnknownErrorIllustrationEs6,
  'video-preview-widget': svgVideoPreviewWidgetEs6,
  'wavy-background': svgWavyBackgroundEs6,
  'wysiwig-widget': svgWysiwigWidgetEs6
};

export default function register() {
  /*
   * @ngdoc directive
   * @name cfIcon
   * @description
   * This directive is a helper for the SVG icon system
   *
   * It will inject the SVG code for the icon which has been previously generated.
   * @usage[jade]
   * cf-icon(name="close")
   * cf-icon(name="close" scale="2")
   * cf-icon(name="close" height="20")
   */
  registerDirective('cfIcon', () => ({
    restrict: 'E',
    link: function(_scope, el, attrs) {
      const mountPoint = createMountPoint(el.get(0));
      const icon = SVGs[attrs.name];
      mountPoint.render(isFunction(icon) ? icon() : icon);

      const iconElem = el.children().get(0);
      if (!iconElem) {
        return;
      }

      const scale = parseFloat(attrs.scale);
      if (scale === 0) {
        iconElem.removeAttribute('width');
        iconElem.removeAttribute('height');
      } else if (!isNaN(scale)) {
        const width = parseInt(iconElem.getAttribute('width'), 10);
        const height = parseInt(iconElem.getAttribute('height'), 10);
        iconElem.setAttribute('width', width * scale);
        iconElem.setAttribute('height', height * scale);
      }

      const setHeight = parseFloat(attrs.height);
      if (!isNaN(setHeight)) {
        iconElem.setAttribute('height', setHeight);
      }
    }
  }));
}
