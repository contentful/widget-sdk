import { track } from 'analytics/Analytics';
import localeStore from 'TheLocaleStore';

export function onEntryCreate ({ contentType }) {
  track('reference_editor:create_entry', getPayload({ contentType }));
}

export function onEntryEdit ({ contentType }) {
  track('reference_editor:edit_entry', getPayload({ contentType }));
}

function getPayload ({ contentType }) {
  const locales = localeStore.getActiveLocales();
  const contentTypeInfo = getContentTypeInfo(contentType);
  const widgetsCount = getWidgetsCount(contentTypeInfo, locales);

  return {
    locales_count: locales.length,
    localized_fields_count: contentTypeInfo.localizedFieldsCount,
    fields_count: contentTypeInfo.fieldsCount,
    widgets_count: widgetsCount
  };
}

function getWidgetsCount (contentTypeInfo, locales) {
  const { fieldsCount, localizedFieldsCount } = contentTypeInfo;

  return (
    fieldsCount - localizedFieldsCount + localizedFieldsCount * locales.length
  );
}

function getContentTypeInfo (contentType) {
  const fields = contentType.data.fields;
  return {
    localizedFieldsCount: fields.filter(field => field.localized).length,
    fieldsCount: fields.length
  };
}
