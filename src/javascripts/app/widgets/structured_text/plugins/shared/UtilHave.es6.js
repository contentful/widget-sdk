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

export const haveTextInSomeBlocks = ({ value }) => {
  if (value.blocks.size > 0) {
    return value.blocks.some(block => block.text);
  }
};
