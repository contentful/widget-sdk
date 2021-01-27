import * as Analytics from 'analytics/Analytics';

export const EVENTS = {
  // Meta Events
  BEGIN: 'begin',
  CANCEL: 'cancel',
  NAVIGATE: 'navigate',
  // User Events
  SPACE_PLAN_SELECTED: 'space_plan_selected',
  PLATFORM_SELECTED: 'platform_selected',
  SPACE_TEMPLATE_SELECTED: 'space_template_selected',
  SPACE_DETAILS_ENTERED: 'space_details_entered',
  BILLING_DETAILS_ENTERED: 'billing_details_entered',
  PAYMENT_DETAILS_ENTERED: 'payment_details_entered',
  ENTERED_DETAILS: 'entered_details',
  CONFIRM_PURCHASE: 'confirm_purchase',
  FAQ_SECTION_OPEN: 'faq_section_open',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  INTERNAL_LINK_CLICKED: 'internal_link_clicked',
  RENAME_SPACE_CLICKED: 'rename_space_clicked',
  // API Events
  PAYMENT_METHOD_CREATED: 'payment_method_created',
  SPACE_CREATED: 'space_created',
  PERFORMANCE_PACKAGE_PURCHASED: 'performance_package_purchased',
  SPACE_TEMPLATE_CREATED: 'space_template_created',
  SPACE_TYPE_CHANGE: 'space_type_change',
  ERROR: 'error',
};

export function trackEvent(eventName, sessionMetadata, eventMetadata = {}) {
  const trackingData = createTrackingData(sessionMetadata, eventMetadata);

  Analytics.track(`space_purchase:${eventName}`, trackingData);
}

function createTrackingData(sessionMetadata, eventMetadata) {
  const trackingData = {
    // Required
    sessionId: sessionMetadata.sessionId,
    organizationId: sessionMetadata.organizationId,
    // Required for space upgrade flow
    spaceId: sessionMetadata.spaceId ?? null,
    // Optional
    ...eventMetadata,
  };

  return trackingData;
}
