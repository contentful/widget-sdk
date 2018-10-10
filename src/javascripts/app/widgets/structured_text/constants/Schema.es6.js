import { mapValues, fromPairs } from 'lodash';
import { Schema } from 'slate';
import {
  BLOCKS,
  INLINES,
  TOP_LEVEL_BLOCKS,
  VOID_BLOCKS,
  CONTAINERS
} from '@contentful/structured-text-types';

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
    ...mapValues(CONTAINERS, (types, container) => ({
      nodes: [
        {
          types
        }
      ],
      normalize: (change, reason, context) => {
        switch (reason) {
          case 'child_type_invalid': {
            change.unwrapBlockByKey(context.node.key, container);
            return;
          }
        }
      }
    }))
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
