import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { kebabCase } from 'lodash';

import HelpIcon from 'ui/Components/HelpIcon';
import Tooltip from 'ui/Components/Tooltip';
import Icon from 'ui/Components/Icon';
import PlanFeatures from 'components/shared/space-wizard/PlanFeatures';
import { formatPrice, unavailabilityTooltipNode } from './WizardUtils';
import { byName as colors } from 'Styles/Colors';

const SpacePlanItem = createReactClass({
  propTypes: {
    plan: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    freeSpacesResource: PropTypes.object,
    onSelect: PropTypes.func.isRequired,
    isPayingOrg: PropTypes.bool.isRequired,
    isCurrentPlan: PropTypes.bool,
    isRecommended: PropTypes.bool
  },
  render: function () {
    const {plan, isCurrentPlan, isSelected, isRecommended, freeSpacesResource, isPayingOrg, onSelect} = this.props;
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
            'space-plans-list__item--recommended': isRecommended
          }
        )}
        onClick={() => !plan.disabled && onSelect(plan)}>

        <div className="space-plans-list__item__heading">
          <strong data-test-id="space-plan-name">{plan.name}</strong>
          {(plan.price > 0) && <React.Fragment>
            {' - '}
            <span data-test-id="space-plan-price">{formatPrice(plan.price)}</span>
            {' / month'}
          </React.Fragment>}
          {
            plan.isFree && freeSpacesLimit &&
            <Fragment>
              {` - ${freeSpacesUsage}/${freeSpacesLimit} used`}
              <HelpIcon tooltipWidth={400}>
                You can have up to {freeSpacesLimit} free spaces for your organization.
                If you delete a free space, another one can be created.
              </HelpIcon>
            </Fragment>
        }
        </div>

        <PlanFeatures resources={plan.includedResources} />

        { isPayingOrg && plan.disabled && !isCurrentPlan &&
          <Tooltip
            style={{
              position: 'absolute',
              right: '19px',
              bottom: '25px',
              color: colors.elementDarkest
            }}
            width={800}
            tooltip={unavailabilityTooltip}
          >
              <Icon name='question-mark' />
          </Tooltip>
        }
        { (!isPayingOrg || !plan.disabled) &&
          <Icon className="space-plans-list__item__chevron" name="dd-arrow-down"/>
        }
      </div>
    );
  }
});

export default SpacePlanItem;
