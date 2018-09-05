import { BLOCKS } from '@contentful/structured-text-types';
import { haveBlocks } from '../shared/UtilHave.es6';

export const applyChange = (change, type) => {
  const isActive = haveBlocks(change, type);
  if (isActive) {
    return change.setBlocks(BLOCKS.PARAGRAPH);
  }

  return change.setBlocks(BLOCKS.PARAGRAPH).wrapBlock(BLOCKS.QUOTE);
};
