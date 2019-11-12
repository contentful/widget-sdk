import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { getPlanResourceFulfillment } from './WizardUtils';
import { joinWithAnd } from 'utils/StringUtils';

export default function ExplainRecommendation({ currentPlan, recommendedPlan, resources }) {
  // The fulfillments object describes if the resource is near or has reached a limit
  const fulfillments = getPlanResourceFulfillment(currentPlan, resources);
  const recommendPlanName = recommendedPlan.name;

  const negFulfillments = Object.keys(fulfillments).reduce(
    (memo, name) => {
      if (fulfillments[name].reached) {
        memo.reached.push(name);
      } else if (fulfillments[name].near) {
        memo.near.push(name);
      }

      return memo;
    },
    {
      reached: [],
      near: []
    }
  );

  return (
    <div className="note-box--info create-space-wizard__info">
      <p>
        We&apos;re recommending you the {recommendPlanName} space because{' '}
        {negFulfillments.reached.length > 0 && (
          <Fragment>
            you&apos;ve reached the {joinWithAnd(negFulfillments.reached).toLowerCase()}
          </Fragment>
        )}
        {negFulfillments.near.length > 0 && (
          <Fragment>
            {negFulfillments.reached.length > 0 && ' and are '}
            {negFulfillments.reached.length === 0 && " you're "}
            near the {joinWithAnd(negFulfillments.near).toLowerCase()}
          </Fragment>
        )}{' '}
        limit for your current space plan.
      </p>
    </div>
  );
}

ExplainRecommendation.propTypes = {
  currentPlan: PropTypes.object.isRequired,
  recommendedPlan: PropTypes.object.isRequired,
  resources: PropTypes.array.isRequired
};
