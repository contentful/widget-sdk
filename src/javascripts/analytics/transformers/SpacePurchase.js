import { addUserOrgSpace } from './Decorators';
import { pick } from 'lodash';
import { captureError } from 'core/monitoring';

const EVENTS = {
  BEGIN: 'begin',
  NAVIGATE: 'navigate',
  SPACE_PLAN_SELECTED: 'space_plan_selected',
  PLATFORM_SELECTED: 'platform_selected',
  SPACE_TEMPLATE_SELECTED: 'space_template_selected',
  SPACE_DETAILS_ENTERED: 'space_details_entered',
  BILLING_DETAILS_ENTERED: 'billing_details_entered',
  EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  INTERNAL_LINK_CLICKED: 'internal_link_clicked',
  FAQ_SECTION_OPEN: 'faq_section_open',
  PAYMENT_DETAILS_ENTERED: 'payment_details_entered',
  PAYMENT_METHOD_CREATED: 'payment_method_created',
  CONFIRM_PURCHASE: 'confirm_purchase',
  RENAME_SPACE_CLICKED: 'rename_space_clicked',
  SPACE_CREATED: 'space_created',
  PERFORMANCE_PACKAGE_PURCHASED: 'performance_package_purchased',
  SPACE_TYPE_CHANGE: 'space_type_change',
  SPACE_TEMPLATE_CREATED: 'space_template_created',
  ERROR: 'error',
  CANCEL: 'cancel',
};

const transformers = {
  [EVENTS.BEGIN]: beginTransformer,
  [EVENTS.CANCEL]: cancelTransformer,
  [EVENTS.NAVIGATE]: navigateTransformer,
  [EVENTS.SPACE_PLAN_SELECTED]: spacePlanSelectedTransformer,
  [EVENTS.PLATFORM_SELECTED]: platformSelectedTransformer,
  [EVENTS.SPACE_TEMPLATE_SELECTED]: spaceTemplateSelectedTransformer,
  [EVENTS.EXTERNAL_LINK_CLICKED]: externalLinkClickedTransformer,
  [EVENTS.INTERNAL_LINK_CLICKED]: internalLinkClickedTransformer,
  [EVENTS.FAQ_SECTION_OPEN]: faqSectionOpenTransformer,
  [EVENTS.SPACE_DETAILS_ENTERED]: emptyTransformer,
  [EVENTS.BILLING_DETAILS_ENTERED]: emptyTransformer,
  [EVENTS.PAYMENT_DETAILS_ENTERED]: emptyTransformer,
  [EVENTS.PAYMENT_METHOD_CREATED]: emptyTransformer,
  [EVENTS.CONFIRM_PURCHASE]: emptyTransformer,
  [EVENTS.RENAME_SPACE_CLICKED]: emptyTransformer,
  [EVENTS.SPACE_CREATED]: spaceCreatedTransformer,
  [EVENTS.PERFORMANCE_PACKAGE_PURCHASED]: platformCreatedTransformer,
  [EVENTS.SPACE_TYPE_CHANGE]: spaceUpgradeTransformer,
  [EVENTS.SPACE_TEMPLATE_CREATED]: spaceTemplateCreatedTransformer,
  [EVENTS.ERROR]: errorTransformer,
};

export default addUserOrgSpace((eventName, data) => {
  const [, action] = eventName.split(':');

  // The data must always have a sessionId
  if (!data.sessionId) {
    captureError(new Error('Session ID missing in space purchase event'));
    return;
  }

  if (!transformers[action]) {
    captureError(new Error(`SpacePurchase transformer for ${action} not found`));
    return;
  }

  return {
    data: {
      action,
      sessionId: data.sessionId,
      ...transformers[action](data),
    },
  };
});

function emptyTransformer() {
  return {};
}

function beginTransformer(data) {
  // TODO: Use snake_case keys!
  return pick(data, [
    'userOrganizationRole',
    'organizationPlatform',
    'canCreateFreeSpace',
    'sessionType',
    'currentSpacePlan',
    // The location/details of where the user came from an in-app CTA
    'from',
    // Do we want to log trial state here? (before/during/after?)
    'canPurchaseApps',
    'performancePackagePreselected',
  ]);
}
function cancelTransformer(data) {
  return pick(data, ['currentStep']);
}

function navigateTransformer(data) {
  return pick(data, ['fromStep', 'toStep']);
}

function spacePlanSelectedTransformer(data) {
  return pick(data, ['selectedPlan']);
}

function platformSelectedTransformer(data) {
  return pick(data, ['selectedPlatform']);
}

function externalLinkClickedTransformer(data) {
  return pick(data, ['href', 'intent']);
}

function internalLinkClickedTransformer(data) {
  return pick(data, ['state', 'intent']);
}
function faqSectionOpenTransformer(data) {
  return pick(data, ['question']);
}

function spaceTemplateSelectedTransformer(data) {
  return pick(data, 'selectedTemplate');
}

function spaceCreatedTransformer(data) {
  return pick(data, ['selectedPlan']);
}

// Log selected plan to determine which how many Team users choose a new space vs. no space
function platformCreatedTransformer(data) {
  return pick(data, ['selectedPlan']);
}

function spaceUpgradeTransformer(data) {
  return pick(data, ['selectedPlan']);
}

function spaceTemplateCreatedTransformer(data) {
  return pick(data, ['selectedTemplate']);
}

function errorTransformer(data) {
  return pick(data, ['errorType', 'error']);
}
