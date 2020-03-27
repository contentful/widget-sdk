/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { kebabCase } from 'lodash';

import tokens from '@contentful/forma-36-tokens';
import PlanFeatures from 'components/shared/space-wizard/PlanFeatures';
import { formatPrice, unavailabilityTooltipNode } from './WizardUtils';

import { Tooltip, Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  planChevron: css({
    position: 'absolute',
    right: '19px',
    bottom: '22px',
  }),
  helpIcon: css({
    fill: tokens.colorElementDarkest,
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
    } = this.props;
    const freeSpacesUsage = freeSpacesResource && freeSpacesResource.usage;
    const freeSpacesLimit = freeSpacesResource && freeSpacesResource.limits.maximum;

    const unavailabilityTooltip = unavailabilityTooltipNode(plan);

    return (
      <div
        key={plan.sys.id}
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
            <React.Fragment>
              {' - '}
              <span data-test-id="space-plan-price">{formatPrice(plan.price)}</span>
              {' / month'}
            </React.Fragment>
          )}
          {plan.isFree && freeSpacesLimit && (
            <Fragment>
              {` - ${freeSpacesUsage}/${freeSpacesLimit} used `}
              <Tooltip
                content={`You can have up to ${freeSpacesLimit} free spaces for your organization. If you
                delete a free space, another one can be created.`}>
                <Icon icon="HelpCircle" className={styles.helpIcon} />
              </Tooltip>
            </Fragment>
          )}
        </div>

        <PlanFeatures resources={plan.includedResources} roleSet={plan.roleSet} />

        {isPayingOrg && plan.disabled && !isCurrentPlan && (
          <div className={styles.planChevron}>
            <Tooltip content={unavailabilityTooltip}>
              <Icon icon="HelpCircle" className={styles.helpIcon} />
            </Tooltip>
          </div>
        )}
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
