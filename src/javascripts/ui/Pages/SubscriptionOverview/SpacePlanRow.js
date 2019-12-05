import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from 'emotion';
import { joinAnd } from 'utils/StringUtils';
import tokens from '@contentful/forma-36-tokens';
import { TableRow, TableCell, Tooltip } from '@contentful/forma-36-react-components';

import { get } from 'lodash';

import { go } from 'states/Navigator';

import { getEnabledFeatures } from 'utils/SubscriptionUtils';
import { getUserName } from 'utils/UserUtils';

import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import Price from 'ui/Components/Price';
import ContextMenu from 'ui/Components/ContextMenu';
import QuestionMarkIcon from 'svg/QuestionMarkIcon';

const styles = {
  dotsRow: css({
    textAlign: 'right',
    verticalAlign: 'middle'
  }),
  spaceName: css({
    display: 'inline-block',
    marginRight: '5px'
  }),
  star: css({
    color: tokens.colorOrangeLight,
    fontSize: '12px',
    cursor: 'default'
  }),
  helpIcon: css({
    display: 'inline',
    position: 'relative',
    bottom: '0.125em',
    paddingLeft: '0.3em',
    cursor: 'help'
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
        <span className={styles.spaceName}>
          <strong>{get(space, 'name', '-')}</strong>
        </span>
        {plan.committed && (
          <Tooltip content="This space is part of your Enterprise deal with Contentful">
            <span className={styles.star}>★</span>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        <strong>{plan.name}</strong>
        {hasAnyFeatures && (
          <div className={styles.helpIcon}>
            <Tooltip
              content={`This space includes ${joinAnd(enabledFeatures.map(({ name }) => name))}`}>
              <QuestionMarkIcon color={tokens.colorTextLight} />
            </Tooltip>
          </div>
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
