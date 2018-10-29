import { BLOCKS } from '@contentful/rich-text-types';

const getParent = change => {
  const range = change.value.selection;

  if (!range.startKey) {
    return null;
  }

  const startBlock = change.value.document.getClosestBlock(range.startKey);

  return change.value.document.getParent(startBlock.key);
};

export const isSelectionInQuote = change => {
  const ancestor = getParent(change);

  if (!ancestor) {
    return false;
  }

  return ancestor.type === BLOCKS.QUOTE;
};

/**
 * Toggles formatting between block quote and a plain paragraph.
 *
 * @param {slate.Change} change
 * @param {stirng} type
 * @returns {boolean} New toggle state after the change.
 */
export const applyChange = change => {
  const isActive = isSelectionInQuote(change);
  if (isActive) {
    change.unwrapBlock(BLOCKS.QUOTE);
  } else {
    change.setBlocks(BLOCKS.PARAGRAPH).wrapBlock(BLOCKS.QUOTE);
  }
  return !isActive;
};
