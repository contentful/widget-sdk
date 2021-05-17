import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import moment from 'moment';
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
import { Price } from 'core/components/formatting';
import { router, RouteLink } from 'core/react-routing';

import { SpaceUsageTableCell } from './SpaceUsageTableCell';
import { track } from 'analytics/Analytics';

const styles = {
  hasUpgraded: css({ backgroundColor: tokens.colorMintMid }),
  helpIcon: css({
    star: css({
      color: tokens.colorOrangeMid,
      fontSize: tokens.fontSizeS,
      cursor: 'default',
    }),
    marginTop: `-${tokens.spacing2Xs}`,
    verticalAlign: 'middle',
  }),
  tableCellAlignedMiddle: css({
    verticalAlign: 'middle',
  }),
};

export const SpacePlanRow = ({
  organizationId,
  plan,
  spaceUsage,
  onChangeSpace,
  onDeleteSpace,
  hasUpgraded,
  enterprisePlan,
  showSpacePlanChangeBtn,
}) => {
  const { space } = plan;
  const { isAccessible } = space;
  const { spaceTrialPeriodEndsAt } = spaceUsage;
  const expiresAtTooltipContent = spaceTrialPeriodEndsAt
    ? `${
        moment().isAfter(moment(spaceTrialPeriodEndsAt), 'date') ? 'Expired' : 'Expires'
      } on ${moment(spaceTrialPeriodEndsAt).format('DD/MM/YYYY')}`
    : '';

  const onViewUsage = () => {
    track('space_usage_summary:go_to_detailed_usage');
    router.navigate({
      path: 'usage',
      spaceId: space.sys.id,
    });
  };

  return (
    <TableRow
      testId="subscription-page.spaces-list.table-row"
      className={cx({ [styles.hasUpgraded]: hasUpgraded })}>
      <TableCell
        testId="subscription-page.spaces-list.space-name"
        className={styles.tableCellAlignedMiddle}>
        {isAccessible ? (
          <StateLink
            testId="subscription-page.spaces-list.space-link"
            component={TextLink}
            path="spaces.detail"
            params={{
              spaceId: space.sys.id,
            }}
            trackingEvent={'space_usage_summary:go_to_space_home'}>
            {space.name || '-'}
          </StateLink>
        ) : (
          space.name || '-'
        )}
      </TableCell>
      <TableCell
        testId="subscription-page.spaces-list.space-type"
        className={styles.tableCellAlignedMiddle}>
        <strong>{plan.name}</strong>&nbsp;
        {spaceTrialPeriodEndsAt && (
          <Tooltip
            content={expiresAtTooltipContent}
            testId="subscription-page.spaces-list.trial-space-tooltip">
            <Icon
              icon="HelpCircle"
              color="muted"
              className={styles.helpIcon}
              testId="subscription-page.spaces-list.trial-space-tooltip-trigger"
            />
            &nbsp;
          </Tooltip>
        )}
        {showSpacePlanChangeBtn && (
          <>
            -{' '}
            <RouteLink
              testId="subscription-page.spaces-list.change-plan-link"
              route={{
                path: 'organizations.subscription.overview.space-plans',
                spaceId: space.sys.id,
                orgId: organizationId,
              }}
              onClick={() => {
                track('space_assignment:change', {
                  space_id: space.sys.id,
                  current_plan_id: plan.sys.id,
                  current_plan_name: plan.name,
                  flow: 'assign_plan_to_space',
                });
              }}
              as={TextLink}>
              change
            </RouteLink>
          </>
        )}
        {!enterprisePlan && (
          <>
            -{' '}
            <TextLink
              testId="subscription-page.spaces-list.upgrade-plan-link"
              onClick={onChangeSpace(space)}>
              upgrade
            </TextLink>
            <br />
            <Price
              testId="subscription-page.spaces-list.plan-price"
              value={plan.price}
              unit="month"
            />
          </>
        )}{' '}
      </TableCell>
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.usage.environments"
        {...spaceUsage.environments}
      />
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.usage.roles"
        {...spaceUsage.roles}
      />
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.usage.locales"
        {...spaceUsage.locales}
      />
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.usage.content-types"
        {...spaceUsage.contentTypes}
      />
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.usage.records"
        {...spaceUsage.records}
      />

      <TableCell
        testId="subscription-page.spaces-list.option-dots"
        className={styles.tableCellAlignedMiddle}>
        <CardActions
          iconButtonProps={{
            testId: 'subscription-page.spaces-list.dropdown-menu.trigger',
          }}
          data-test-id="subscription-page.spaces-list.dropdown-menu">
          <DropdownList>
            <DropdownListItem
              onClick={onViewUsage}
              isDisabled={!isAccessible}
              testId="subscription-page.spaces-list.space-usage-link">
              Detailed usage
            </DropdownListItem>
            {!showSpacePlanChangeBtn && (
              <DropdownListItem
                onClick={onChangeSpace(space)}
                testId="subscription-page.spaces-list.change-space-link">
                Change space type
              </DropdownListItem>
            )}
            <DropdownListItem
              onClick={onDeleteSpace(plan)}
              testId="subscription-page.spaces-list.delete-space-link">
              Delete
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
};

SpacePlanRow.propTypes = {
  organizationId: PropTypes.string.isRequired,
  plan: PropTypes.object.isRequired,
  spaceUsage: PropTypes.object,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  hasUpgraded: PropTypes.bool,
  showSpacePlanChangeBtn: PropTypes.bool,
};

SpacePlanRow.defaultProps = {
  enterprisePlan: false,
  hasUpgraded: false,
  showSpacePlanChangeBtn: false,
};
