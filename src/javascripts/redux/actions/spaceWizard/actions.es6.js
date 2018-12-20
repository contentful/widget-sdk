export const SPACE_PLANS_PENDING = 'SPACE_WIZARD/SPACE_PLANS_PENDING';
export function spacePlansPending(isPending) {
  return {
    type: SPACE_PLANS_PENDING,
    isPending
  };
}

export const SPACE_PLANS_FAILURE = 'SPACE_WIZARD/SPACE_PLANS_FAILURE';
export function spacePlansFailure(error) {
  return {
    type: SPACE_PLANS_FAILURE,
    error
  };
}

export const SPACE_PLANS_SUCCESS = 'SPACE_WIZARD/SPACE_PLANS_SUCCESS';
export function spacePlansSuccess(spaceRatePlans, freeSpacesResource) {
  return {
    type: SPACE_PLANS_SUCCESS,
    spaceRatePlans,
    freeSpacesResource
  };
}

export const SPACE_TEMPLATES_PENDING = 'SPACE_WIZARD/SPACE_TEMPLATES_PENDING';
export function spaceTemplatesPending(isPending) {
  return {
    type: SPACE_TEMPLATES_PENDING,
    isPending
  };
}

export const SPACE_TEMPLATES_FAILURE = 'SPACE_WIZARD/SPACE_TEMPLATES_FAILURE';
export function spaceTemplatesFailure(error) {
  return {
    type: SPACE_TEMPLATES_FAILURE,
    error
  };
}

export const SPACE_TEMPLATES_SUCCESS = 'SPACE_WIZARD/SPACE_TEMPLATES_SUCCESS';
export function spaceTemplatesSuccess(templatesList) {
  return {
    type: SPACE_TEMPLATES_SUCCESS,
    templatesList
  };
}

export const SPACE_CREATION_PENDING = 'SPACE_WIZARD/SPACE_CREATION_PENDING';
export function spaceCreationPending(isPending) {
  return {
    type: SPACE_CREATION_PENDING,
    isPending
  };
}

export const SPACE_CREATION_FAILURE = 'SPACE_WIZARD/SPACE_CREATION_FAILIRE';
export function spaceCreationFailure(error) {
  return {
    type: SPACE_CREATION_FAILURE,
    error
  };
}

export const SPACE_CREATION_SUCCESS = 'SPACE_WIZARD/SPACE_CREATION_SUCCESS';
export function spaceCreationSuccess() {
  return {
    type: SPACE_CREATION_SUCCESS
  };
}

export const SPACE_CREATION_TEMPLATE = 'SPACE_WIZARD/SPACE_CREATION_TEMPLATE';
export function spaceCreationTemplate(isPending) {
  return {
    type: SPACE_CREATION_TEMPLATE,
    isPending
  };
}

export const SPACE_CHANGE_PENDING = 'SPACE_WIZARD/SPACE_CHANGE_PENDING';
export function spaceChangePending(isPending) {
  return {
    type: SPACE_CHANGE_PENDING,
    isPending
  };
}

export const SPACE_CHANGE_FAILURE = 'SPACE_WIZARD/SPACE_CHANGE_FAILURE';
export function spaceChangeFailure(error) {
  return {
    type: SPACE_CHANGE_FAILURE,
    error
  };
}

export const SUBSCRIPTION_PRICE_PENDING = 'SPACE_WIZARD/SUBSCRIPTION_PRICE_PENDING';
export function subscriptionPricePending(isPending) {
  return {
    type: SUBSCRIPTION_PRICE_PENDING,
    isPending
  };
}

export const SUBSCRIPTION_PRICE_FAILURE = 'SPACE_WIZARD/SUBSCRIPTION_PRICE_FAILURE';
export function subscriptionPriceFailure(error) {
  return {
    type: SUBSCRIPTION_PRICE_FAILURE,
    error
  };
}

export const SUBSCRIPTION_PRICE_SUCCESS = 'SPACE_WIZARD/SUBSCRIPTION_PRICE_SUCCESS';
export function subscriptionPriceSuccess(totalPrice) {
  return {
    type: SUBSCRIPTION_PRICE_SUCCESS,
    totalPrice
  };
}

export const SPACE_WIZARD_TRACK = 'SPACE_WIZARD/TRACK';
export function spaceWizardTrack(eventName, trackingData) {
  return {
    type: SPACE_WIZARD_TRACK,
    eventName,
    trackingData
  };
}

export const SPACE_WIZARD_NAVIGATE = 'SPACE_WIZARD/NAVIGATE';
export function spaceWizardNavigate(stepId) {
  return {
    type: SPACE_WIZARD_NAVIGATE,
    stepId
  };
}

export const NEW_SPACE_NAME = 'SPACE_WIZARD/NEW_SPACE_NAME';
export function newSpaceName(name) {
  return {
    type: NEW_SPACE_NAME,
    name
  };
}

export const NEW_SPACE_TEMPLATE = 'SPACE_WIZARD/NEW_SPACE_TEMPLATE';
export function newSpaceTemplate(template) {
  return {
    type: NEW_SPACE_TEMPLATE,
    template
  };
}

export const SPACE_PLAN_SELECTED = 'SPACE_WIZARD/SPACE_PLAN_SELECTED';
export function spacePlanSelected(currentPlan, selectedPlan) {
  return {
    type: SPACE_PLAN_SELECTED,
    currentPlan,
    selectedPlan
  };
}

export const SPACE_WIZARD_RESET = 'SPACE_WIZARD/RESET';
export function spaceWizardReset() {
  return {
    type: SPACE_WIZARD_RESET
  };
}

export const SPACE_PARTNERSHIP = 'SPACE_WIZARD/PARTNERSHIP';
export function spacePartnership(isPartnerSpacePlan) {
  return {
    type: SPACE_PARTNERSHIP,
    isPartnerSpacePlan
  };
}

export const SPACE_PARTNERSHIP_FIELDS = 'SPACE_WIZARD/PARTNERSHIP_FIELDS';
export function spacePartnershipFields(fields) {
  return {
    type: SPACE_PARTNERSHIP_FIELDS,
    fields
  };
}

export const SPACE_PARTNERSHIP_EMAIL_PENDING = 'SPACE_WIZARD/PARTNERSHIP_EMAIL_PENDING';
export function spacePartnershipEmailPending(isPending) {
  return {
    type: SPACE_PARTNERSHIP_EMAIL_PENDING,
    isPending
  };
}

export const SPACE_PARTNERSHIP_EMAIL_FAILURE = 'SPACE_WIZARD/PARTNERSHIP_EMAIL_FAILURE';
export function spacePartnershipEmailFailure(error) {
  return {
    type: SPACE_PARTNERSHIP_EMAIL_FAILURE,
    error
  };
}
