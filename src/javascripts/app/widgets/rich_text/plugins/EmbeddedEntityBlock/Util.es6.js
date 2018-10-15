import { BLOCKS } from '@contentful/rich-text-types';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';
import { newConfigFromRichTextField } from 'search/EntitySelector/Config.es6';

/**
 * Returns whether given value has a block of the given type.
 * @param {slate.Change} change
 * @param {string} type
 * @returns {boolean}
 */
export const hasBlockOfType = (change, type) => {
  const blocks = change.value.blocks;
  return blocks.get(0).type === type;
};

/**
 * Invokes entity selector modal and inserts block.
 * @param {String} nodeType
 * @param {WidgetAPI} widgetAPI
 * @param {slate.Change} change
 */
export async function selectEntityAndInsert(nodeType, widgetAPI, change) {
  const baseConfig = await newConfigFromRichTextField(widgetAPI.field, nodeType);
  const config = {
    ...baseConfig,
    max: 1
  };
  try {
    // widgetAPI.dialogs.selectSingleEntry() or selectSingleAsset()
    const [entity] = await widgetAPI.dialogs.selectEntities(config);
    if (!entity) {
      return;
    }
    insertBlock(change, nodeType, entity);
  } catch (error) {
    if (error) {
      throw error;
    } else {
      // the user closes modal without selecting an entry
    }
  }
}

const createNode = (nodeType, entity) => ({
  type: nodeType,
  object: 'block',
  isVoid: true,
  data: {
    target: {
      sys: {
        id: entity.sys.id,
        type: 'Link',
        linkType: entity.sys.type
      }
    }
  }
});

function insertBlock(change, nodeType, entity) {
  const linkedEntityBlock = createNode(nodeType, entity);
  if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
    change.insertBlock(linkedEntityBlock);
  } else {
    change.setBlocks(linkedEntityBlock);
  }
  change.insertBlock(BLOCKS.PARAGRAPH).focus();
}
