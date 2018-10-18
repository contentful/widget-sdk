import { INLINES } from '@contentful/rich-text-types';
import { haveAnyInlines, haveEveryInlineOfType, haveInlines } from '../shared/UtilHave.es6';
import { newConfigFromRichTextField } from 'search/EntitySelector/Config.es6';
import getLinkedContentTypeIdsForNodeType from '../shared/GetLinkedContentTypeIdsForNodeType.es6';

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
  const baseConfig = await newConfigFromRichTextField(widgetAPI.field, INLINES.EMBEDDED_ENTRY);
  const linkedContentTypeIds = getLinkedContentTypeIdsForNodeType(
    widgetAPI.field,
    INLINES.EMBEDDED_ENTRY
  );
  const config = {
    ...baseConfig,
    linkedContentTypeIds,
    max: 1
  };
  try {
    const [entry] = await widgetAPI.dialogs.selectEntities(config);
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
