import { BLOCKS, INLINES } from '@contentful/rich-text-types';

export const richTextDocument = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.EMBEDDED_ENTRY,
      data: {
        target: {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'entry-1'
          }
        }
      },
      content: []
    },
    {
      nodeType: BLOCKS.EMBEDDED_ASSET,
      data: {
        target: {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: 'asset-1'
          }
        }
      },
      content: []
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: INLINES.EMBEDDED_ENTRY,
          data: {
            target: {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: 'entry-2'
              }
            }
          },
          content: []
        },
        {
          nodeType: INLINES.EMBEDDED_ASSET,
          data: {
            target: {
              sys: {
                type: 'Link',
                linkType: 'Asset',
                id: 'asset-2'
              }
            }
          },
          content: []
        },
        {
          nodeType: INLINES.ASSET_HYPERLINK,
          data: {
            target: {
              sys: {
                type: 'Link',
                linkType: 'Asset',
                id: 'asset-3'
              }
            }
          },
          content: [
            {
              nodeType: 'text',
              data: {},
              marks: [],
              value: 'text'
            }
          ]
        },
        {
          nodeType: INLINES.ENTRY_HYPERLINK,
          data: {
            target: {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: 'entry-3'
              }
            }
          },
          content: [
            {
              nodeType: 'text',
              data: {},
              marks: [],
              value: 'text'
            }
          ]
        }
      ]
    }
  ]
};
