import { BLOCKS } from '@contentful/structured-text-types';
import { haveTextInSomeBlocks } from '../shared/UtilHave.es6';
import { newConfigFromStructuredTextField } from 'search/EntitySelector/Config.es6';

/**
 * Returns the `nodeType` depending on the given entity type.
 * @param {string} type
 * @returns {string}
 */
export function getNodeType(type) {
  // EMBEDDED_ENTRY or EMBEDDED_ASSET
  return BLOCKS[`EMBEDDED_${type.toUpperCase()}`];
}

const createNode = entity => ({
  type: getNodeType(entity.sys.type),
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

const insertBlock = (change, entity) => {
  const linkedEntityBlock = createNode(entity);
  if (change.value.blocks.size === 0 || haveTextInSomeBlocks(change)) {
    change.insertBlock(linkedEntityBlock);
  } else {
    change.setBlocks(linkedEntityBlock);
  }
  change.insertBlock(BLOCKS.PARAGRAPH).focus();
};

export const hasBlockOfType = (change, type) => {
  const blocks = change.value.blocks;

  return blocks.get(0).type === type;
};

/**
 * Invokes entity selector modal and inserts block.
 *
 * @param {String} type
 * @param {WidgetAPI} widgetAPI
 * @param {slate.Change} change
 */
export const selectEntityAndInsert = async (type, widgetAPI, change) => {
  const nodeType = getNodeType(type);
  const baseConfig = await newConfigFromStructuredTextField(widgetAPI.field, nodeType);
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
    insertBlock(change, entity);
  } catch (error) {
    if (error) {
      throw error;
    } else {
      // the user closes modal without selecting an entry
    }
  }
};
