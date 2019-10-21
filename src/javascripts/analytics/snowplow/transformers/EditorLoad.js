import { addUserOrgSpace } from './Decorators';

const extractAction = eventName => eventName.split(':')[1];

/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/EditorLoad
 * @description
 * Exports a function that transforms data for the editor load events
 */
export default addUserOrgSpace((eventName, data) => ({
  data: {
    action: extractAction(eventName),
    slides_controller_uuid: data.slidesControllerUuid,
    slide_uuid: data.slideUuid,
    slide_level: data.slideLevel,
    link_count: data.linkCount,
    rich_text_editor_instance_count: data.richTextEditorInstanceCount,
    link_field_editor_instance_count: data.linkFieldEditorInstanceCount,
    total_slide_count: data.totalSlideCount,
    load_ms: data.loadMs
  }
}));
