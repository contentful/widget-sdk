import { flow, mapKeys, snakeCase, isEmpty, omit, omitBy, find } from 'lodash';
import { addUserOrgSpace } from './Decorators.es6';
import { getSchema } from 'analytics/snowplow/Schemas.es6';

const toSnakeCase = data => mapKeys(data, (_v, k) => snakeCase(k));

const toDataObject = flow(
  data => omitBy(data, isEmpty),
  toSnakeCase
);

// TODO: Update our snowplow integration to support contexts in a cleaner
// and more abstracted manner. Basically, move em out from the transformers
// into something more top level since it's common duplicated behaviour
export default function(_, eventData) {
  const contexts = [];
  const { data } = addUserOrgSpace((_, { elementId, groupId, fromState, toState }) => ({
    data: toDataObject({
      elementId, // required
      groupId, // required
      fromState, // required
      toState // optional
    })
  }))(_, eventData);

  const rtEventData = toSnakeCase(omit(eventData.richTextEditor, ['fields', 'locales']));
  const createRichTextContextEvent = (field, locales) =>
    addUserOrgSpace(() => ({
      schema: getSchema('feature_text_editor').path,
      data: {
        editor_name: 'RichText',
        field_locale: null,
        field_id: field.id,
        is_fullscreen: false,
        ...rtEventData,
        additional_data: {
          ...toSnakeCase(rtEventData.additional_data),
          active_locales: locales.map(locale => locale.internal_code)
        }
      }
    }))(_, eventData);

  if (eventData.richTextEditor) {
    const { fields, locales } = eventData.richTextEditor;
    const activeLocales = Array.isArray(locales) ? locales : locales.active;
    const defaultLocale = find(activeLocales, 'default');

    for (const field of fields) {
      const locales = field.localized ? activeLocales : [defaultLocale];
      contexts.push(createRichTextContextEvent(field, locales));
    }
  }

  if (eventData.contentPreview) {
    contexts.push(
      addUserOrgSpace((_, data) => {
        const {
          contentPreview: { previewName, previewId, contentTypeName, contentTypeId }
        } = data;

        return {
          schema: getSchema('content_preview').path,
          data: toDataObject({ previewName, previewId, contentTypeName, contentTypeId })
        };
      })(_, eventData)
    );
  }

  return {
    data,
    contexts
  };
}
