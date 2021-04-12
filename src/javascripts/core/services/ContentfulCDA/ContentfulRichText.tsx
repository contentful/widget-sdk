import React from 'react';

import {
  Paragraph,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@contentful/forma-36-react-components';
import { BLOCKS, INLINES, Document, Text } from '@contentful/rich-text-types';
import { documentToReactComponents, RenderNode } from '@contentful/rich-text-react-renderer';

import ExternalTextLink from 'app/common/ExternalTextLink';
import { WebappContentTypes } from './types';

const deaultRenderNode: RenderNode = {
  [BLOCKS.PARAGRAPH]: (_node, children) => <Paragraph>{children}</Paragraph>,
  [BLOCKS.EMBEDDED_ENTRY]: (node) => {
    const {
      fields,
      sys: {
        contentType: {
          sys: { id },
        },
      },
    } = node.data.target;

    if (id === WebappContentTypes.TABLE) {
      // The first element in the array is always the table’s header
      const [headerRow, ...bodyRows] = fields.table.tableData;

      return (
        <Table>
          <TableHead>
            <TableRow>
              {headerRow.map((cell, idx) => (
                <TableCell key={idx}>{cell}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {bodyRows.map((row, idx) => {
              return (
                <TableRow key={idx}>
                  {row.map((cell, idx) => (
                    <TableCell key={idx}>{cell}</TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }
  },
  [INLINES.HYPERLINK]: (node) => {
    const {
      data: { uri },
      content,
    } = node;

    return (
      <ExternalTextLink href={uri}>
        {(content as Text[]).map(({ value }) => value)}
      </ExternalTextLink>
    );
  },
};

interface ContentfulRichTextProps {
  /** Object returned by the CDA for rich text fields in a content entry */
  document: Document;
  /**
   * A map that helps customise the way a rich text will be rendered in react.
   * Each property is a function (node, children) => ReactNode
   * */
  customRenderNode?: RenderNode;
}

export function ContentfulRichText({ document, customRenderNode }: ContentfulRichTextProps) {
  return (
    <>
      {documentToReactComponents(document, {
        renderNode: { ...deaultRenderNode, ...customRenderNode },
      })}
    </>
  );
}
