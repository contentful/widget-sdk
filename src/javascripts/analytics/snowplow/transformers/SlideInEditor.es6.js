import { addUserOrgSpace } from './Decorators';

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/SlideInEditor
 * @description
 * Exports a function that transforms data for the slide-in editor
 */
export default addUserOrgSpace((eventName, data) => ({
  data: {
    action: extractAction(eventName),
    current_slide_level: data.currentSlideLevel,
    target_slide_level: data.targetSlideLevel,
    peek_hover_time_ms: data.peekHoverTimeMs || 0
  }
}));

function extractAction (eventName) {
  return eventName.split(':')[1];
}
