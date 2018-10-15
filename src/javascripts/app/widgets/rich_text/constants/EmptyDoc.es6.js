import { BLOCKS } from '@contentful/rich-text-types';

export default {
  nodeClass: 'document',
  nodeType: 'document',
  content: [
    {
      nodeClass: 'block',
      nodeType: BLOCKS.PARAGRAPH,
      content: [
        {
          nodeClass: 'text',
          nodeType: 'text',
          value: '',
          marks: []
        }
      ],
      data: {}
    }
  ]
};
