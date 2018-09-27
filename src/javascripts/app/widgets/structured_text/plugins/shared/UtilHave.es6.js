export const haveMarks = ({ value }, type) => {
  return value.activeMarks.some(mark => mark.type === type);
};

export const haveBlocks = ({ value }, type) => {
  if (value.blocks.size > 0) {
    return value.blocks.some(node => node.type === type || node.type.indexOf(`${type}`) === 0);
  }

  return false;
};

export const haveInlines = ({ value }, type) => {
  if (value.inlines.size > 0) {
    return value.inlines.some(inline => inline.type === type);
  }

  return false;
};

export function haveAnyInlines({ value }) {
  return value.inlines.size > 0;
}

/**
 * Checks if all inline nodes in the selectin have a certain type.
 * Returns false if there are no inline nodes in the selection.
 *
 * @export
 * @param {slate.Change} Change
 * @param {string} type
 * @returns {boolean}
 */
export function haveEveryInlineOfType({ value }, type) {
  if (value.inlines.size > 0) {
    return value.inlines.every(inline => inline.type === type);
  }

  return false;
}

export const haveTextInSomeBlocks = ({ value }) => {
  if (value.blocks.size > 0) {
    return value.blocks.some(block => block.text);
  }
};
