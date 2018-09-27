import { INLINES } from '@contentful/structured-text-types';

const createInlineNode = id => ({
  type: INLINES.EMBEDDED_ENTRY,
  object: 'inline',
  isVoid: true,
  data: {
    target: {
      sys: {
        id,
        type: 'Link',
        linkType: 'Entry'
      }
    }
  }
});

const insertInline = (change, entryId) => {
  return change
    .splitInline()
    .insertInline(createInlineNode(entryId))
    .moveToStartOfNextText()
    .focus();
};

export const hasOnlyInlineEntryInSelection = change => {
  const inlines = change.value.inlines;
  const selection = change.value.selection;
  if (inlines.size === 1 && selection.startKey === selection.endKey) {
    return inlines.get(0).type === INLINES.EMBEDDED_ENTRY;
  }
};

export const selectEntryAndInsert = async (widgetAPI, change) => {
  try {
    const [entry] = await widgetAPI.dialogs.selectSingleEntry();
    if (!entry) {
      return;
    }

    return insertInline(change, entry.sys.id);
  } catch (error) {
    // the user closes modal without selecting an entry
  }
};
