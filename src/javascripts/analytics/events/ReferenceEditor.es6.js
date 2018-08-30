import { track } from 'analytics/Analytics.es6';
import localeStore from 'TheLocaleStore';

export function onEntryCreate({
  contentType,
  isInlineEditingFeatureFlagEnabled = false,
  isInlineEditingEnabledForField = false
}) {
  track('reference_editor:create_entry', {
    ...getLocalesInfo(),
    ...getContentTypeInfo(contentType),
    ..._isInlineEditingFeatureFlagEnabled(isInlineEditingFeatureFlagEnabled),
    ..._isInlineEditingEnabledForField(isInlineEditingEnabledForField),
    version: 2
  });
}

export function onEntryEdit({ contentType, isInlineEditingFeatureFlagEnabled = false }) {
  track('reference_editor:edit_entry', {
    ...getLocalesInfo(),
    ...getContentTypeInfo(contentType),
    ..._isInlineEditingFeatureFlagEnabled(isInlineEditingFeatureFlagEnabled),
    version: 2
  });
}

/**
 * @param {object|null} .contentType
 * @param {boolean} .toggleState
 * @param {string} .selector
 * @returns {object}
 */
export function onToggleInlineEditor({ contentType, toggleState, selector }) {
  track('reference_editor:toggle_inline_editor', {
    ...getLocalesInfo(),
    ...getToggleState(toggleState),
    ...getContentTypeInfo(contentType),
    selector,
    version: 4
  });
}

function getToggleState(value) {
  return { toggle_state: value };
}

function _isInlineEditingFeatureFlagEnabled(value) {
  return { is_inline_editing_feature_flag_enabled: value };
}

function _isInlineEditingEnabledForField(value) {
  return { is_inline_editing_enabled_for_field: value };
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
