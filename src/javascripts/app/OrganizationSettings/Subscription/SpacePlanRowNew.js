import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import moment from 'moment';
import tokens from '@contentful/forma-36-tokens';
import { TRIAL_SPACE_FREE_SPACE_PLAN_NAME } from 'account/pricing/PricingDataProvider';
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
import { go } from 'states/Navigator';
import { SpaceUsageTableCell } from './components/SpaceUsageTableCell';
import { addMasterEnvironment } from './SpacesUsageService';

const styles = {
  star: css({ color: tokens.colorOrangeMid, fontSize: tokens.fontSizeS, cursor: 'default' }),
  hasUpgraded: css({ backgroundColor: tokens.colorMintMid }),
  moreButton: css({ verticalAlign: 'middle' }),
  helpIcon: css({ marginTop: `-${tokens.spacing2Xs}`, verticalAlign: 'middle' }),
};

export const SpacePlanRowNew = ({
  plan,
  spaceUsage,
  onChangeSpace,
  onDeleteSpace,
  hasUpgraded,
  enterprisePlan,
  showSpacePlanChangeBtn,
}) => {
  const { space } = plan;
  const hasTrialSpacePlan = plan.name === TRIAL_SPACE_FREE_SPACE_PLAN_NAME;
  const isAccessible = Boolean(space.isAccessible);
  const isLegacyPOC = isAccessible && hasTrialSpacePlan && space.expiresAt === undefined;
  // if the space is not accessible, we cannot differenciate legacy POC from Trial Space
  // in this case, treat it as Trial Space and show 'Become a space member to view expiration date' tooltip
  const isTrialSpace = hasTrialSpacePlan && !isLegacyPOC;
  const expiresAtTooltipContent =
    isTrialSpace && isAccessible
      ? `${moment().isAfter(moment(space.expiresAt), 'date') ? 'Expired' : 'Expires'} on ${moment(
          space.expiresAt
        ).format('DD/MM/YYYY')}`
      : 'Become a space member to view expiration date';

  const onViewUsage = () =>
    go({
      path: ['spaces', 'detail', 'settings', 'usage'],
      params: {
        spaceId: space.sys.id,
      },
    });

  return (
    <TableRow
      testId="subscription-page.spaces-list.table-row"
      className={cx({ [styles.hasUpgraded]: hasUpgraded })}>
      <TableCell testId="subscription-page.spaces-list.space-name">
        {isAccessible ? (
          <StateLink
            testId="subscription-page.spaces-list.space-link"
            component={TextLink}
            path="spaces.detail"
            params={{
              spaceId: space.sys.id,
            }}>
            {space.name || '-'}
          </StateLink>
        ) : (
          space.name || '-'
        )}
      </TableCell>
      <TableCell testId="subscription-page.spaces-list.space-type">
        <strong>{plan.name}</strong>&nbsp;
        {isTrialSpace && (
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
        )}{' '}
      </TableCell>
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.environments"
        {...addMasterEnvironment(spaceUsage.environments)}
      />
      <SpaceUsageTableCell testId="subscription-page.spaces-list.roles" {...spaceUsage.roles} />
      <SpaceUsageTableCell testId="subscription-page.spaces-list.locales" {...spaceUsage.locales} />
      <SpaceUsageTableCell
        testId="subscription-page.spaces-list.content-types"
        {...spaceUsage.contentTypes}
      />
      <SpaceUsageTableCell testId="subscription-page.spaces-list.records" {...spaceUsage.records} />
      <TableCell testId="subscription-page.spaces-list.option-dots" className={styles.moreButton}>
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
              onClick={onDeleteSpace(space, plan)}
              testId="subscription-page.spaces-list.delete-space-link">
              Delete
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </TableCell>
    </TableRow>
  );
};

SpacePlanRowNew.propTypes = {
  plan: PropTypes.object.isRequired,
  spaceUsage: PropTypes.object,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  hasUpgraded: PropTypes.bool,
  showSpacePlanChangeBtn: PropTypes.bool,
};

SpacePlanRowNew.defaultProps = {
  enterprisePlan: false,
  hasUpgraded: false,
  showSpacePlanChangeBtn: false,
};
