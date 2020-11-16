import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
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
import { go } from 'states/Navigator';
import { SpaceUsageTableCell } from './components/SpaceUsageTableCell';

const styles = {
  star: css({ color: tokens.colorOrangeMid, fontSize: tokens.fontSizeS, cursor: 'default' }),
  hasUpgraded: css({ backgroundColor: tokens.colorMintMid }),
  moreButton: css({ verticalAlign: 'middle' }),
  helpIcon: css({ marginTop: `-${tokens.spacing2Xs}`, verticalAlign: 'middle', cursor: 'help' }),
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
  const showExpiresAt = Boolean('expiresAt' in space);
  const isAccessible = Boolean(space.isAccessible);

  const onViewUsage = () =>
    go({
      path: ['spaces', 'detail', 'settings', 'usage'],
      params: {
        spaceId: space.sys.id,
      },
    });

  return (
    <TableRow className={cx({ [styles.hasUpgraded]: hasUpgraded })}>
      <TableCell>
        {' '}
        {isAccessible ? (
          <StateLink
            component={TextLink}
            path="spaces.detail.home"
            params={{
              spaceId: space.sys.id,
            }}>
            {space.name || '-'}{' '}
          </StateLink>
        ) : (
          space.name || '-'
        )}
        &nbsp;{' '}
        {plan.committed && (
          <Tooltip content="This space is part of your Enterprise deal with Contentful">
            <span className={styles.star}>★</span>
          </Tooltip>
        )}{' '}
      </TableCell>
      <TableCell>
        <strong>{plan.name}</strong>&nbsp;{' '}
        {showExpiresAt && (
          <Tooltip
            content={space.expiresAt ? `Expires at ${space.expiresAt}` : `Expires after trial`}>
            <Icon icon="HelpCircle" color="muted" className={styles.helpIcon} />
          </Tooltip>
        )}
        {showSpacePlanChangeBtn && (
          <>
            -{' '}
            <StateLink
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
        <br />{' '}
        {!enterprisePlan && (
          <>
            <Price value={plan.price} unit="month" /> -{' '}
            <TextLink onClick={onChangeSpace(space)}>upgrade</TextLink>
          </>
        )}{' '}
      </TableCell>
      <SpaceUsageTableCell {...spaceUsage.environments} />
      <SpaceUsageTableCell {...spaceUsage.roles} />
      <SpaceUsageTableCell {...spaceUsage.locales} />
      <SpaceUsageTableCell {...spaceUsage.contentTypes} />
      <SpaceUsageTableCell {...spaceUsage.records} />
      <TableCell className={styles.moreButton}>
        <CardActions>
          <DropdownList>
            <DropdownListItem onClick={onViewUsage} isDisabled={!isAccessible}>
              Usage
            </DropdownListItem>
            {!showSpacePlanChangeBtn && (
              <DropdownListItem onClick={onChangeSpace(space)}>Change space type</DropdownListItem>
            )}
            <DropdownListItem onClick={onDeleteSpace(space, plan)}>Delete</DropdownListItem>
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
