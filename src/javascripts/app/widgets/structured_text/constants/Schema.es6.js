import { fromPairs } from 'lodash';
import { Schema } from 'slate';
import {
  BLOCKS,
  INLINES,
  TOP_LEVEL_BLOCKS,
  VOID_BLOCKS,
  CONTAINERS
} from '@contentful/rich-text-types';

const mapVoidTypes = nodeTypes => {
  return fromPairs(nodeTypes.map(nodeType => [nodeType, { isVoid: true }]));
};

export default Schema.fromJSON({
  document: {
    nodes: [
      {
        types: TOP_LEVEL_BLOCKS
      }
    ]
  },
  blocks: {
    [BLOCKS.PARAGRAPH]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    [BLOCKS.HEADING_1]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    [BLOCKS.HEADING_2]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    [BLOCKS.HEADING_3]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    [BLOCKS.HEADING_4]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    [BLOCKS.HEADING_5]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    [BLOCKS.HEADING_6]: {
      nodes: [
        {
          types: Object.values(INLINES)
        },
        {
          objects: ['text', 'inline']
        }
      ]
    },
    ...mapVoidTypes(VOID_BLOCKS),
    // the schema for the lists and list-items is defined in the slate-edit-list plugin
    [BLOCKS.QUOTE]: {
      nodes: [
        {
          types: CONTAINERS[BLOCKS.QUOTE]
        }
      ],
      normalize: (change, reason, context) => {
        switch (reason) {
          case 'child_type_invalid': {
            change.unwrapBlockByKey(context.node.key, BLOCKS.QUOTE);
            return;
          }
        }
      }
    }
  },
  inlines: {
    [INLINES.HYPERLINK]: {
      nodes: [
        {
          objects: ['text']
        }
      ]
    },
    [INLINES.ENTRY_HYPERLINK]: {
      nodes: [
        {
          objects: ['text']
        }
      ]
    },
    [INLINES.ASSET_HYPERLINK]: {
      nodes: [
        {
          objects: ['text']
        }
      ]
    },
    [INLINES.EMBEDDED_ENTRY]: {
      isVoid: true
    }
  }
});
