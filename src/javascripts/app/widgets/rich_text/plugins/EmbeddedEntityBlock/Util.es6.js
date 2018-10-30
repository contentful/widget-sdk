import { BLOCKS } from '@contentful/rich-text-types';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';
import { newConfigFromRichTextField } from 'search/EntitySelector/Config.es6';
import getLinkedContentTypeIdsForNodeType from '../shared/GetLinkedContentTypeIdsForNodeType.es6';

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
 * Invokes entity selector modal and inserts block embed.
 * @param {string} nodeType
 * @param {WidgetAPI} widgetAPI
 * @param {slate.Change} change
 * @param {function} logAction
 */
export async function selectEntityAndInsert(nodeType, widgetAPI, change, logAction) {
  const baseConfig = await newConfigFromRichTextField(widgetAPI.field, nodeType);
  const linkedContentTypeIds = getLinkedContentTypeIdsForNodeType(
    widgetAPI.field,
    BLOCKS.EMBEDDED_ENTRY
  );
  const config = {
    ...baseConfig,
    linkedContentTypeIds,
    max: 1,
    withCreate: true
  };
  logAction(`openCreateEmbedDialog`, { nodeType });
  try {
    // widgetAPI.dialogs.selectSingleEntry() or selectSingleAsset()
    const [entity] = await widgetAPI.dialogs.selectEntities(config);
    if (!entity) {
      return;
    }
    insertBlock(change, nodeType, entity);
    logAction('insert', { nodeType });
  } catch (error) {
    if (error) {
      throw error;
    } else {
      logAction(`cancelCreateEmbedDialog`, { nodeType });
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
