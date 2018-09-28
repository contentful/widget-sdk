import { BLOCKS } from '@contentful/structured-text-types';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';

const createNode = id => ({
  type: BLOCKS.EMBEDDED_ENTRY,
  object: 'block',
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

const insertBlock = (change, entryId) => {
  const linkedEntryBlock = createNode(entryId);
  if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
    change.insertBlock(linkedEntryBlock);
  } else {
    change.setBlocks(linkedEntryBlock);
  }
  change.insertBlock(BLOCKS.PARAGRAPH).focus();
};

export const hasBlockOfType = (change, type) => {
  const blocks = change.value.blocks;

  return blocks.get(0).type === type;
};

/**
 * Invokes entry selection modal and inserts block.
 *
 * @param {WidgetAPI} widgetAPI
 * @param {slate.Change} change
 */
export const selectEntryAndInsert = async (widgetAPI, change) => {
  try {
    const [entry] = await widgetAPI.dialogs.selectSingleEntry();
    if (!entry) {
      return;
    }

    insertBlock(change, entry.sys.id);
  } catch (error) {
    if (error) {
      throw error;
    } else {
      // the user closes modal without selecting an entry
    }
  }
};
