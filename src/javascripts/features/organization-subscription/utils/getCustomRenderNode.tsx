import React from 'react';
import { css } from 'emotion';
import { TextLink, Icon, List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import type { RenderNode } from '@contentful/rich-text-react-renderer';

import {
  WebappContentTypes,
  InternalActionValues,
  InternalVariableValues,
} from 'core/services/ContentfulCDA';
import { RouteLink } from 'core/react-routing';

const styles = {
  list: css({
    marginBottom: tokens.spacingM,
  }),
  listItem: css({
    display: 'flex',
    alignContent: 'center',
    p: {
      marginBottom: tokens.spacingXs,
    },
  }),
  checkmarkIcon: (color?: string) =>
    css({
      marginRight: tokens.spacingXs,
      fill: color && tokens[color],
    }),
};

export interface GetCustomRenderNodeOptions {
  upgradableSpaceId?: string;
  colorAccent?: string;
  daysOfTrial?: number;
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
  [BLOCKS.UL_LIST]: (_node, children) => {
    return (
      <List>
        {(children as React.ReactElement[])?.map((child, index) => {
          return (
            <ListItem className={styles.listItem} key={index}>
              <Icon className={styles.checkmarkIcon(options?.colorAccent)} icon="CheckCircle" />
              {React.createElement(React.Fragment, child.props)}
            </ListItem>
          );
        })}
      </List>
    );
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
      // If the internal action is to change a space and we do not have a spaceId, return the copy as plain text
      if (fields.action === InternalActionValues.CHANGE_SPACE && !options?.upgradableSpaceId) {
        return fields.label;
      }

      if (fields.action === InternalActionValues.CHANGE_SPACE && options?.upgradableSpaceId) {
        return (
          <RouteLink
            route={{
              path: 'organizations.subscription.upgrade_space',
              orgId,
              spaceId: options.upgradableSpaceId,
            }}
            as={TextLink}>
            {fields.label}
          </RouteLink>
        );
      }

      if (fields.action === InternalActionValues.MANAGE_USERS) {
        return (
          <RouteLink as={TextLink} route={{ path: 'organizations.users.list', orgId }}>
            {fields.label}
          </RouteLink>
        );
      }

      if (fields.action === InternalActionValues.ADD_SPACE) {
        return (
          <RouteLink route={{ path: 'organizations.subscription.new_space', orgId }} as={TextLink}>
            {fields.label}
          </RouteLink>
        );
      }

      return null;
    }

    if (id === WebappContentTypes.INTERNAL_VARIABLE && options?.users) {
      if (fields.value === InternalVariableValues.NUMBER_OF_USERS) {
        return options.users.count;
      }

      if (fields.value === InternalVariableValues.LIMIT_OF_USERS) {
        return options.users.limit;
      }

      if (fields.value === InternalVariableValues.ENTERPRISE_TRIAL_DAYS && options.daysOfTrial) {
        return options.daysOfTrial;
      }
    }
  },
});
