import React from 'react';
import { css } from 'emotion';

import {
  Icon,
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@contentful/forma-36-react-components';
import { BLOCKS, INLINES, Text } from '@contentful/rich-text-types';
import type { RenderNode } from '@contentful/rich-text-react-renderer';

import ExternalTextLink from 'app/common/ExternalTextLink';
import { WebappContentTypes, WebappTable } from '../types';

export const defaultRenderNode: RenderNode = {
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
      const { table, extras } = fields as WebappTable;

      // The first element in the array is always the table’s header
      const [headerRow, ...bodyRows] = table.tableData;
      // Manipulating possible extra entries in the table (e.g.: Copy with tooltip)
      const references = extras?.reduce((acc, extra) => {
        return { ...acc, [extra.fields.text]: extra.fields.tooltipContent };
      }, {});

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
                  {row.map((cell, idx) => {
                    const tooltipContent = references && references[cell];
                    return (
                      <TableCell key={idx}>
                        {/* make text in the first column bold */}
                        {idx === 0 ? <b>{cell}</b> : cell}{' '}
                        {tooltipContent && (
                          <Tooltip place="bottom" content={tooltipContent}>
                            <Icon
                              className={css({
                                marginBottom: '-3px',
                              })}
                              icon="InfoCircleTrimmed"
                              color="muted"
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  })}
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
