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

  const stEventData = omit(eventData.structuredTextEditor, ['fields', 'locales']);
  const createStructuredTextContextEvent = (field, locale) =>
    addUserOrgSpace(() => ({
      schema: getSchema('feature_text_editor').path,
      data: {
        action: 'contentPreview',
        editor_name: 'StructuredText',
        field_locale: locale.internal_code,
        field_id: field.id,
        is_fullscreen: false,
        ...toSnakeCase(stEventData)
      }
    }))(_, eventData);

  if (eventData.structuredTextEditor) {
    const { fields, locales } = eventData.structuredTextEditor;
    const activeLocales = Array.isArray(locales) ? locales : locales.active;
    const defaultLocale = find(activeLocales, 'default');

    for (const field of fields) {
      if (field.localized) {
        for (const locale of activeLocales) {
          contexts.push(createStructuredTextContextEvent(field, locale));
        }
      } else {
        contexts.push(createStructuredTextContextEvent(field, defaultLocale));
      }
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
