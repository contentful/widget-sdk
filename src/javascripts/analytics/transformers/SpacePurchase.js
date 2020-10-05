import { addUserOrgSpace } from './Decorators';
import { pick } from 'lodash';
import * as logger from 'services/logger';

const EVENTS = {
  BEGIN: 'begin',
  NAVIGATE: 'navigate',
  SPACE_PLAN_SELECTED: 'space_plan_selected',
  SPACE_TEMPLATE_SELECTED: 'space_template_selected',
  SPACE_DETAILS_ENTERED: 'space_details_entered',
  BILLING_DETAILS_ENTERED: 'billing_details_entered',
  PAYMENT_DETAILS_ENTERED: 'payment_details_entered',
  PAYMENT_METHOD_CREATED: 'payment_method_created',
  CONFIRM_PURCHASE: 'confirm_purchase',
  SPACE_CREATED: 'space_created',
  SPACE_TEMPLATE_CREATED: 'space_template_created',
  ERROR: 'error',
};

const transformers = {
  [EVENTS.BEGIN]: beginTransformer,
  [EVENTS.NAVIGATE]: navigateTransformer,
  [EVENTS.SPACE_PLAN_SELECTED]: spacePlanSelectedTransformer,
  [EVENTS.SPACE_TEMPLATE_SELECTED]: spaceTemplateSelectedTransformer,
  [EVENTS.SPACE_DETAILS_ENTERED]: emptyTransformer,
  [EVENTS.BILLING_DETAILS_ENTERED]: emptyTransformer,
  [EVENTS.PAYMENT_DETAILS_ENTERED]: emptyTransformer,
  [EVENTS.PAYMENT_METHOD_CREATED]: emptyTransformer,
  [EVENTS.CONFIRM_PURCHASE]: emptyTransformer,
  [EVENTS.SPACE_CREATED]: spaceCreatedTransformer,
  [EVENTS.SPACE_TEMPLATE_CREATED]: spaceTemplateCreatedTransformer,
  [EVENTS.ERROR]: errorTransformer,
};

export default addUserOrgSpace((eventName, data) => {
  const [, action] = eventName.split(':');

  // The data must always have a sessionId
  if (!data.sessionId) {
    logger.logError('Session ID missing in space purchase event');
    return;
  }

  if (!transformers[action]) {
    logger.logError(`SpacePurchase transformer for ${action} not found`);
    return;
  }

  return {
    action,
    sessionId: data.sessionId,
    ...transformers[action](data),
  };
});

function emptyTransformer() {
  return {};
}

function beginTransformer(data) {
  return pick(data, ['userOrganizationRole', 'organizationPlatform', 'canCreateFreeSpace']);
}

function navigateTransformer(data) {
  return pick(data, ['fromStep', 'toStep']);
}

function spacePlanSelectedTransformer(data) {
  return pick(data, ['selectedPlan']);
}

function spaceTemplateSelectedTransformer(data) {
  return pick(data, 'selectedTemplate');
}

function spaceCreatedTransformer(data) {
  return pick(data, ['selectedPlan']);
}

function spaceTemplateCreatedTransformer(data) {
  return pick(data, ['selectedTemplate']);
}

function errorTransformer(data) {
  return pick(data, ['location', 'error']);
}
