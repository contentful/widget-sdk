import { track } from 'analytics/Analytics.es6';
import localeStore from 'TheLocaleStore';

export function onEntryCreate({ contentType }) {
  track('reference_editor:create_entry', {
    ...getLocalesInfo(),
    ...getContentTypeInfo(contentType),
    version: 2
  });
}

export function onEntryEdit({ contentType }) {
  track('reference_editor:edit_entry', {
    ...getLocalesInfo(),
    ...getContentTypeInfo(contentType),
    version: 2
  });
}

function getLocalesInfo() {
  const locales = localeStore.getActiveLocales();
  return { locales_count: locales.length };
}

function getContentTypeInfo(contentType) {
  const locales = localeStore.getActiveLocales();
  const contentTypeInfo = getFieldsInfo(contentType);
  const widgetsCount = getWidgetsCount(contentTypeInfo, locales);

  return {
    localized_fields_count: contentTypeInfo.localizedFieldsCount,
    fields_count: contentTypeInfo.fieldsCount,
    widgets_count: widgetsCount
  };
}

function getWidgetsCount(contentTypeInfo, locales) {
  const { fieldsCount, localizedFieldsCount } = contentTypeInfo;
  const unlocalizedFieldsCount = fieldsCount - localizedFieldsCount;
  return (
    unlocalizedFieldsCount * Math.min(locales.length, 1) + localizedFieldsCount * locales.length
  );
}

function getFieldsInfo(contentType) {
  const fields = contentType ? contentType.data.fields : [];
  return {
    localizedFieldsCount: fields.filter(field => field.localized).length,
    fieldsCount: fields.length
  };
}
