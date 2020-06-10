import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { css } from 'emotion';
import { kebabCase } from 'lodash';
import { Tooltip, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import PlanFeatures from 'components/shared/space-wizard/PlanFeatures';
import { Pluralized } from 'core/components/formatting';
import { formatPrice } from './WizardUtils';

const styles = {
  planChevron: css({
    position: 'absolute',
    right: '19px',
    bottom: '22px',
  }),
  helpIcon: css({
    fill: tokens.colorElementDarkest,
    marginBottom: '-3px',
  }),
};

class SpacePlanItem extends React.Component {
  static displayName = 'SpacePlanItem';

  static propTypes = {
    plan: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    freeSpacesResource: PropTypes.object,
    onSelect: PropTypes.func.isRequired,
    isPayingOrg: PropTypes.bool.isRequired,
    isCurrentPlan: PropTypes.bool,
    isRecommended: PropTypes.bool,
    isCommunityPlanEnabled: PropTypes.bool,
  };

  render() {
    const {
      plan,
      isCurrentPlan,
      isSelected,
      isRecommended,
      freeSpacesResource,
      isPayingOrg,
      onSelect,
      isCommunityPlanEnabled,
    } = this.props;
    const freeSpacesUsage = freeSpacesResource && freeSpacesResource.usage;
    const freeSpacesLimit = freeSpacesResource && freeSpacesResource.limits.maximum;

    const tooltipContent = isCommunityPlanEnabled ? (
      <>
        You have <Pluralized text="free community space" count={freeSpacesLimit} /> for your
        organization. If you delete a community space, you can create another one.
      </>
    ) : (
      <>
        You can have up to <Pluralized text="free space" count={freeSpacesLimit} /> for your
        organization. If you delete a free space, another one can be created.
      </>
    );

    return (
      <div
        className={classnames(
          'space-plans-list__item',
          `space-plans-list__item--${kebabCase(plan.name)}`,
          {
            'space-plans-list__item--selected': isSelected,
            'space-plans-list__item--disabled': plan.disabled,
            'space-plans-list__item--current': isCurrentPlan,
            'space-plans-list__item--recommended': isPayingOrg && isRecommended,
          }
        )}
        onClick={() => !plan.disabled && onSelect(plan)}>
        <div className="space-plans-list__item__heading">
          <strong data-test-id="space-plan-name">{plan.name}</strong>
          {plan.price > 0 && (
            <>
              {' '}
              <span data-test-id="space-plan-price">{formatPrice(plan.price)}</span>
              {' / month'}
            </>
          )}
          {plan.isFree && freeSpacesLimit && (
            <>
              {' '}
              <Pluralized text="free space" count={freeSpacesUsage} />{' '}
              <Tooltip content={tooltipContent}>
                <Icon icon="HelpCircle" className={styles.helpIcon} />
              </Tooltip>
            </>
          )}
        </div>

        <PlanFeatures resources={plan.includedResources} roleSet={plan.roleSet} />

        {(!isPayingOrg || !plan.disabled) && (
          <div className={styles.planChevron}>
            <Icon icon="ChevronRight" color="muted" />
          </div>
        )}
      </div>
    );
  }
}

export default SpacePlanItem;
