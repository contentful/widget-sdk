import * as K from 'core/utils/kefir';
import { track } from 'analytics/Analytics';
import { isEqual, keys, once, sum, sumBy, values, findIndex } from 'lodash';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import * as random from 'utils/Random';
import TheLocaleStore from 'services/localeStore';

const LOAD_EVENT_CATEGORY = 'editor_load';

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
    const { fields: fieldTypes } = editorData.contentType.data;
    const { fields } = editorData.entity.data;
    const enabledFieldTypes = fieldTypes.filter((field) => !field.disabled);
    const richTextFieldTypes = enabledFieldTypes.filter(isRichTextField);
    const singleReferenceFieldTypes = enabledFieldTypes.filter(isSingleReferenceField);
    const multiReferenceFieldTypes = enabledFieldTypes.filter(isMultiReferenceField);
    const richTextEditorInstanceCount = getRenderableLinkFieldInstanceCount(richTextFieldTypes);
    const singleLinkFieldEditorInstanceCount = getRenderableLinkFieldInstanceCount(
      singleReferenceFieldTypes
    );
    const multiLinkFieldEditorInstanceCount = getRenderableLinkFieldInstanceCount(
      multiReferenceFieldTypes
    );
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
      linkCount,
      richTextEditorInstanceCount,
      linkFieldEditorInstanceCount,
    };
  });

  return function trackEditorLoadEvent(eventName) {
    const slideStates = getSlideStates();
    const totalSlideCount = keys(slideStates).length;
    const slideLevel = findIndex(slideStates, (state) => isEqual(state.slide, slide));
    const baseData = { slidesControllerUuid, slideUuid, totalSlideCount, slideLevel };
    if (eventName === 'init') {
      return track(`${LOAD_EVENT_CATEGORY}:init`, { ...baseData, loadMs: 0 });
    }
    const detailData = getDetailEventData(slideStates);
    track(`${LOAD_EVENT_CATEGORY}:${eventName}`, {
      ...baseData,
      ...detailData,
      loadMs: new Date().getTime() - loadStartMs,
    });
  };
}

export function bootstrapEntryEditorLoadEvents($scope, loadEvents, editorData, trackLoadEvent) {
  let loadLinksRendered = false;
  let loadShareJSConnected = false;

  const linkFieldTypes = editorData.contentType.data.fields.filter(isLinkField);
  const renderableLinkFieldInstanceCount = getRenderableLinkFieldInstanceCount(linkFieldTypes);

  K.onValueScope($scope, $scope.otDoc.state.isConnected$, (status) => {
    if (loadShareJSConnected || status === false) {
      return;
    }
    const connectedEvent = $scope.otDoc.isOtDocument ? 'sharejs_connected' : 'doc_connected';
    trackLoadEvent(connectedEvent);

    loadShareJSConnected = true;
    if (loadLinksRendered) {
      trackLoadEvent('fully_interactive');
    }
  });

  let fieldsInteractiveCount = 0;
  const trackLinksRenderedEvent = once(() => {
    trackLoadEvent('links_rendered');
    loadLinksRendered = true;
    if (loadShareJSConnected) {
      trackLoadEvent('fully_interactive');
    }
  });

  if (renderableLinkFieldInstanceCount === 0) {
    trackLinksRenderedEvent();
  }

  loadEvents.stream.onValue(({ actionName }) => {
    if (actionName !== 'linksRendered') {
      return;
    }
    fieldsInteractiveCount++;
    if (fieldsInteractiveCount === renderableLinkFieldInstanceCount) {
      trackLinksRenderedEvent();
    }
  });
}

export function getRenderableLinkFieldInstanceCount(fieldTypes) {
  const localizedFieldCount = fieldTypes.filter((f) => f.localized).length;
  const nonLocalizedFieldCount = fieldTypes.length - localizedFieldCount;
  const activeLocaleCount = TheLocaleStore.getActiveLocales().length;
  return localizedFieldCount * activeLocaleCount + nonLocalizedFieldCount;
}

export function createLinksRenderedEvent(loadEvents) {
  return once(() => {
    if (loadEvents) {
      loadEvents.emit({ actionName: 'linksRendered' });
    }
  });
}

export function createWidgetLinkRenderEventsHandler({
  widget,
  locale,
  loadEvents,
  editorData,
  trackLinksRendered,
}) {
  return function handleWidgetLinkRenderEvents() {
    const { field } = widget;
    let getLinkCountForField;
    if (isRichTextField(field)) {
      getLinkCountForField = getRichTextLinkCount;
    } else if (isSingleReferenceField(field) || isMultiReferenceField(field)) {
      getLinkCountForField = getLinkFieldLinkCount;
      // TODO: Remove once we get rid of legacy Angular link field editors:
      handleAngularReferenceFieldEditor(loadEvents, trackLinksRendered);
    } else {
      trackLinksRendered();
      return;
    }
    handleField({
      widget,
      locale,
      loadEvents,
      editorData,
      trackLinksRendered,
      getLinkCountForField,
    });
  };
}

function handleField({
  widget,
  locale,
  loadEvents,
  editorData,
  trackLinksRendered,
  getLinkCountForField,
}) {
  // TODO: We shouldn't have to deal with `editorData` but a simple entity in here.
  const fieldId = widget.fieldId;
  const internalFieldId = widget.field.id;
  const localeFieldOrNull = getLocaleFieldOrNull(editorData, internalFieldId, locale);
  const linkCount = localeFieldOrNull ? getLinkCountForField(localeFieldOrNull) : 0;
  if (linkCount === 0) {
    trackLinksRendered();
    return;
  }

  let linksRenderedCount = 0;
  loadEvents.stream.onValue(handleAction);

  function handleAction({ actionName, ...data }) {
    if (
      linksRenderedCount < linkCount &&
      actionName === 'linkRendered' &&
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

function handleAngularReferenceFieldEditor(loadEvents, trackLinksRendered) {
  if (loadEvents) {
    loadEvents.stream.onValue(({ actionName }) => {
      if (actionName === 'referenceLinksRendered') {
        trackLinksRendered();
      }
    });
  }
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

function getLocaleFieldOrNull(editorData, fieldId, locale) {
  const { fields } = editorData.entity.data;
  const field = fields[fieldId];
  if (!field) {
    return null;
  }
  return field[locale.internal_code] || null;
}
