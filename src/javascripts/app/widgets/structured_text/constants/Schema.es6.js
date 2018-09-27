import { mapValues, fromPairs } from 'lodash';
import {
  BLOCKS,
  INLINES,
  TOP_LEVEL_BLOCKS,
  VOID_BLOCKS,
  CONTAINERS
} from '@contentful/structured-text-types';

const slateTypeConstraint = type => ({ type });
const TEXT_CONSTRAINT = { object: 'text' };
const VOID_CONSTRAINT = { isVoid: true };
const INLINE_CONSTRAINTS = Object.values(INLINES).map(slateTypeConstraint);

const nodeTypeConstraint = whiteListedNodeTypes => {
  return {
    match: whiteListedNodeTypes.map(slateTypeConstraint)
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
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_1]: {
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_2]: {
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_3]: {
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_4]: {
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_5]: {
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    [BLOCKS.HEADING_6]: {
      match: [TEXT_CONSTRAINT, ...INLINE_CONSTRAINTS]
    },
    ...mapVoidTypes(VOID_BLOCKS),
    ...mapContainers(CONTAINERS)
  },
  inlines: {
    [INLINES.HYPERLINK]: {
      match: [TEXT_CONSTRAINT]
    },
    [INLINES.ENTRY_HYPERLINK]: {
      match: [TEXT_CONSTRAINT]
    },
    [INLINES.ASSET_HYPERLINK]: {
      match: [TEXT_CONSTRAINT]
    },
    [INLINES.EMBEDDED_ENTRY]: {
      ...VOID_CONSTRAINT
    }
  }
};
