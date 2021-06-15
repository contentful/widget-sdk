import * as K from 'core/utils/kefir';
import * as Analytics from 'analytics/Analytics';
import { isEqual, keys, once, sum, sumBy, values, findIndex } from 'lodash';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import * as random from 'utils/Random';
import TheLocaleStore from 'services/localeStore';

export function createLoadEventTracker({
  loadStartMs,
  getSlideStates,
  getEditorData,
  slide,
  slidesControllerUuid,
}) {
  const slideUuid = random.id();

  const getDetailEventData = once(() => {
    const editorData = getEditorData();
    const { fields: fieldTypes } = editorData.contentType;
    const { fields } = editorData.entity.data;
    const enabledFieldTypes = fieldTypes.filter((field) => !field.disabled);
    const richTextFieldTypes = enabledFieldTypes.filter(isRichTextField);
    const singleReferenceFieldTypes = enabledFieldTypes.filter(isSingleReferenceField);
    const multiReferenceFieldTypes = enabledFieldTypes.filter(isMultiReferenceField);
    const richTextEditorInstanceCount = getRenderableLinkFieldInstanceCount(richTextFieldTypes);
    const singleLinkFieldEditorInstanceCount =
      getRenderableLinkFieldInstanceCount(singleReferenceFieldTypes);
    const multiLinkFieldEditorInstanceCount =
      getRenderableLinkFieldInstanceCount(multiReferenceFieldTypes);
    const linkFieldEditorInstanceCount =
      singleLinkFieldEditorInstanceCount + multiLinkFieldEditorInstanceCount;

    const sumMatchingFieldsBy = (fieldTypes, predicate) =>
      sum(fieldTypes.map((fieldType) => sumBy(values(fields[fieldType.id]), predicate)));
    const singleReferenceFieldLinkCount = sumMatchingFieldsBy(singleReferenceFieldTypes, (field) =>
      field ? 1 : 0
    );
    const multiReferenceFieldLinkCount = sumMatchingFieldsBy(multiReferenceFieldTypes, 'length');
    const richTextFieldLinkCount = sumMatchingFieldsBy(richTextFieldTypes, (field) =>
      sumBy(values(getRichTextEntityLinks(field)), 'length')
    );
    const linkCount =
      singleReferenceFieldLinkCount + multiReferenceFieldLinkCount + richTextFieldLinkCount;

    return {
      link_count: linkCount,
      rich_text_editor_instance_count: richTextEditorInstanceCount,
      link_field_editor_instance_count: linkFieldEditorInstanceCount,
    };
  });

  return function trackEditorLoadEvent(eventName) {
    const slideStates = getSlideStates();
    const totalSlideCount = keys(slideStates).length;
    const slideLevel = findIndex(slideStates, (state) => isEqual(state.slide, slide));
    const baseData = {
      ...Analytics.defaultEventProps(),
      slides_controller_uuid: slidesControllerUuid,
      slide_uuid: slideUuid,
      total_slide_count: totalSlideCount,
      slide_level: slideLevel,
    };
    if (eventName === 'init') {
      Analytics.tracking.editorLoaded({
        action: 'init',
        load_ms: 0,
        ...baseData,
      });
    } else {
      const detailData = getDetailEventData(slideStates);
      Analytics.tracking.editorLoaded({
        action: eventName,
        load_ms: new Date().getTime() - loadStartMs,
        ...baseData,
        ...detailData,
      });
    }
  };
}

