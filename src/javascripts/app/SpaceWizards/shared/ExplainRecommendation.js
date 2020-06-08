import React from 'react';
import PropTypes from 'prop-types';

import { getPlanResourceFulfillment } from './utils';
import { joinWithAnd } from 'utils/StringUtils';

import { Note, Paragraph } from '@contentful/forma-36-react-components';

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
      near: [],
    }
  );

  // Don't render this if there are no reached or near fulfillments
  if (negFulfillments.reached.length === 0 && negFulfillments.near.length === 0) {
    return null;
  }

  return (
    <Note>
      <Paragraph>
        We’re recommending you the {recommendPlanName} space because{' '}
        {negFulfillments.reached.length > 0 && (
          <>you’ve reached the {joinWithAnd(negFulfillments.reached).toLowerCase()}</>
        )}
        {negFulfillments.near.length > 0 && (
          <>
            {negFulfillments.reached.length > 0 && ' and are '}
            {negFulfillments.reached.length === 0 && ' you’re '}
            near the {joinWithAnd(negFulfillments.near).toLowerCase()}
          </>
        )}{' '}
        limit for your current space plan.
      </Paragraph>
    </Note>
  );
}

ExplainRecommendation.propTypes = {
  currentPlan: PropTypes.object.isRequired,
  recommendedPlan: PropTypes.object.isRequired,
  resources: PropTypes.array.isRequired,
};
