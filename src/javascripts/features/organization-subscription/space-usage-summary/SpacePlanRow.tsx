import React from 'react';
import { cx, css } from 'emotion';
import moment from 'moment';
import {
  Icon,
  TextLink,
  TableRow,
  TableCell,
  Tooltip,
  CardActions,
  DropdownList,
  DropdownListItem,
  Flex,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { track } from 'analytics/Analytics';
import StateLink from 'app/common/StateLink';
import { Price } from 'core/components/formatting';
import { router, RouteLink } from 'core/react-routing';

import type { SpacePlanWithUsage } from '../types';
import { SpaceUsageTableCell } from './SpaceUsageTableCell';

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
  iconContainer: css({
    maxHeight: '18px',
  }),
};

interface SpacePlanRow {
  enterprisePlan?: boolean;
  hasUpgraded?: boolean;
  onChangeSpace: () => void;
  onDeleteSpace: () => void;
  organizationId: string;
  plan: SpacePlanWithUsage;
  showSpacePlanChangeBtn?: boolean;
}

export function SpacePlanRow({
  enterprisePlan = false,
  hasUpgraded = false,
  onChangeSpace,
  onDeleteSpace,
  organizationId,
  plan,
  showSpacePlanChangeBtn = false,
  showV1MigrationCommunication,
}) {
  const { space, usage: spaceUsage } = plan;
  const expiresAtTooltipContent = spaceUsage.spaceTrialPeriodEndsAt
    ? `${
        moment().isAfter(moment(spaceUsage.spaceTrialPeriodEndsAt), 'date') ? 'Expired' : 'Expires'
      } on ${moment(spaceUsage.spaceTrialPeriodEndsAt).format('DD/MM/YYYY')}`
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
        {space.isAccessible ? (
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
        {spaceUsage.spaceTrialPeriodEndsAt && (
          <Tooltip
            content={expiresAtTooltipContent}
            testId="subscription-page.spaces-list.trial-space-tooltip">
            <Icon
              icon="InfoCircle"
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
            <Flex alignItems="center">
              <Price
                testId="subscription-page.spaces-list.plan-price"
                value={plan.price}
                unit="month"
              />
              {showV1MigrationCommunication && (
                <Flex marginLeft="spacing2Xs" className={styles.iconContainer}>
                  <Tooltip
                    containerElement="span"
                    content="This space is assigned to a legacy subscription plan, which includes custom pricing">
                    <Icon icon="InfoCircle" color="muted" />
                  </Tooltip>
                </Flex>
              )}
            </Flex>
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
              isDisabled={!space.isAccessible}
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
              onClick={onDeleteSpace}
              testId="subscription-page.spaces-list.delete-space-link">
              Delete
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
}
