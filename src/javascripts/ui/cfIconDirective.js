import { registerDirective } from 'NgRegistry';
import createMountPoint from 'ui/Framework/DOMRenderer';
import { isFunction } from 'lodash';

import svgBynderIconEs6 from 'svg/BynderIcon.svg';
import svgCloudinaryIconEs6 from 'svg/CloudinaryIcon.svg';
import svgContentfulLogoEs6 from 'svg/ContentfulLogo.svg';
import svgContentfulLogoLightEs6 from 'svg/ContentfulLogoLight.svg';
import svgGatsbyIconEs6 from 'svg/GatsbyIcon.svg';
import svgQuestionMarkIconEs6 from 'svg/QuestionMarkIcon.svg';
import svgAddFolderEs6 from 'svg/add-folder.svg';
import svgAddTeamIllustrationEs6 from 'svg/add-team-illustration.svg';
import svgAddTeamToSpaceIllustrationEs6 from 'svg/add-team-to-space-illustration.svg';
import svgAddUserBlankEs6 from 'svg/add-user-blank.svg';
import svgAddUserIllustrationEs6 from 'svg/add-user-illustration.svg';
import svgAddViewEs6 from 'svg/add-view.svg';
import svgAddEs6 from 'svg/add.svg';
import svgAliasEs6 from 'svg/alias.svg';
import svgAliasesIllustrationEs6 from 'svg/aliases-illustration.svg';
import svgAndroidEs6 from 'svg/android.svg';
import svgArrowUpEs6 from 'svg/arrow-up.svg';
import svgAssetsEs6 from 'svg/assets.svg';
import svgAwsEs6 from 'svg/aws.svg';
import svgBinocularsIllustrationEs6 from 'svg/binoculars-illustration.svg';
import svgBreadcrumbsIconAncestorsEs6 from 'svg/breadcrumbs-icon-ancestors.svg';
import svgBreadcrumbsIconAssetEs6 from 'svg/breadcrumbs-icon-asset.svg';
import svgBreadcrumbsIconAssetsEs6 from 'svg/breadcrumbs-icon-assets.svg';
import svgBreadcrumbsIconBackEs6 from 'svg/breadcrumbs-icon-back.svg';
import svgBreadcrumbsIconEntriesEs6 from 'svg/breadcrumbs-icon-entries.svg';
import svgBreadcrumbsIconEntryEs6 from 'svg/breadcrumbs-icon-entry.svg';
import svgBreadcrumbsIconModelEs6 from 'svg/breadcrumbs-icon-model.svg';
import svgBreadcrumbsIconSettingsEs6 from 'svg/breadcrumbs-icon-settings.svg';
import svgBrunchEs6 from 'svg/brunch.svg';
import svgBubbleEs6 from 'svg/bubble.svg';
import svgCalendarEs6 from 'svg/calendar.svg';
import svgCaseStudySpaceHomeIllEs6 from 'svg/case-study-space-home-ill.svg';
import svgChartSymbolCircleEs6 from 'svg/chart-symbol-circle.svg';
import svgChartSymbolDiamondEs6 from 'svg/chart-symbol-diamond.svg';
import svgChartSymbolTriangleEs6 from 'svg/chart-symbol-triangle.svg';
import svgCheckboxWidgetEs6 from 'svg/checkbox-widget.svg';
import svgCheckmarkAltEs6 from 'svg/checkmark-alt.svg';
import svgCheckmarkEs6 from 'svg/checkmark.svg';
import svgChevronBlueEs6 from 'svg/chevron-blue.svg';
import svgCloseEs6 from 'svg/close.svg';
import svgCoffeeCupIllustrationEs6 from 'svg/coffee-cup-illustration.svg';
import svgCommunitySpaceHomeIllEs6 from 'svg/community-space-home-Ill.svg';
import svgConnectedFormsIllustrationEs6 from 'svg/connected-forms-illustration.svg';
import svgConnectedShapesEs6 from 'svg/connected-shapes.svg';
import svgContentGraphHighlightEs6 from 'svg/content-graph-highlight.svg';
import svgContentPreviewEmptyStateEs6 from 'svg/content-preview-empty-state.svg';
import svgContentStructureGraphEs6 from 'svg/content-structure-graph.svg';
import svgContentTabIllustrationEs6 from 'svg/content-tab-illustration.svg';
import svgDdArrowDownDisabledEs6 from 'svg/dd-arrow-down-disabled.svg';
import svgDdArrowDownEs6 from 'svg/dd-arrow-down.svg';
import svgDeleteEs6 from 'svg/delete.svg';
import svgDotnetEs6 from 'svg/dotnet.svg';
import svgDottedBorderEs6 from 'svg/dotted-border.svg';
import svgDownloadEs6 from 'svg/download.svg';
import svgDragHandle2Es6 from 'svg/drag-handle-2.svg';
import svgDragHandleEs6 from 'svg/drag-handle.svg';
import svgDropdownWidgetEs6 from 'svg/dropdown-widget.svg';
import svgEditEs6 from 'svg/edit.svg';
import svgEmptyContentModelEs6 from 'svg/empty-content-model.svg';
import svgEmptyContentEs6 from 'svg/empty-content.svg';
import svgEmptyMediaEs6 from 'svg/empty-media.svg';
import svgEmptyStateTeamsEs6 from 'svg/empty-state-teams.svg';
import svgEntriesEs6 from 'svg/entries.svg';
import svgEnvironmentEs6 from 'svg/environment.svg';
import svgErrorEs6 from 'svg/error.svg';
import svgFdHeadingsEs6 from 'svg/fd-headings.svg';
import svgFdInfoTextEs6 from 'svg/fd-info-text.svg';
import svgFieldBooleanSmallEs6 from 'svg/field-boolean-small.svg';
import svgFieldBooleanEs6 from 'svg/field-boolean.svg';
import svgFieldCalendarSmallEs6 from 'svg/field-calendar-small.svg';
import svgFieldCalendarEs6 from 'svg/field-calendar.svg';
import svgFieldDecimalSmallEs6 from 'svg/field-decimal-small.svg';
import svgFieldDecimalEs6 from 'svg/field-decimal.svg';
import svgFieldJsonSmallEs6 from 'svg/field-json-small.svg';
import svgFieldJsonEs6 from 'svg/field-json.svg';
import svgFieldLocationSmallEs6 from 'svg/field-location-small.svg';
import svgFieldLocationEs6 from 'svg/field-location.svg';
import svgFieldLongtextSmallEs6 from 'svg/field-longtext-small.svg';
import svgFieldLongtextEs6 from 'svg/field-longtext.svg';
import svgFieldMediaArraySmallEs6 from 'svg/field-media-array-small.svg';
import svgFieldMediaSmallEs6 from 'svg/field-media-small.svg';
import svgFieldMediaEs6 from 'svg/field-media.svg';
import svgFieldNumberSmallEs6 from 'svg/field-number-small.svg';
import svgFieldNumberEs6 from 'svg/field-number.svg';
import svgFieldReferenceSmallEs6 from 'svg/field-reference-small.svg';
import svgFieldReferenceEs6 from 'svg/field-reference.svg';
import svgFieldRichtextSmallEs6 from 'svg/field-richtext-small.svg';
import svgFieldRichtextEs6 from 'svg/field-richtext.svg';
import svgFieldShorttextArraySmallEs6 from 'svg/field-shorttext-array-small.svg';
import svgFieldShorttextSmallEs6 from 'svg/field-shorttext-small.svg';
import svgFieldShorttextEs6 from 'svg/field-shorttext.svg';
import svgFilterEs6 from 'svg/filter.svg';
import svgFlowerPenEs6 from 'svg/flower-pen.svg';
import svgFolderIllustrationEs6 from 'svg/folder-illustration.svg';
import svgFolderEs6 from 'svg/folder.svg';
import svgGitbookEs6 from 'svg/gitbook.svg';
import svgHamburgerEs6 from 'svg/hamburger.svg';
import svgHeaderIllustrationWideEs6 from 'svg/header-illustration-wide.svg';
import svgHintArrowEs6 from 'svg/hint-arrow.svg';
import svgHomeWelcomeEs6 from 'svg/home-welcome.svg';
import svgIconCartEs6 from 'svg/icon-cart.svg';
import svgIconCheckmarkDoneEs6 from 'svg/icon-checkmark-done.svg';
import svgIconFolderEs6 from 'svg/icon-folder.svg';
import svgIconGithubEs6 from 'svg/icon-github.svg';
import svgIconInfoEs6 from 'svg/icon-info.svg';
import svgIconOnboardingArrowEs6 from 'svg/icon-onboarding-arrow.svg';
import svgIconOnboardingContentfulReqResEs6 from 'svg/icon-onboarding-contentful-req-res.svg';
import svgIconOnboardingRelaunchEs6 from 'svg/icon-onboarding-relaunch.svg';
import svgIconPagesEs6 from 'svg/icon-pages.svg';
import svgIconThumbsDownEs6 from 'svg/icon-thumbs-down.svg';
import svgIconThumbsUpEs6 from 'svg/icon-thumbs-up.svg';
import svgIconUsersEs6 from 'svg/icon-users.svg';
import svgInfoEs6 from 'svg/info.svg';
import svgInfographicEs6 from 'svg/infographic.svg';
import svgInvitationNotFoundEs6 from 'svg/invitation-not-found.svg';
import svgInvoiceEs6 from 'svg/invoice.svg';
import svgJavascriptEs6 from 'svg/javascript.svg';
import svgJekyllEs6 from 'svg/jekyll.svg';
import svgLanguageAndroidEs6 from 'svg/language-android.svg';
import svgLanguageBrowserEs6 from 'svg/language-browser.svg';
import svgLanguageHttpEs6 from 'svg/language-http.svg';
import svgLanguageIosEs6 from 'svg/language-ios.svg';
import svgLanguageJsEs6 from 'svg/language-js.svg';
import svgLanguagePhpEs6 from 'svg/language-php.svg';
import svgLanguageRubyEs6 from 'svg/language-ruby.svg';
import svgLanguageObjcEs6 from 'svg/language_objc.svg';
import svgLinkEs6 from 'svg/link.svg';
import svgLockEs6 from 'svg/lock.svg';
import svgLogoAlgoliaEs6 from 'svg/logo-algolia.svg';
import svgLogoImageManagementEs6 from 'svg/logo-image-management.svg';
import svgLogoLabelEs6 from 'svg/logo-label.svg';
import svgLogoNetlifyEs6 from 'svg/logo-netlify.svg';
import svgMarkdownWidgetEs6 from 'svg/markdown-widget.svg';
import svgMarkdownEs6 from 'svg/markdown.svg';
import svgMediaEmptyStateEs6 from 'svg/media-empty-state.svg';
import svgMediaPreviewWidgetEs6 from 'svg/media-preview-widget.svg';
import svgMediaPreviewsWidgetEs6 from 'svg/media-previews-widget.svg';
import svgMediaReferenceWidgetEs6 from 'svg/media-reference-widget.svg';
import svgMediaReferencesWidgetEs6 from 'svg/media-references-widget.svg';
import svgMetalsmithEs6 from 'svg/metalsmith.svg';
import svgMultiplelineWidgetEs6 from 'svg/multipleline-widget.svg';
import svgNavApiEs6 from 'svg/nav-api.svg';
import svgNavAppsEs6 from 'svg/nav-apps.svg';
import svgNavCtEs6 from 'svg/nav-ct.svg';
import svgNavEntriesEs6 from 'svg/nav-entries.svg';
import svgNavHomeEs6 from 'svg/nav-home.svg';
import svgNavMediaEs6 from 'svg/nav-media.svg';
import svgNavOrganizationBillingEs6 from 'svg/nav-organization-billing.svg';
import svgNavOrganizationInformationEs6 from 'svg/nav-organization-information.svg';
import svgNavOrganizationSsoEs6 from 'svg/nav-organization-sso.svg';
import svgNavOrganizationSubscriptionEs6 from 'svg/nav-organization-subscription.svg';
import svgNavOrganizationTeamsEs6 from 'svg/nav-organization-teams.svg';
import svgNavOrganizationUsersEs6 from 'svg/nav-organization-users.svg';
import svgNavSettingsEs6 from 'svg/nav-settings.svg';
import svgNavSpacesEs6 from 'svg/nav-spaces.svg';
import svgNavUsageEs6 from 'svg/nav-usage.svg';
import svgNavUserApplicationsEs6 from 'svg/nav-user-applications.svg';
import svgNavUserOauthEs6 from 'svg/nav-user-oauth.svg';
import svgNavUserOrganizationsEs6 from 'svg/nav-user-organizations.svg';
import svgNavUserSettingsEs6 from 'svg/nav-user-settings.svg';
import svgNewCtEs6 from 'svg/new-ct.svg';
import svgNoteInfoEs6 from 'svg/note-info.svg';
import svgNoteSuccessEs6 from 'svg/note-success.svg';
import svgNoteWarningEs6 from 'svg/note-warning.svg';
import svgNumberWidgetEs6 from 'svg/number-widget.svg';
import svgOnboardingAddUserEs6 from 'svg/onboarding-add-user.svg';
import svgOnboardingLocalesEs6 from 'svg/onboarding-locales.svg';
import svgOnboardingSpaceEs6 from 'svg/onboarding-space.svg';
import svgOnboardingWebhooksEs6 from 'svg/onboarding-webhooks.svg';
import svgOrgSliderIllustrationEs6 from 'svg/org-slider-illustration.svg';
import svgPageApisEs6 from 'svg/page-apis.svg';
import svgPageAppsEs6 from 'svg/page-apps.svg';
import svgPageContentEs6 from 'svg/page-content.svg';
import svgPageCtEs6 from 'svg/page-ct.svg';
import svgPageEntriesEs6 from 'svg/page-entries.svg';
import svgPageMediaEs6 from 'svg/page-media.svg';
import svgPageSettingsEs6 from 'svg/page-settings.svg';
import svgPageSsoEs6 from 'svg/page-sso.svg';
import svgPageTeamsEs6 from 'svg/page-teams.svg';
import svgPageUsageEs6 from 'svg/page-usage.svg';
import svgPageUsersEs6 from 'svg/page-users.svg';
import svgPaywallPlanplusEs6 from 'svg/paywall-planplus.svg';
import svgPenIllustrationEs6 from 'svg/pen-illustration.svg';
import svgPhpEs6 from 'svg/php.svg';
import svgPlus2Es6 from 'svg/plus-2.svg';
import svgPlusEs6 from 'svg/plus.svg';
import svgPreviewWidgetEs6 from 'svg/preview-widget.svg';
import svgPricingPlanTeamEditionEs6 from 'svg/pricing-plan-team_edition.svg';
import svgPythonEs6 from 'svg/python.svg';
import svgRadioWidgetEs6 from 'svg/radio-widget.svg';
import svgRatingWidgetEs6 from 'svg/rating-widget.svg';
import svgReadonlySpaceHomeIllEs6 from 'svg/readonly-space-home-ill.svg';
import svgReadonlySpaceIllEs6 from 'svg/readonly-space-ill.svg';
import svgReferenceCardWidgetEs6 from 'svg/reference-card-widget.svg';
import svgReferenceWidgetEs6 from 'svg/reference-widget.svg';
import svgReferencesCardWidgetEs6 from 'svg/references-card-widget.svg';
import svgReferencesWidgetEs6 from 'svg/references-widget.svg';
import svgRubyEs6 from 'svg/ruby.svg';
import svgScheduleCalendarEs6 from 'svg/schedule-calendar.svg';
import svgSearchEs6 from 'svg/search.svg';
import svgSettingsEs6 from 'svg/settings.svg';
import svgSidepanelSpacesAdviceEs6 from 'svg/sidepanel-spaces-advice.svg';
import svgSinglelineWidgetEs6 from 'svg/singleline-widget.svg';
import svgSlugWidgetEs6 from 'svg/slug-widget.svg';
import svgSpaceDiagramEs6 from 'svg/space-diagram.svg';
import svgSpaceHomeDocumentationIllEs6 from 'svg/space-home-documentation-ill.svg';
import svgSpaceEs6 from 'svg/space.svg';
import svgSpacetemplateBlogEs6 from 'svg/spacetemplate-blog.svg';
import svgSpacetemplateCatalogueEs6 from 'svg/spacetemplate-catalogue.svg';
import svgSpacetemplateGalleryEs6 from 'svg/spacetemplate-gallery.svg';
import svgSpacetemplateTeaEs6 from 'svg/spacetemplate-tea.svg';
import svgSubscriptionEs6 from 'svg/subscription.svg';
import svgSwiftEs6 from 'svg/swift.svg';
import svgTagsWidgetEs6 from 'svg/tags-widget.svg';
import svgTextFieldsEs6 from 'svg/text-fields.svg';
import svgTranslationsIconEs6 from 'svg/translations-icon.svg';
import svgUnknownErrorIllustrationEs6 from 'svg/unknown-error-illustration.svg';
import svgVideoPreviewWidgetEs6 from 'svg/video-preview-widget.svg';
import svgWavyBackgroundEs6 from 'svg/wavy-background.svg';
import svgWysiwigWidgetEs6 from 'svg/wysiwig-widget.svg';

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
