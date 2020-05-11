import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { get } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  TextLink,
  TableRow,
  TableCell,
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';

import { go } from 'states/Navigator';

import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { joinAnd } from 'utils/StringUtils';
import { getEnabledFeatures } from 'utils/SubscriptionUtils';

import { Price } from 'core/components/formatting';
import QuestionMarkIcon from 'svg/QuestionMarkIcon.svg';

const styles = {
  moreButton: css({
    verticalAlign: 'middle',
  }),
  spaceName: css({
    display: 'inline-block',
    marginRight: '5px',
  }),
  star: css({
    color: tokens.colorOrangeLight,
    fontSize: '12px',
    cursor: 'default',
  }),
  helpIcon: css({
    display: 'inline',
    position: 'relative',
    bottom: '0.125em',
    paddingLeft: '0.3em',
    cursor: 'help',
  }),
};

function SpacePlanRow({ plan, onChangeSpace, onDeleteSpace, hasUpgraded, enterprisePlan }) {
  const { space } = plan;
  const enabledFeatures = getEnabledFeatures(plan);
  const hasAnyFeatures = enabledFeatures.length > 0;

  const createdBy = space ? getUserName(space.sys.createdBy || {}) : '';
  const createdAt = space ? moment.utc(space.sys.createdAt).format('DD/MM/YYYY') : '';

  const onViewSpace = () =>
    go({
      path: ['spaces', 'detail', 'home'],
      params: { spaceId: space.sys.id },
      options: { reload: true },
    });

  const onViewUsage = () =>
    go({
      path: ['spaces', 'detail', 'settings', 'usage'],
      params: { spaceId: space.sys.id },
      options: { reload: true },
    });

  return (
    <TableRow
      testId="subscription-page.spaces-list.table-row"
      className={hasUpgraded ? 'x--success' : ''}>
      <TableCell testId="subscription-page.spaces-list.space-name">
        <span className={styles.spaceName}>
          <strong>{get(space, 'name', '-')}</strong>
        </span>
        {plan.committed && (
          <Tooltip
            testId="subscription-page.spaces-list.enterprise-toolitp"
            content="This space is part of your Enterprise deal with Contentful">
            <span
              data-test-id="subscription-page.spaces-list.enterprise-toolitp-trigger"
              className={styles.star}>
              ★
            </span>
          </Tooltip>
        )}
      </TableCell>
      <TableCell testId="subscription-page.spaces-list.space-type">
        <strong>{plan.name}</strong>
        {hasAnyFeatures && (
          <div className={styles.helpIcon}>
            <Tooltip
              testId="subscription-page.spaces-list.features-toolitp"
              content={`This space includes ${joinAnd(enabledFeatures.map(({ name }) => name))}`}>
              <span data-test-id="subscription-page.spaces-list.features-toolitp-trigger">
                <QuestionMarkIcon color={tokens.colorTextLight} />
              </span>
            </Tooltip>
          </div>
        )}
        <br />
        {!enterprisePlan && (
          <>
            <Price
              testId="subscription-page.spaces-list.plan-price"
              value={plan.price}
              unit="month"
            />{' '}
            -{' '}
            <TextLink
              testId="subscription-page.spaces-list.upgrade-plan-link"
              onClick={onChangeSpace(space, 'change')}>
              upgrade
            </TextLink>
          </>
        )}
      </TableCell>
      <TableCell testId="subscription-page.spaces-list.created-by">{createdBy}</TableCell>
      <TableCell testId="subscription-page.spaces-list.created-on">{createdAt}</TableCell>
      <TableCell testId="subscription-page.spaces-list.option-dots" className={styles.moreButton}>
        <CardActions
          iconButtonProps={{
            testId: 'subscription-page.spaces-list.dropdown-menu.trigger',
          }}
          data-test-id="subscription-page.spaces-list.dropdown-menu">
          <DropdownList>
            {enterprisePlan && (
              <DropdownListItem
                onClick={onChangeSpace(space, 'change')}
                testId="subscription-page.spaces-list.change-space-link">
                Change space type
              </DropdownListItem>
            )}
            <DropdownListItem
              onClick={onViewSpace}
              isDisabled={Boolean(space && !space.isAccessible)}
              testId="subscription-page.spaces-list.space-link">
              Go to space
            </DropdownListItem>
            <DropdownListItem
              onClick={onViewUsage}
              isDisabled={Boolean(space && !space.isAccessible)}
              testId="subscription-page.spaces-list.space-usage-link">
              Usage
            </DropdownListItem>
            <DropdownListItem
              onClick={onDeleteSpace(space, plan)}
              testId="subscription-page.spaces-list.delete-space-link">
              Delete
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
}

SpacePlanRow.propTypes = {
  plan: PropTypes.object.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  hasUpgraded: PropTypes.bool,
};

SpacePlanRow.defaultProps = {
  enterprisePlan: false,
  hasUpgraded: false,
};

export default SpacePlanRow;
