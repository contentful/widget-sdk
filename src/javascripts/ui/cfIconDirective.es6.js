import { registerDirective } from 'NgRegistry.es6';
import createMountPoint from 'ui/Framework/DOMRenderer.es6';
import { isFunction } from 'lodash';

import svgBynderIconEs6 from 'svg/BynderIcon.es6';
import svgCloudinaryIconEs6 from 'svg/CloudinaryIcon.es6';
import svgContentfulLogoEs6 from 'svg/ContentfulLogo.es6';
import svgContentfulLogoLightEs6 from 'svg/ContentfulLogoLight.es6';
import svgGatsbyIconEs6 from 'svg/GatsbyIcon.es6';
import svgQuestionMarkIconEs6 from 'svg/QuestionMarkIcon.es6';
import svgAddFolderEs6 from 'svg/add-folder.es6';
import svgAddTeamIllustrationEs6 from 'svg/add-team-illustration.es6';
import svgAddTeamToSpaceIllustrationEs6 from 'svg/add-team-to-space-illustration.es6';
import svgAddUserBlankEs6 from 'svg/add-user-blank.es6';
import svgAddUserIllustrationEs6 from 'svg/add-user-illustration.es6';
import svgAddViewEs6 from 'svg/add-view.es6';
import svgAddEs6 from 'svg/add.es6';
import svgAliasEs6 from 'svg/alias.es6';
import svgAliasesIllustrationEs6 from 'svg/aliases-illustration.es6';
import svgAndroidEs6 from 'svg/android.es6';
import svgArrowUpEs6 from 'svg/arrow-up.es6';
import svgAssetsEs6 from 'svg/assets.es6';
import svgAwsEs6 from 'svg/aws.es6';
import svgBinocularsIllustrationEs6 from 'svg/binoculars-illustration.es6';
import svgBreadcrumbsIconAncestorsEs6 from 'svg/breadcrumbs-icon-ancestors.es6';
import svgBreadcrumbsIconAssetEs6 from 'svg/breadcrumbs-icon-asset.es6';
import svgBreadcrumbsIconAssetsEs6 from 'svg/breadcrumbs-icon-assets.es6';
import svgBreadcrumbsIconBackEs6 from 'svg/breadcrumbs-icon-back.es6';
import svgBreadcrumbsIconEntriesEs6 from 'svg/breadcrumbs-icon-entries.es6';
import svgBreadcrumbsIconEntryEs6 from 'svg/breadcrumbs-icon-entry.es6';
import svgBreadcrumbsIconModelEs6 from 'svg/breadcrumbs-icon-model.es6';
import svgBreadcrumbsIconSettingsEs6 from 'svg/breadcrumbs-icon-settings.es6';
import svgBrunchEs6 from 'svg/brunch.es6';
import svgBubbleEs6 from 'svg/bubble.es6';
import svgCalendarEs6 from 'svg/calendar.es6';
import svgCaseStudySpaceHomeIllEs6 from 'svg/case-study-space-home-ill.es6';
import svgChartSymbolCircleEs6 from 'svg/chart-symbol-circle.es6';
import svgChartSymbolDiamondEs6 from 'svg/chart-symbol-diamond.es6';
import svgChartSymbolTriangleEs6 from 'svg/chart-symbol-triangle.es6';
import svgCheckboxWidgetEs6 from 'svg/checkbox-widget.es6';
import svgCheckmarkAltEs6 from 'svg/checkmark-alt.es6';
import svgCheckmarkEs6 from 'svg/checkmark.es6';
import svgChevronBlueEs6 from 'svg/chevron-blue.es6';
import svgCloseEs6 from 'svg/close.es6';
import svgCoffeeCupIllustrationEs6 from 'svg/coffee-cup-illustration.es6';
import svgCommunitySpaceHomeIllEs6 from 'svg/community-space-home-Ill.es6';
import svgConnectedFormsIllustrationEs6 from 'svg/connected-forms-illustration.es6';
import svgConnectedShapesEs6 from 'svg/connected-shapes.es6';
import svgContentGraphHighlightEs6 from 'svg/content-graph-highlight.es6';
import svgContentPreviewEmptyStateEs6 from 'svg/content-preview-empty-state.es6';
import svgContentStructureGraphEs6 from 'svg/content-structure-graph.es6';
import svgContentTabIllustrationEs6 from 'svg/content-tab-illustration.es6';
import svgDdArrowDownDisabledEs6 from 'svg/dd-arrow-down-disabled.es6';
import svgDdArrowDownEs6 from 'svg/dd-arrow-down.es6';
import svgDeleteEs6 from 'svg/delete.es6';
import svgDotnetEs6 from 'svg/dotnet.es6';
import svgDottedBorderEs6 from 'svg/dotted-border.es6';
import svgDownloadEs6 from 'svg/download.es6';
import svgDragHandle2Es6 from 'svg/drag-handle-2.es6';
import svgDragHandleEs6 from 'svg/drag-handle.es6';
import svgDropdownWidgetEs6 from 'svg/dropdown-widget.es6';
import svgEditEs6 from 'svg/edit.es6';
import svgEmptyContentModelEs6 from 'svg/empty-content-model.es6';
import svgEmptyContentEs6 from 'svg/empty-content.es6';
import svgEmptyMediaEs6 from 'svg/empty-media.es6';
import svgEmptyStateTeamsEs6 from 'svg/empty-state-teams.es6';
import svgEntriesEs6 from 'svg/entries.es6';
import svgEnvironmentEs6 from 'svg/environment.es6';
import svgErrorEs6 from 'svg/error.es6';
import svgFdHeadingsEs6 from 'svg/fd-headings.es6';
import svgFdInfoTextEs6 from 'svg/fd-info-text.es6';
import svgFieldBooleanSmallEs6 from 'svg/field-boolean-small.es6';
import svgFieldBooleanEs6 from 'svg/field-boolean.es6';
import svgFieldCalendarSmallEs6 from 'svg/field-calendar-small.es6';
import svgFieldCalendarEs6 from 'svg/field-calendar.es6';
import svgFieldDecimalSmallEs6 from 'svg/field-decimal-small.es6';
import svgFieldDecimalEs6 from 'svg/field-decimal.es6';
import svgFieldJsonSmallEs6 from 'svg/field-json-small.es6';
import svgFieldJsonEs6 from 'svg/field-json.es6';
import svgFieldLocationSmallEs6 from 'svg/field-location-small.es6';
import svgFieldLocationEs6 from 'svg/field-location.es6';
import svgFieldLongtextSmallEs6 from 'svg/field-longtext-small.es6';
import svgFieldLongtextEs6 from 'svg/field-longtext.es6';
import svgFieldMediaArraySmallEs6 from 'svg/field-media-array-small.es6';
import svgFieldMediaSmallEs6 from 'svg/field-media-small.es6';
import svgFieldMediaEs6 from 'svg/field-media.es6';
import svgFieldNumberSmallEs6 from 'svg/field-number-small.es6';
import svgFieldNumberEs6 from 'svg/field-number.es6';
import svgFieldReferenceSmallEs6 from 'svg/field-reference-small.es6';
import svgFieldReferenceEs6 from 'svg/field-reference.es6';
import svgFieldRichtextSmallEs6 from 'svg/field-richtext-small.es6';
import svgFieldRichtextEs6 from 'svg/field-richtext.es6';
import svgFieldShorttextArraySmallEs6 from 'svg/field-shorttext-array-small.es6';
import svgFieldShorttextSmallEs6 from 'svg/field-shorttext-small.es6';
import svgFieldShorttextEs6 from 'svg/field-shorttext.es6';
import svgFilterEs6 from 'svg/filter.es6';
import svgFlowerPenEs6 from 'svg/flower-pen.es6';
import svgFolderIllustrationEs6 from 'svg/folder-illustration.es6';
import svgFolderEs6 from 'svg/folder.es6';
import svgGitbookEs6 from 'svg/gitbook.es6';
import svgHamburgerEs6 from 'svg/hamburger.es6';
import svgHeaderIllustrationWideEs6 from 'svg/header-illustration-wide.es6';
import svgHintArrowEs6 from 'svg/hint-arrow.es6';
import svgHomeWelcomeEs6 from 'svg/home-welcome.es6';
import svgIconCartEs6 from 'svg/icon-cart.es6';
import svgIconCheckmarkDoneEs6 from 'svg/icon-checkmark-done.es6';
import svgIconFolderEs6 from 'svg/icon-folder.es6';
import svgIconGithubEs6 from 'svg/icon-github.es6';
import svgIconInfoEs6 from 'svg/icon-info.es6';
import svgIconOnboardingArrowEs6 from 'svg/icon-onboarding-arrow.es6';
import svgIconOnboardingContentfulReqResEs6 from 'svg/icon-onboarding-contentful-req-res.es6';
import svgIconOnboardingRelaunchEs6 from 'svg/icon-onboarding-relaunch.es6';
import svgIconPagesEs6 from 'svg/icon-pages.es6';
import svgIconThumbsDownEs6 from 'svg/icon-thumbs-down.es6';
import svgIconThumbsUpEs6 from 'svg/icon-thumbs-up.es6';
import svgIconUsersEs6 from 'svg/icon-users.es6';
import svgInfoEs6 from 'svg/info.es6';
import svgInfographicEs6 from 'svg/infographic.es6';
import svgInvitationNotFoundEs6 from 'svg/invitation-not-found.es6';
import svgInvoiceEs6 from 'svg/invoice.es6';
import svgJavascriptEs6 from 'svg/javascript.es6';
import svgJekyllEs6 from 'svg/jekyll.es6';
import svgLanguageAndroidEs6 from 'svg/language-android.es6';
import svgLanguageBrowserEs6 from 'svg/language-browser.es6';
import svgLanguageHttpEs6 from 'svg/language-http.es6';
import svgLanguageIosEs6 from 'svg/language-ios.es6';
import svgLanguageJsEs6 from 'svg/language-js.es6';
import svgLanguagePhpEs6 from 'svg/language-php.es6';
import svgLanguageRubyEs6 from 'svg/language-ruby.es6';
import svgLanguageObjcEs6 from 'svg/language_objc.es6';
import svgLinkEs6 from 'svg/link.es6';
import svgLockEs6 from 'svg/lock.es6';
import svgLogoAlgoliaEs6 from 'svg/logo-algolia.es6';
import svgLogoImageManagementEs6 from 'svg/logo-image-management.es6';
import svgLogoLabelEs6 from 'svg/logo-label.es6';
import svgLogoNetlifyEs6 from 'svg/logo-netlify.es6';
import svgMarkdownWidgetEs6 from 'svg/markdown-widget.es6';
import svgMarkdownEs6 from 'svg/markdown.es6';
import svgMediaEmptyStateEs6 from 'svg/media-empty-state.es6';
import svgMediaPreviewWidgetEs6 from 'svg/media-preview-widget.es6';
import svgMediaPreviewsWidgetEs6 from 'svg/media-previews-widget.es6';
import svgMediaReferenceWidgetEs6 from 'svg/media-reference-widget.es6';
import svgMediaReferencesWidgetEs6 from 'svg/media-references-widget.es6';
import svgMetalsmithEs6 from 'svg/metalsmith.es6';
import svgMultiplelineWidgetEs6 from 'svg/multipleline-widget.es6';
import svgNavApiEs6 from 'svg/nav-api.es6';
import svgNavAppsEs6 from 'svg/nav-apps.es6';
import svgNavCtEs6 from 'svg/nav-ct.es6';
import svgNavEntriesEs6 from 'svg/nav-entries.es6';
import svgNavHomeEs6 from 'svg/nav-home.es6';
import svgNavMediaEs6 from 'svg/nav-media.es6';
import svgNavOrganizationBillingEs6 from 'svg/nav-organization-billing.es6';
import svgNavOrganizationInformationEs6 from 'svg/nav-organization-information.es6';
import svgNavOrganizationSsoEs6 from 'svg/nav-organization-sso.es6';
import svgNavOrganizationSubscriptionEs6 from 'svg/nav-organization-subscription.es6';
import svgNavOrganizationTeamsEs6 from 'svg/nav-organization-teams.es6';
import svgNavOrganizationUsersEs6 from 'svg/nav-organization-users.es6';
import svgNavSettingsEs6 from 'svg/nav-settings.es6';
import svgNavSpacesEs6 from 'svg/nav-spaces.es6';
import svgNavUsageEs6 from 'svg/nav-usage.es6';
import svgNavUserApplicationsEs6 from 'svg/nav-user-applications.es6';
import svgNavUserOauthEs6 from 'svg/nav-user-oauth.es6';
import svgNavUserOrganizationsEs6 from 'svg/nav-user-organizations.es6';
import svgNavUserSettingsEs6 from 'svg/nav-user-settings.es6';
import svgNewCtEs6 from 'svg/new-ct.es6';
import svgNoteInfoEs6 from 'svg/note-info.es6';
import svgNoteSuccessEs6 from 'svg/note-success.es6';
import svgNoteWarningEs6 from 'svg/note-warning.es6';
import svgNumberWidgetEs6 from 'svg/number-widget.es6';
import svgOnboardingAddUserEs6 from 'svg/onboarding-add-user.es6';
import svgOnboardingLocalesEs6 from 'svg/onboarding-locales.es6';
import svgOnboardingSpaceEs6 from 'svg/onboarding-space.es6';
import svgOnboardingWebhooksEs6 from 'svg/onboarding-webhooks.es6';
import svgOrgSliderIllustrationEs6 from 'svg/org-slider-illustration.es6';
import svgPageApisEs6 from 'svg/page-apis.es6';
import svgPageAppsEs6 from 'svg/page-apps.es6';
import svgPageContentEs6 from 'svg/page-content.es6';
import svgPageCtEs6 from 'svg/page-ct.es6';
import svgPageEntriesEs6 from 'svg/page-entries.es6';
import svgPageMediaEs6 from 'svg/page-media.es6';
import svgPageSettingsEs6 from 'svg/page-settings.es6';
import svgPageSsoEs6 from 'svg/page-sso.es6';
import svgPageTeamsEs6 from 'svg/page-teams.es6';
import svgPageUsageEs6 from 'svg/page-usage.es6';
import svgPageUsersEs6 from 'svg/page-users.es6';
import svgPaywallPlanplusEs6 from 'svg/paywall-planplus.es6';
import svgPenIllustrationEs6 from 'svg/pen-illustration.es6';
import svgPhpEs6 from 'svg/php.es6';
import svgPlugEs6 from 'svg/plug.es6';
import svgPlus2Es6 from 'svg/plus-2.es6';
import svgPlusEs6 from 'svg/plus.es6';
import svgPreviewWidgetEs6 from 'svg/preview-widget.es6';
import svgPricingPlanTeamEditionEs6 from 'svg/pricing-plan-team_edition.es6';
import svgPythonEs6 from 'svg/python.es6';
import svgRadioWidgetEs6 from 'svg/radio-widget.es6';
import svgRatingWidgetEs6 from 'svg/rating-widget.es6';
import svgReadonlySpaceHomeIllEs6 from 'svg/readonly-space-home-ill.es6';
import svgReadonlySpaceIllEs6 from 'svg/readonly-space-ill.es6';
import svgReferenceCardWidgetEs6 from 'svg/reference-card-widget.es6';
import svgReferenceWidgetEs6 from 'svg/reference-widget.es6';
import svgReferencesCardWidgetEs6 from 'svg/references-card-widget.es6';
import svgReferencesWidgetEs6 from 'svg/references-widget.es6';
import svgRubyEs6 from 'svg/ruby.es6';
import svgScheduleCalendarEs6 from 'svg/schedule-calendar.es6';
import svgSearchEs6 from 'svg/search.es6';
import svgSettingsEs6 from 'svg/settings.es6';
import svgSidepanelSpacesAdviceEs6 from 'svg/sidepanel-spaces-advice.es6';
import svgSinglelineWidgetEs6 from 'svg/singleline-widget.es6';
import svgSlugWidgetEs6 from 'svg/slug-widget.es6';
import svgSpaceDiagramEs6 from 'svg/space-diagram.es6';
import svgSpaceHomeDocumentationIllEs6 from 'svg/space-home-documentation-ill.es6';
import svgSpaceEs6 from 'svg/space.es6';
import svgSpacetemplateBlogEs6 from 'svg/spacetemplate-blog.es6';
import svgSpacetemplateCatalogueEs6 from 'svg/spacetemplate-catalogue.es6';
import svgSpacetemplateGalleryEs6 from 'svg/spacetemplate-gallery.es6';
import svgSpacetemplateTeaEs6 from 'svg/spacetemplate-tea.es6';
import svgStarEs6 from 'svg/star.es6';
import svgSubscriptionEs6 from 'svg/subscription.es6';
import svgSwiftEs6 from 'svg/swift.es6';
import svgTagsWidgetEs6 from 'svg/tags-widget.es6';
import svgTextFieldsEs6 from 'svg/text-fields.es6';
import svgTranslationsIconEs6 from 'svg/translations-icon.es6';
import svgUnknownErrorIllustrationEs6 from 'svg/unknown-error-illustration.es6';
import svgVideoPreviewWidgetEs6 from 'svg/video-preview-widget.es6';
import svgWavyBackgroundEs6 from 'svg/wavy-background.es6';
import svgWysiwigWidgetEs6 from 'svg/wysiwig-widget.es6';

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
  plug: svgPlugEs6,
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
  star: svgStarEs6,
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
