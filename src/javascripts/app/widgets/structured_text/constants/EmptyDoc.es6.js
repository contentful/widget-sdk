import { BLOCKS } from '@contentful/structured-text-types';

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
