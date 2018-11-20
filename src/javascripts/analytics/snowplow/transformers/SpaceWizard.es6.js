import { addUserOrgSpace } from './Decorators.es6';
import { env } from 'Config.es6';
import logger from 'logger';

const SpaceWizardTransformer = addUserOrgSpace((eventName, data) => {
  const action = eventName.split(':')[1];
  const wizardData = getSpaceWizardData(action, data);

  try {
    validateSpaceWizardData(wizardData);
  } catch (e) {
    // Always send error to Bugsnag
    logger.logException(e);

    // If not in prod or unittest environment, also throw
    if (env !== 'production' && env !== 'unittest') {
      throw e;
    }
  }

  return {
    data: wizardData
  };
});

export default SpaceWizardTransformer;

export function getSpaceWizardData(action, data) {
  return {
    // The current action the user is performing.
    //
    // See below in the validation function for enum
    action,

    // The intent of the user, e.g. creation or changing
    intended_action: data.intendedAction === 'change' ? 'change_space_type' : 'create',

    // The current space and product types
    current_space_type: data.currentSpaceType || null,
    current_product_type: data.currentProductType || null,

    target_space_type: data.targetSpaceType || null,
    target_product_type: data.targetProductType || null,

    recommended_space_type: data.recommendedSpaceType || null,
    recommended_product_type: data.recommendedProductType || null,

    // If payment details exist for the organization
    payment_details_exist:
      typeof data.paymentDetailsExist === 'boolean' ? data.paymentDetailsExist : null,

    // The current step, can be null, for example on `open` event
    current_step: data.currentStep || null,

    // The target step, filled during navigation
    target_step: data.targetStep || null,

    // The target (new) space name and template id
    target_space_name: data.targetSpaceName || null,
    target_space_template_id: data.targetSpaceTemplateId
  };
}

/*
  Validates the structure of the data given to Snowplow.

  Ensures that the required properties are present and of the right type.
 */
function validateSpaceWizardData(wizardData) {
  const requiredData = {
    intended_action: {
      type: 'string',
      enum: ['create', 'change_space_type']
    },
    current_step: {
      type: ['string', 'null'],
      maxLength: 32
    },
    action: {
      type: 'string',
      enum: [
        'open',
        'cancel',
        'confirm',
        'navigate',
        'link_click',
        'space_create',
        'space_type_change',
        'select_plan',
        'entered_details'
      ]
    }
  };

  const tests = {
    string: value => typeof value === 'string',
    null: value => value === null,
    boolean: value => typeof value === 'boolean'
  };

  function test(types, value) {
    return types.reduce((anyPass, type) => {
      return anyPass || tests[type](value);
    }, false);
  }

  for (const key of Object.keys(requiredData)) {
    // Guarantee that each key is present
    if (wizardData[key] === undefined) {
      throw new Error(`Missing required key ${key}`);
    }

    const value = wizardData[key];
    const property = requiredData[key];

    // Type is either a string of a single type, or an array of multiple types
    let types = property.type;

    // Force types to be an array
    if (!Array.isArray(types)) {
      types = [types];
    }

    // Validate that the types are correct
    if (!test(types, value)) {
      throw new Error(`Type of value ${value} for key ${key} not one of ${types.join(',')}`);
    }

    // Validate value against enum if present
    if (property.enum) {
      if (!property.enum.find(value => value)) {
        throw new Error(`Value ${value} for key ${key} not in enum ${property.enum.join(',')}`);
      }
    }

    // Validate value is not over maxLength
    if (property.maxLength && value && value.length > property.maxLength) {
      throw new Error(`Value ${value} for key ${key} exceeds maxLength of ${property.maxLength}`);
    }
  }

  return true;
}
