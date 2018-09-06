import { BLOCKS } from '@contentful/structured-text-types';

const getCommonAncestor = change => {
  const range = change.value.selection;

  if (!range.startKey) {
    return null;
  }

  const startBlock = change.value.document.getClosestBlock(range.startKey);
  const endBlock = change.value.document.getClosestBlock(range.endKey);

  return change.value.document.getCommonAncestor(startBlock.key, endBlock.key);
};

export const isSelectionInQuote = change => {
  const ancestor = getCommonAncestor(change);

  if (!ancestor) {
    return false;
  }

  return ancestor.type === BLOCKS.QUOTE;
};

export const applyChange = change => {
  const isActive = isSelectionInQuote(change);
  if (isActive) {
    return change.unwrapBlock(BLOCKS.QUOTE);
  }

  return change.setBlocks(BLOCKS.PARAGRAPH).wrapBlock(BLOCKS.QUOTE);
};
