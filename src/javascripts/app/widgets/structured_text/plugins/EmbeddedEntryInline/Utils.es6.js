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

const applyChange = (change, entryId) => {
  return change
    .insertInline(createInlineNode(entryId))
    .moveToStartOfNextText()
    .focus();
};

export const hasOnlyInlineEntryInSelection = change => {
  if (change.value.inlines.size === 1) {
    return change.value.inlines.get(0).type === INLINES.EMBEDDED_ENTRY;
  }
};

export const selectEntryAndApply = async (widgetAPI, change) => {
  try {
    const [entry] = await widgetAPI.dialogs.selectSingleEntry();
    if (!entry) {
      return;
    }

    return applyChange(change, entry.sys.id);
  } catch (error) {
    // the user closes modal without selecting an entry
  }
};
