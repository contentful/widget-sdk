import React from 'react';

import {
  Paragraph,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@contentful/forma-36-react-components';
import { BLOCKS, INLINES, Document } from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

import ExternalTextLink from 'app/common/ExternalTextLink';

const richTextOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => <Paragraph>{children}</Paragraph>,
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      const { fields } = node.data.target;

      if (fields.table) {
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

      return <ExternalTextLink href={uri}>{content.map(({ value }) => value)}</ExternalTextLink>;
    },
  },
};

interface ContentfulRichTextProps {
  document: Document;
}

export const ContentfulRichText: React.FC<ContentfulRichTextProps> = ({ document }) => {
  return <>{documentToReactComponents(document, richTextOptions)}</>;
};
