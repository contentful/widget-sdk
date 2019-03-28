import { addUserOrgSpace } from './Decorators.es6';

const extractAction = eventName => eventName.split(':')[1];

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/TranslationSidebar
 * @description
 * Exports a function that transforms data for the translation sidebar events
 */
export default addUserOrgSpace((eventName, data) => ({
  data: {
    action: extractAction(eventName),
    current_mode: data.currentMode
  }
}));
