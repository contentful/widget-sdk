import * as K from 'utils/kefir.es6';
import { track } from 'analytics/Analytics.es6';
import { keys, once, sum, sumBy, values, findIndex } from 'lodash';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import * as random from 'utils/Random.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

const LOAD_EVENT_CATEGORY = 'editor_load';

export function createLoadEventTracker(loadStartMs, getSlideStates, getEditorData) {
  const slideUuid = random.id();

  return function trackEditorLoadEvent(eventName) {
    const slideStates = getSlideStates();
    const totalSlideCount = keys(slideStates).length;
    if (eventName === 'init') {
      return track(`${LOAD_EVENT_CATEGORY}:init`, { slideUuid, totalSlideCount });
    }
    const editorData = getEditorData();
    const { fields: fieldTypes } = editorData.contentType.data;
    const { fields } = editorData.entity.data;
    const entityId = editorData.entity.getId();
    const richTextFieldTypes = fieldTypes.filter(isRichTextField);
    const singleReferenceFieldTypes = fieldTypes.filter(isSingleReferenceField);
    const multiReferenceFieldTypes = fieldTypes.filter(isMultiReferenceField);
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
      sum(fieldTypes.map(fieldType => sumBy(values(fields[fieldType.id]), predicate)));
    const singleReferenceFieldLinkCount = sumMatchingFieldsBy(singleReferenceFieldTypes, field =>
      field ? 1 : 0
    );
    const multiReferenceFieldLinkCount = sumMatchingFieldsBy(multiReferenceFieldTypes, 'length');
    const richTextFieldLinkCount = sumMatchingFieldsBy(richTextFieldTypes, field =>
      sumBy(values(getRichTextEntityLinks(field)), 'length')
    );
    const linkCount =
      singleReferenceFieldLinkCount + multiReferenceFieldLinkCount + richTextFieldLinkCount;
    track(`${LOAD_EVENT_CATEGORY}:${eventName}`, {
      slideUuid,
      slideLevel: findIndex(slideStates, state => state.slide.id === entityId),
      linkCount,
      richTextEditorInstanceCount,
      linkFieldEditorInstanceCount,
      totalSlideCount,
      loadMs: new Date().getTime() - loadStartMs
    });
  };
}

export function bootstrapEntryEditorLoadEvents($scope, loadEvents, editorData, trackLoadEvent) {
  let loadLinksRendered = false;
  let loadShareJSConnected = false;

  const linkFieldTypes = editorData.contentType.data.fields.filter(isLinkField);
  const renderableLinkFieldInstanceCount = getRenderableLinkFieldInstanceCount(linkFieldTypes);

  K.onValueScope($scope, $scope.otDoc.state.isConnected$, status => {
    if (loadShareJSConnected || status === false) {
      return;
    }
    trackLoadEvent('sharejs_connected');

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
  const localizedFieldCount = fieldTypes.filter(f => f.localized).length;
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
  trackLinksRendered
}) {
  return function handleWidgetLinkRenderEvents() {
    const { field } = widget;
    if (isRichTextField(field)) {
      handleRichTextField({ widget, locale, loadEvents, editorData, trackLinksRendered });
    } else if (isSingleReferenceField(field) || isMultiReferenceField(field)) {
      handleReferenceField(loadEvents, trackLinksRendered);
    } else {
      trackLinksRendered();
    }
  };
}

function handleRichTextField({ widget, locale, loadEvents, editorData, trackLinksRendered }) {
  const {
    fieldId: fieldIdFromCT,
    field: { id: fieldIdFromEntry }
  } = widget;

  const { code: localeCode, internal_code: fieldLocaleCode } = locale;

  const linkCount = getRichTextLinkCount(editorData, fieldIdFromEntry, fieldLocaleCode);
  if (linkCount === 0) {
    trackLinksRendered();
    return;
  }

  // TODO: "Set" is undefined, since we have no polyfill for it yet.
  // eslint-disable-next-line no-undef
  const linksRendered = new Set();

  loadEvents.stream.onValue(({ actionName, ...data }) => {
    if (
      linksRendered.size === linkCount ||
      actionName !== 'linkRendered' ||
      data.field.id !== fieldIdFromCT ||
      data.field.locale !== localeCode
    ) {
      return;
    }
    linksRendered.add(data.key);
    if (linksRendered.size === linkCount) {
      trackLinksRendered();
    }
  });
}

function getRichTextLinkCount(editorData, fieldIdFromEntry, fieldLocaleCode) {
  const { fields } = editorData.entity.data;
  const field = fields[fieldIdFromEntry];
  if (!field) {
    // no entity data for the field yet
    return 0;
  }
  const localeField = field[fieldLocaleCode];
  if (!localeField) {
    // no entity data for this specific field
    return 0;
  }
  const { Entry, Asset } = getRichTextEntityLinks(localeField);
  return Entry.length + Asset.length;
}

function handleReferenceField(loadEvents, trackLinksRendered) {
  if (loadEvents) {
    loadEvents.stream.onValue(({ actionName }) => {
      if (actionName === 'referenceLinksRendered') {
        trackLinksRendered();
      }
    });
  }
}

export function isRichTextField(field) {
  return field.type === 'RichText';
}

export function isSingleReferenceField(field) {
  return field.type === 'Link';
}

export function isMultiReferenceField(field) {
  return field.type === 'Array' && field.items.type === 'Link';
}

export function isLinkField(field) {
  return isRichTextField(field) || isSingleReferenceField(field) || isMultiReferenceField(field);
}
