import React from 'react';
import PropTypes from 'prop-types';
import { camelCase } from 'lodash';

import tokens from '@contentful/forma-36-tokens';
import PlanFeatures from '../shared/PlanFeatures';
import { Price } from 'core/components/formatting';

import { Tooltip, Icon } from '@contentful/forma-36-react-components';
import { css, cx } from 'emotion';

const createPlanCss = (backgroundColor, borderColor) => {
  return css({
    '&:before': {
      backgroundColor,
      border: `1px solid ${borderColor}`,
    },
  });
};

const styles = {
  planChevron: css({
    position: 'absolute',
    right: '19px',
    bottom: '22px',
  }),
  helpIcon: css({
    fill: tokens.colorElementDarkest,
  }),
  planItem: css({
    height: '73px',
    borderRadius: '2px',
    border: '1px solid #d3dce0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    marginBottom: '10px',
    padding: '14px 30px',
    lineHeight: '1.5em',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all ease-in-out 0.1s',
    '&:before': {
      backgroundColor: '#a9b9c0',
      border: '1px solid #8091a5',
      content: "''",
      width: '8px',
      height: '100%',
      position: 'absolute',
      top: '-1px',
      left: '-1px',
      borderRadius: '2px 0 0 2px',
    },
    '&:hover': {
      zIndex: '1',
      border: '1px solid #b4c3ca',
      boxShadow: '0 3px 3px 0 rgba(0,0,0,0.08)',
      transform: 'translateY(-2px)',
    },
  }),

  selectedPlan: css({
    border: '1px solid #3c80cf',
  }),

  disabledPlan: css({
    cursor: 'not-allowed',
    border: '1px solid #d3dce0',
    color: 'rgba(42,48,57,0.3)',

    strong: {
      color: 'rgba(42,48,57,0.3)',
    },

    '&:before': {
      opacity: '0.3',
      filter: 'alpha(opacity=30)',
    },

    '&:after': {
      border: '1px solid #d3dce0',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
      transform: 'none',
    },

    '&:hover': {
      border: '1px solid #d3dce0',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
      transform: 'none',
    },
  }),

  currentPlan: css({
    '&:after': {
      content: '"Current"',
      color: '#fff',
      backgroundColor: '#a9b9c0',
      borderRadius: '2px',
      position: 'absolute',
      right: '-20px',
      top: '35%',
      padding: '6px 10px',
      textTransform: 'uppercase',
      fontWeight: '600',
      fontSize: '12px',
      lineHeight: '12px',
      letterSpacing: '0.4px',
      opacity: '0.9',
      filter: 'alpha(opacity=90)',
    },
  }),

  planName: css({
    fontSize: '17px',
    lineHeight: '1.2',
  }),

  plans: {
    free: createPlanCss('#e5ebed', '#d3dce0'),
    micro: createPlanCss('#fba012', '#ea9005'),
    small: createPlanCss('#f05751', ' #e34e48'),
    medium: createPlanCss('#5b9fef', '#4a90e2'),
    large: createPlanCss('#14d997', '#19cd91'),
    partnerSpacePlan: createPlanCss('#3c80cf', '#3072be'),
    proofOfConcept: createPlanCss('#3c80cf', '#3072be'),
  },
};

export default function SpacePlanItem(props) {
  const { plan, isSelected, freeSpacesResource, isPayingOrg, onSelect } = props;
  const freeSpacesUsage = freeSpacesResource && freeSpacesResource.usage;
  const freeSpacesLimit = freeSpacesResource && freeSpacesResource.limits.maximum;

  // We should not show the chevron in the following cases:
  // - the plan is disabled
  // - the plan is not free, and the org is not paying
  const showChevron = plan.disabled ? false : plan.isFree ? true : isPayingOrg ? true : false;

  return (
    <div
      key={plan.sys.id}
      data-test-id="space-plan-item"
      className={cx(styles.planItem, styles.plans[camelCase(plan.name)], {
        [styles.selectedPlan]: isSelected,
        [styles.disabledPlan]: plan.disabled,
        [styles.currentPlan]: plan.current,
      })}
      onClick={() => !plan.disabled && onSelect(plan)}>
      <div className={styles.planName} data-test-id="contents">
        <strong data-test-id="space-plan-name">{plan.name}</strong>
        {plan.price > 0 && (
          <>
            {' - '}
            <span data-test-id="space-plan-price">
              <Price value={plan.price} unit="month" />
            </span>
          </>
        )}
        {plan.isFree && freeSpacesLimit && (
          <>
            {` - ${freeSpacesUsage}/${freeSpacesLimit} used `}
            <Tooltip
              content={`You can have up to ${freeSpacesLimit} free spaces for your organization. If you
              delete a free space, another one can be created.`}>
              <Icon icon="HelpCircle" className={styles.helpIcon} />
            </Tooltip>
          </>
        )}
      </div>

      <PlanFeatures resources={plan.includedResources} roleSet={plan.roleSet} />

      {showChevron && (
        <div className={styles.planChevron}>
          <Icon testId="plan-chevron" icon="ChevronRight" color="muted" />
        </div>
      )}
    </div>
  );
}

SpacePlanItem.propTypes = {
  plan: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  freeSpacesResource: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  isPayingOrg: PropTypes.bool.isRequired,
};
