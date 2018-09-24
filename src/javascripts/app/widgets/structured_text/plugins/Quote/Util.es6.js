import { BLOCKS } from '@contentful/structured-text-types';

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

export const applyChange = change => {
  const isActive = isSelectionInQuote(change);
  if (isActive) {
    return change.unwrapBlock(BLOCKS.QUOTE);
  }

  return change.setBlocks(BLOCKS.PARAGRAPH).wrapBlock(BLOCKS.QUOTE);
};