// TODO: Consider a class instead of passing around `loadEvents` to ensure this method is called before
//  the fields report, otherwise the info gets lost and the event is never tracked.
export function bootstrapEntryEditorLoadEvents(otDoc, loadEvents, editorData, trackLoadEvent) {
  let loadLinksRendered = false;
  let docConnected = false;

  const linkFieldTypes = editorData.contentType.fields.filter(isLinkField);
  const renderableLinkFieldInstanceCount = getRenderableLinkFieldInstanceCount(linkFieldTypes);

  K.onValue(otDoc.state.isConnected$, (status) => {
    if (docConnected || status === false) {
      return;
    }
    trackLoadEvent('doc_connected');

    docConnected = true;
    if (loadLinksRendered) {
      trackLoadEvent('fully_interactive');
    }
  });

  let fieldsInteractiveCount = 0;
  const trackLinksRenderedEvent = once(() => {
    trackLoadEvent('links_rendered');
    loadLinksRendered = true;
    if (docConnected) {
      trackLoadEvent('fully_interactive');
    }
  });

  if (renderableLinkFieldInstanceCount === 0) {
    trackLinksRenderedEvent();
  }

  loadEvents.stream.onValue(({ actionName }) => {
    if (actionName !== 'allFieldLinksRendered') {
      return;
    }
    // TODO: Instead of a counter, introduce a map with field locale IDs. A simple counter is more prone to bugs.
    fieldsInteractiveCount++;
    if (fieldsInteractiveCount === renderableLinkFieldInstanceCount) {
      trackLinksRenderedEvent();
    }
  });
}

export function getRenderableLinkFieldInstanceCount(fieldTypes) {
  const localizedFieldCount = fieldTypes.filter((f) => f.localized).length;
  const nonLocalizedFieldCount = fieldTypes.length - localizedFieldCount;
  // TODO: Make this work for single locale mode! TheLocaleStore.getActiveLocales() returns multiple locales
  //  if the multi-locale mode was previously active with multiple locales. To support single locale mode we'll also
  //  have to take into account that the default locale fields might not be visible at all.
  const activeLocaleCount = TheLocaleStore.getActiveLocales().length;
  return localizedFieldCount * activeLocaleCount + nonLocalizedFieldCount;
}

export function createLinksRenderedEvent(loadEvents) {
  return once(() => {
    if (loadEvents) {
      loadEvents.emit({ actionName: 'allFieldLinksRendered' });
    }
  });
}

export function createWidgetLinkRenderEventsHandler({
  widget,
  locale,
  loadEvents,
  getValue,
  trackLinksRendered,
}) {
  return function handleWidgetLinkRenderEvents() {
    const { field } = widget;

    if (!isLinkField(field)) {
      return;
    }

    let getLinkCountForField;
    if (isRichTextField(field)) {
      getLinkCountForField = getRichTextLinkCount;
    } else if (isSingleReferenceField(field) || isMultiReferenceField(field)) {
      getLinkCountForField = getLinkFieldLinkCount;
    } else {
      throw new Error('Unknown link field type');
    }
    handleField({
      widget,
      locale,
      loadEvents,
      getValue,
      trackLinksRendered,
      getLinkCountForField,
    });
  };
}

function handleField({
  widget,
  locale,
  loadEvents,
  getValue,
  trackLinksRendered,
  getLinkCountForField,
}) {
  const fieldId = widget.fieldId;
  const localeFieldValueOrNull = getValue() || null;
  const linkCount = localeFieldValueOrNull ? getLinkCountForField(localeFieldValueOrNull) : 0;
  if (linkCount === 0) {
    trackLinksRendered();
    return;
  }

  let linksRenderedCount = 0;
  loadEvents.stream.onValue(handleAction);

  function handleAction({ actionName, ...data }) {
    if (
      actionName === 'linkRendered' &&
      linksRenderedCount < linkCount &&
      data.field.id === fieldId &&
      data.field.locale === locale.code
    ) {
      linksRenderedCount++;
      if (linksRenderedCount === linkCount) {
        loadEvents.stream.offValue(handleAction);
        trackLinksRendered();
      }
    }
  }
}

function getRichTextLinkCount(localeField) {
  const { Entry, Asset } = getRichTextEntityLinks(localeField);
  return Entry.length + Asset.length;
}

function getLinkFieldLinkCount(localeField) {
  return Array.isArray(localeField) ? localeField.length : Number(!!localeField);
}

function isRichTextField(field) {
  return field.type === 'RichText';
}

function isSingleReferenceField(field) {
  return field.type === 'Link';
}

function isMultiReferenceField(field) {
  return field.type === 'Array' && field.items.type === 'Link';
}

function isLinkField(field) {
  return isRichTextField(field) || isSingleReferenceField(field) || isMultiReferenceField(field);
}
