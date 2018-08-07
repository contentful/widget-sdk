import { BLOCKS } from '@contentful/structured-text-types';

export default {
  document: {
    nodes: [
      {
        types: [
          BLOCKS.PARAGRAPH,
          BLOCKS.HEADING_1,
          BLOCKS.HEADING_2,
          BLOCKS.EMBEDDED_ENTRY
        ]
      }
    ]
  },
  blocks: {
    [BLOCKS.PARAGRAPH]: {
      nodes: [{ objects: ['text'] }]
    },
    [BLOCKS.HEADING_1]: {
      nodes: [{ objects: ['text'] }]
    },
    [BLOCKS.HEADING_2]: {
      nodes: [{ objects: ['text'] }]
    },
    [BLOCKS.EMBEDDED_ENTRY]: {
      isVoid: true
    }
  }
};
