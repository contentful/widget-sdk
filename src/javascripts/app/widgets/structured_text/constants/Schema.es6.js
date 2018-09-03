import { BLOCKS, INLINES } from '@contentful/structured-text-types';

const TEXT = { object: ['text'] };

const toTypeObj = type => ({ type });

const TOP_LEVEL_BLOCKS = [
  BLOCKS.PARAGRAPH,
  BLOCKS.HEADING_1,
  BLOCKS.HEADING_2,
  BLOCKS.HEADING_3,
  BLOCKS.HEADING_4,
  BLOCKS.HEADING_5,
  BLOCKS.HEADING_6,
  BLOCKS.UL_LIST,
  BLOCKS.OL_LIST,
  BLOCKS.HR,
  BLOCKS.EMBEDDED_ENTRY
];

export default {
  document: {
    nodes: [
      {
        match: TOP_LEVEL_BLOCKS.map(type => toTypeObj(type))
      }
    ]
  },
  blocks: {
    [BLOCKS.PARAGRAPH]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.HEADING_1]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.HEADING_2]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.HEADING_3]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.HEADING_4]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.HEADING_5]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.HEADING_6]: {
      nodes: [{ match: TEXT }]
    },
    [BLOCKS.UL_LIST]: {
      nodes: [{ match: { type: BLOCKS.LIST_ITEM } }]
    },
    [BLOCKS.OL_LIST]: {
      nodes: [{ match: { type: BLOCKS.LIST_ITEM } }]
    },
    [BLOCKS.LIST_ITEM]: {
      nodes: [{ match: [TEXT, ...TOP_LEVEL_BLOCKS] }]
    },
    [BLOCKS.HR]: {
      isVoid: true
    },
    [BLOCKS.EMBEDDED_ENTRY]: {
      isVoid: true
    },
    [BLOCKS.QUOTE]: {
      nodes: [{ match: TEXT }]
    }
  },
  inlines: {
    [INLINES.HYPERLINK]: {
      nodes: [{ match: TEXT }]
    }
  }
};
