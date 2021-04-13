import React from 'react';
import { css } from 'emotion';
import {
  TextLink,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Icon,
} from '@contentful/forma-36-react-components';

import { INLINES, BLOCKS } from '@contentful/rich-text-types';
import type { RenderNode } from '@contentful/rich-text-react-renderer';

import {
  WebappContentTypes,
  WebappTable,
  InternalActionValues,
  InternalVariableValues,
} from 'core/services/ContentfulCDA';
import StateLink from 'app/common/StateLink';

export interface GetCustomRenderNodeOptions {
  upgradableSpaceId?: string;
  users?: {
    count: number;
    limit: number;
  };
}

// This function helps us to change the way we render a certain entry that we inlined in the rich text
// e.g Internal Actions, internal variables, tables, etc
export const getCustomRenderNode = (
  orgId: string,
  options?: GetCustomRenderNodeOptions
): RenderNode => ({
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
      const references = extras.reduce((acc, extra) => {
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
                    const tooltipContent = references[cell];
                    return (
                      <TableCell key={idx}>
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
  [INLINES.EMBEDDED_ENTRY]: (node) => {
    const {
      fields,
      sys: {
        contentType: {
          sys: { id },
        },
      },
    } = node.data.target;

    if (id === WebappContentTypes.INTERNAL_ACTION) {
      let path: string[] = [];
      let params: Record<string, string> = { orgId };

      // If the internal action is to change a space and we do not have a spaceId, return the copy as plain text
      if (fields.action === InternalActionValues.CHANGE_SPACE && !options?.upgradableSpaceId) {
        return fields.label;
      }

      if (fields.action === InternalActionValues.CHANGE_SPACE && options?.upgradableSpaceId) {
        path = ['account', 'organizations', 'subscription_new', 'upgrade_space'];
        params = { ...params, spaceId: options.upgradableSpaceId };
      }

      if (fields.action === InternalActionValues.ADD_SPACE) {
        path = ['account', 'organizations', 'subscription_new', 'new_space'];
      }

      if (fields.action === InternalActionValues.MANAGE_USERS) {
        path = ['account', 'organizations', 'users', 'list'];
      }

      return (
        <StateLink component={TextLink} path={path} params={params}>
          {fields.label}
        </StateLink>
      );
    }

    if (id === WebappContentTypes.INTERNAL_VARIABLE && options?.users) {
      if (fields.value === InternalVariableValues.NUMBER_OF_USERS) {
        return options.users.count;
      }

      if (fields.value === InternalVariableValues.LIMIT_OF_USERS) {
        return options.users.limit;
      }
    }
  },
});
