import { mapValues, fromPairs } from 'lodash';
import {
  BLOCKS,
  INLINES,
  TOP_LEVEL_BLOCKS,
  VOID_BLOCKS,
  CONTAINERS
} from '@contentful/structured-text-types';

const slateTypeConstraint = type => ({ match: { type } });
const TEXT_CONSTRAINT = { object: ['text'] };
const VOID_CONSTRAINT = { isVoid: true };
const INLINE_CONSTRAINTS = Object.values(INLINES).map(slateTypeConstraint);

const nodeTypeConstraint = whiteListedNodeTypes => {
  return {
    nodes: whiteListedNodeTypes.map(slateTypeConstraint)
  };
};

const mapContainers = containers => {
  return mapValues(containers, nodeTypeConstraint);
};

const mapVoidTypes = nodeTypes => {
  return fromPairs(nodeTypes.map(nodeType => [nodeType, VOID_CONSTRAINT]));
};

export default {
  document: nodeTypeConstraint(TOP_LEVEL_BLOCKS),
  blocks: {
    [BLOCKS.PARAGRAPH]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_1]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_2]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_3]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_4]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_5]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_6]: {
      nodes: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    ...mapVoidTypes(VOID_BLOCKS),
    ...mapContainers(CONTAINERS)
  },
  inlines: {
    [INLINES.HYPERLINK]: {
      nodes: [TEXT_CONSTRAINT]
    },
    [INLINES.ENTRY_HYPERLINK]: {
      nodes: [TEXT_CONSTRAINT]
    },
    [INLINES.ASSET_HYPERLINK]: {
      nodes: [TEXT_CONSTRAINT]
    },
    [INLINES.EMBEDDED_ENTRY]: {
      ...VOID_CONSTRAINT
    }
  }
};
