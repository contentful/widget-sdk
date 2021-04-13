import { Document } from '@contentful/rich-text-types';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

export const mockDocument: Document = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: 'text',
          value: 'This is a mock text for a paragraph node',
          marks: [],
          data: {},
        },
      ],
    },
    {
      nodeType: BLOCKS.PARAGRAPH,
      content: [
        {
          nodeType: 'text',
          value: 'This is a mock text for a paragraph node with a link ',
          marks: [],
          data: {},
        },
        {
          nodeType: INLINES.HYPERLINK,
          content: [
            {
              nodeType: 'text',
              value: 'this is a link',
              marks: [],
              data: {},
            },
          ],
          data: {
            uri: 'https://www.contentful.com',
          },
        },
      ],
      data: {},
    },
    {
      nodeType: BLOCKS.EMBEDDED_ENTRY,
      content: [],
      data: {
        target: {
          sys: {
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'webappTable',
              },
            },
          },
          fields: {
            name: 'Embedded Table',
            table: {
              tableData: [
                ['table head - column I', 'table head - column II', 'table head - column III'],
                ['row I & column I (with tooltip)', 'row I & column II', 'row I & column III'],
                ['row II & column I', 'row II & column II', 'row II & column III'],
              ],
            },
            extras: [
              {
                fields: {
                  text: 'row I & column I (with tooltip)',
                  tooltipContent: 'content of the tooltip',
                },
              },
            ],
          },
        },
      },
    },
  ],
};
