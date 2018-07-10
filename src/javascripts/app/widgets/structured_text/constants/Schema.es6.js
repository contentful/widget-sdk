import * as Block from './Blocks';

export default {
  document: {
    nodes: [
      {
        types: [
          Block.PARAGRAPH,
          Block.HEADING_1,
          Block.HEADING_2,
          Block.ENTRY_LINK
        ]
      }
    ]
  },
  blocks: {
    [Block.PARAGRAPH]: {
      nodes: [{ objects: ['text'] }]
    },
    [Block.HEADING_1]: {
      nodes: [{ objects: ['text'] }]
    },
    [Block.HEADING_2]: {
      nodes: [{ objects: ['text'] }]
    },
    [Block.ENTRY_LINK]: {
      isVoid: true
    }
  }
};
