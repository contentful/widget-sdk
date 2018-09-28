import { INLINES } from '@contentful/structured-text-types';
import { haveAnyInlines, haveEveryInlineOfType, haveInlines } from '../shared/UtilHave.es6';

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
  if (haveInlines(change, INLINES.EMBEDDED_ENTRY)) {
    change.setInline(createInlineNode(entryId));
  } else {
    change.insertInline(createInlineNode(entryId));
  }

  return change.moveToStartOfNextText().focus();
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

    insertInline(change, entry.sys.id);
  } catch (error) {
    if (error) {
      throw error;
    } else {
      // the user closes modal without selecting an entry
    }
  }
};

export const canInsertInline = change => {
  return !haveAnyInlines(change) || haveEveryInlineOfType(change, INLINES.EMBEDDED_ENTRY);
};
