import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import moment from 'moment';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Icon,
  TextLink,
  TableRow,
  TableCell,
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';

import { go } from 'states/Navigator';

import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { joinAnd } from 'utils/StringUtils';
import { getEnabledFeatures } from 'utils/SubscriptionUtils';
import { Price } from 'core/components/formatting';
import { POC_FREE_SPACE_PLAN_NAME } from 'account/pricing/PricingDataProvider';

const styles = {
  star: css({
    color: tokens.colorOrangeMid,
    fontSize: tokens.fontSizeS,
    cursor: 'default',
  }),
  hasUpgraded: css({
    backgroundColor: tokens.colorMintMid,
  }),
  helpIcon: css({
    marginTop: '-4px',
    verticalAlign: 'middle',
    cursor: 'help',
  }),
  moreButton: css({
    verticalAlign: 'middle',
  }),
};

function SpacePlanRow({
  plan,
  onChangeSpace,
  onDeleteSpace,
  hasUpgraded,
  enterprisePlan,
  showSpacePlanChangeBtn,
  showExpiresAtColumn,
}) {
  const { space } = plan;
  const createdBy = space ? getUserName(space.sys.createdBy) : '';
  const createdAt = space ? moment.utc(space.sys.createdAt).format('DD/MM/YYYY') : '';
  const expiresAt = space?.expiresAt ? moment(space.expiresAt).format('DD/MM/YYYY') : '';

  const enabledFeatures = getEnabledFeatures(plan);
  const includedFeatures = joinAnd(enabledFeatures.map(({ name }) => name));

  const showPOCTooltip = Boolean(space && space.createdAsPOC);

  const onViewSpace = () =>
    go({
      path: ['spaces', 'detail', 'home'],
      params: { spaceId: space && space.sys.id },
      options: { reload: true },
    });

  const onViewUsage = () =>
    go({
      path: ['spaces', 'detail', 'settings', 'usage'],
      params: { spaceId: space && space.sys.id },
      options: { reload: true },
    });

  return (
    <TableRow
      testId="subscription-page.spaces-list.table-row"
      className={cx({ [styles.hasUpgraded]: hasUpgraded })}>
      <TableCell testId="subscription-page.spaces-list.space-name">
        {(space && space.name) || '-'}&nbsp;
        {plan.committed && (
          <Tooltip
            testId="subscription-page.spaces-list.enterprise-tooltip"
            content="This space is part of your Enterprise deal with Contentful">
            <span
              data-test-id="subscription-page.spaces-list.enterprise-tooltip-trigger"
              className={styles.star}>
              ★
            </span>
          </Tooltip>
        )}
      </TableCell>
      <TableCell testId="subscription-page.spaces-list.space-type">
        <strong>{plan.name}</strong>&nbsp;
        {!showPOCTooltip && enabledFeatures.length > 0 && (
          <Tooltip
            testId="subscription-page.spaces-list.features-tooltip"
            content={`This space includes ${includedFeatures}`}>
            <Icon
              icon="HelpCircle"
              color="muted"
              className={styles.helpIcon}
              data-test-id="subscription-page.spaces-list.features-tooltip-trigger"
            />
          </Tooltip>
        )}
        {showPOCTooltip && (
          <Tooltip
            testId="subscription-page.spaces-list.poc-tooltip"
            content={`Formerly known as ${POC_FREE_SPACE_PLAN_NAME}`}>
            <Icon
              icon="HelpCircle"
              color="muted"
              className={styles.helpIcon}
              data-test-id="subscription-page.spaces-list.poc-tooltip-trigger"
            />
          </Tooltip>
        )}
        {showSpacePlanChangeBtn && space && (
          <>
            -{' '}
            <StateLink
              testId="subscription-page.spaces-list.change-plan-link"
              component={TextLink}
              path=".space_plans"
              params={{ spaceId: space.sys.id }}
              trackingEvent={'space_assignment:change'}
              trackParams={{
                space_id: space.sys.id,
                current_plan_id: plan.sys.id,
                current_plan_name: plan.name,
                flow: 'assing_plan_to_space',
              }}>
              change
            </StateLink>
          </>
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
              onClick={onChangeSpace(space)}>
              upgrade
            </TextLink>
          </>
        )}
      </TableCell>
      <TableCell testId="subscription-page.spaces-list.created-by">{createdBy}</TableCell>
      <TableCell testId="subscription-page.spaces-list.created-on">{createdAt}</TableCell>
      {showExpiresAtColumn && (
        <TableCell testId="subscription-page.spaces-list.expires-at">{expiresAt}</TableCell>
      )}
      <TableCell testId="subscription-page.spaces-list.option-dots" className={styles.moreButton}>
        <CardActions
          iconButtonProps={{
            testId: 'subscription-page.spaces-list.dropdown-menu.trigger',
          }}
          data-test-id="subscription-page.spaces-list.dropdown-menu">
          <DropdownList>
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
            {!showSpacePlanChangeBtn && (
              <DropdownListItem
                onClick={onChangeSpace(space)}
                testId="subscription-page.spaces-list.change-space-link">
                Change space type
              </DropdownListItem>
            )}
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
  showSpacePlanChangeBtn: PropTypes.bool,
  showExpiresAtColumn: PropTypes.bool,
};

SpacePlanRow.defaultProps = {
  enterprisePlan: false,
  hasUpgraded: false,
  showSpacePlanChangeBtn: false,
  showExpiresAtColumn: false,
};

export default SpacePlanRow;
