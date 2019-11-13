import { TOP_LEVEL_BLOCKS, BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

export default {
  ENABLED_MARKS: 'enabledMarks',
  ENABLED_NODE_TYPES: 'enabledNodeTypes'
};

export const VALIDATABLE_NODE_TYPES = [
  ...TOP_LEVEL_BLOCKS.filter(type => type !== BLOCKS.PARAGRAPH),
  ...Object.values(INLINES)
];

export const VALIDATABLE_MARKS = Object.values(MARKS);
