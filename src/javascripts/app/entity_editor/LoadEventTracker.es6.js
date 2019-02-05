import { track } from 'analytics/Analytics.es6';
import { once, sum, sumBy, values } from 'lodash';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import * as random from 'utils/Random.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

export function createLoadEventTracker(slideStates, editorData) {
  const { fields: fieldTypes } = editorData.contentType.data;
  const { fields } = editorData.entity.data;
  const richTextFieldTypes = fieldTypes.filter(isRichTextField);
  const singleReferenceFieldTypes = fieldTypes.filter(isSingleReferenceField);
  const multiReferenceFieldTypes = fieldTypes.filter(isMultiReferenceField);
  const numberOfRichTextEditors = getNumRenderableFieldEditors(richTextFieldTypes);
  const numberOfSingleReferenceFieldEditors = getNumRenderableFieldEditors(
    singleReferenceFieldTypes
  );
  const numberOfMultiReferenceFieldEditors = getNumRenderableFieldEditors(multiReferenceFieldTypes);
  const numberOfReferenceFieldEditors =
    numberOfSingleReferenceFieldEditors + numberOfMultiReferenceFieldEditors;

  const sumMatchingFieldsBy = (fieldTypes, predicate) =>
    sum(fieldTypes.map(fieldType => sumBy(values(fields[fieldType.id]), predicate)));
  const numberOfSingleReferenceFieldLinks = sumMatchingFieldsBy(singleReferenceFieldTypes, field =>
    field ? 1 : 0
  );
  const numberOfMultiReferenceFieldLinks = sumMatchingFieldsBy(multiReferenceFieldTypes, 'length');
  const numberOfRichTextFieldLinks = sumMatchingFieldsBy(richTextFieldTypes, field =>
    sumBy(values(getRichTextEntityLinks(field)), 'length')
  );
  const numberOfLinks =
    numberOfSingleReferenceFieldLinks +
    numberOfMultiReferenceFieldLinks +
    numberOfRichTextFieldLinks;

  const slideUuid = random.id();
  const loadStart = new Date().getTime();
  return eventName =>
    track(`slide_in_editor:load_${eventName}`, {
      slideUuid,
      slideLevel: slideStates.length - 1,
      numberOfLinks,
      numberOfRichTextEditors,
      numberOfReferenceFieldEditors,
      loadMs: eventName === 'init' ? 0 : new Date().getTime() - loadStart
    });
}

export function getNumRenderableFieldEditors(fieldTypes) {
  const numLocalizedFields = fieldTypes.filter(f => f.localized).length;
  const numNonLocalizedFields = fieldTypes.length - numLocalizedFields;
  const numActiveLocales = TheLocaleStore.getActiveLocales().length;
  return numLocalizedFields * numActiveLocales + numNonLocalizedFields;
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

  const numLinks = getNumRichTextLinks(editorData, fieldIdFromEntry, fieldLocaleCode);
  if (numLinks === 0) {
    trackLinksRendered();
    return;
  }

  // TODO: "Set" is undefined, since we have no polyfill for it yet.
  // eslint-disable-next-line no-undef
  const linksRendered = new Set();

  loadEvents.stream.onValue(({ actionName, ...data }) => {
    if (
      linksRendered.size === numLinks ||
      actionName !== 'linkRendered' ||
      data.field.id !== fieldIdFromCT ||
      data.field.locale !== localeCode
    ) {
      return;
    }
    linksRendered.add(data.key);
    if (linksRendered.size === numLinks) {
      trackLinksRendered();
    }
  });
}

function getNumRichTextLinks(editorData, fieldIdFromEntry, fieldLocaleCode) {
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
  loadEvents.stream.onValue(({ actionName }) => {
    if (actionName === 'referenceLinksRendered') {
      trackLinksRendered();
    }
  });
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
