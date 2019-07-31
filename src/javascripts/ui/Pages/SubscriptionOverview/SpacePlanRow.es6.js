/* eslint-disable rulesdir/restrict-inline-styles */
/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from 'emotion';
import { joinAnd } from 'utils/StringUtils.es6';
import tokens from '@contentful/forma-36-tokens';
import { TableRow, TableCell } from '@contentful/forma-36-react-components';

import { get } from 'lodash';

import { go } from 'states/Navigator.es6';

import { getEnabledFeatures } from 'utils/SubscriptionUtils.es6';
import { getUserName } from 'utils/UserUtils.es6';

import { isEnterprisePlan } from 'account/pricing/PricingDataProvider.es6';
import HelpIcon from 'ui/Components/HelpIcon.es6';
import Tooltip from 'ui/Components/Tooltip.es6';
import Price from 'ui/Components/Price.es6';
import ContextMenu from 'ui/Components/ContextMenu.es6';

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle'
  })
};

function SpacePlanRow({ basePlan, plan, upgraded, onChangeSpace, onDeleteSpace }) {
  const space = plan.space;
  const enabledFeatures = getEnabledFeatures(plan);
  const hasAnyFeatures = enabledFeatures.length > 0;
  const key = plan.sys.id || (plan.space && plan.space.sys.id);

  let createdBy = '';
  let createdAt = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
  }

  const contextMenuItems = [
    {
      label: 'Change space type',
      action: onChangeSpace(space, 'change'),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.change-space-link'
      }
    },
    {
      label: 'Go to space',
      disabled: Boolean(space && !space.isAccessible),
      action: () =>
        go({
          path: ['spaces', 'detail', 'home'],
          params: { spaceId: space.sys.id },
          options: { reload: true }
        }),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.space-link'
      }
    },
    {
      label: 'Usage',
      disabled: Boolean(space && !space.isAccessible),
      action: () =>
        go({
          path: ['spaces', 'detail', 'settings', 'usage'],
          params: { spaceId: space.sys.id },
          options: { reload: true }
        }),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.space-usage-link'
      }
    },
    {
      label: 'Delete',
      action: onDeleteSpace(space, plan),
      otherProps: {
        'data-test-id': 'subscription-page.spaces-list.delete-space-link'
      }
    }
  ];

  const className = upgraded ? 'x--success' : '';

  return (
    <TableRow className={className} key={key}>
      <TableCell>
        <strong>{get(space, 'name', '-')}</strong>
        {plan.committed && (
          <Tooltip
            style={{ fontSize: '12px' }}
            tooltip="This space is part of your Enterprise deal with Contentful"
            className="help-icon">
            <span style={{ color: tokens.colorOrangeLight }}>★</span>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        <strong>{plan.name}</strong>
        {hasAnyFeatures && (
          <HelpIcon>
            This space includes {joinAnd(enabledFeatures.map(({ name }) => name))}
          </HelpIcon>
        )}
        <br />
        {!isEnterprisePlan(basePlan) && <Price value={plan.price} unit="month" />}
      </TableCell>
      <TableCell>{createdBy}</TableCell>
      <TableCell>{createdAt}</TableCell>
      <TableCell className={styles.dotsRow}>
        {space && (
          <ContextMenu
            testId="subscription-page.spaces-list.space-context-menu"
            items={contextMenuItems}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

SpacePlanRow.propTypes = {
  basePlan: PropTypes.object.isRequired,
  plan: PropTypes.object.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired,
  upgraded: PropTypes.bool
};

export default SpacePlanRow;
