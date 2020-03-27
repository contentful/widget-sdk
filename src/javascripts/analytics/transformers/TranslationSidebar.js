import { addUserOrgSpace } from './Decorators';

const extractAction = (eventName) => eventName.split(':')[1];

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/TranslationSidebar
 * @description
 * Exports a function that transforms data for the translation sidebar events
 */
export default addUserOrgSpace((eventName, data) => ({
  data: {
    action: extractAction(eventName),
    current_mode: data.currentMode,
    previous_active_locale_count: data.previousActiveLocaleCount,
    current_active_locale_count: data.currentActiveLocaleCount,
  },
}));
