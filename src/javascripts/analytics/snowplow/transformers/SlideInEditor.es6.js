import { addUserOrgSpace } from './Decorators.es6';

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
    peek_hover_time_ms: data.peekHoverTimeMs || 0,
    editor_type: data.editorType,
    slide_uuid: data.slideUuid,
    number_of_links: data.numberOfLinks,
    number_of_rich_text_editors: data.numberOfRichTextEditors,
    number_of_reference_field_editors: data.numberOfReferenceFieldEditors,
    number_of_total_slides: data.numberOfTotalSlides,
    load_ms: data.loadMs
  }
}));

function extractAction(eventName) {
  return eventName.split(':')[1];
}
