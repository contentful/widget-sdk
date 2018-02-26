import { track } from 'analytics/Analytics';
import localeStore from 'TheLocaleStore';

export function onEntryCreate ({ contentType, isInlineEditingEnabled }) {
  track('reference_editor:create_entry', {
    ...getLocalesInfo(),
    ...getContentTypeInfo(contentType),
    ...isFeatureEnabled(isInlineEditingEnabled)
  });
}

export function onEntryEdit ({ contentType }) {
  track('reference_editor:edit_entry', {
    ...getLocalesInfo(),
    ...getContentTypeInfo(contentType)
  });
}

export function onToggleInlineEditor ({ toggleState }) {
  track('reference_editor:toggle_inline_editor', {
    ...getLocalesInfo(),
    ...getToggleState(toggleState)
  });
}

function getToggleState (value) {
  return { toggle_state: value };
}

function isFeatureEnabled (value) {
  return { inline_editing_toggled_on: value };
}

function getLocalesInfo () {
  const locales = localeStore.getActiveLocales();
  return { locales_count: locales.length };
}

function getContentTypeInfo (contentType) {
  const locales = localeStore.getActiveLocales();
  const contentTypeInfo = getFieldsInfo(contentType);
  const widgetsCount = getWidgetsCount(contentTypeInfo, locales);

  return {
    localized_fields_count: contentTypeInfo.localizedFieldsCount,
    fields_count: contentTypeInfo.fieldsCount,
    widgets_count: widgetsCount
  };
}

function getWidgetsCount (contentTypeInfo, locales) {
  const { fieldsCount, localizedFieldsCount } = contentTypeInfo;
  const unlocalizedFieldsCount = fieldsCount - localizedFieldsCount;
  return (
    unlocalizedFieldsCount * Math.min(locales.length, 1) +
    localizedFieldsCount * locales.length
  );
}

function getFieldsInfo (contentType) {
  const fields = contentType.data.fields;
  return {
    localizedFieldsCount: fields.filter(field => field.localized).length,
    fieldsCount: fields.length
  };
}
