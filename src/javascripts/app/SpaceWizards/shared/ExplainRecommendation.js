import React from 'react';
import PropTypes from 'prop-types';

import { getPlanResourceFulfillment } from './utils';
import { joinWithAnd } from 'utils/StringUtils';

import { Note } from '@contentful/forma-36-react-components';

export default function ExplainRecommendation({ currentPlan, recommendedPlan, resources }) {
  // The fulfillments object describes if the resource is near or has reached a limit
  const fulfillments = getPlanResourceFulfillment(currentPlan, resources);
  const recommendPlanName = recommendedPlan.name;

  const fulfillmentDetails = Object.keys(fulfillments).reduce(
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
  if (fulfillmentDetails.reached.length === 0 && fulfillmentDetails.near.length === 0) {
    return null;
  }

  const totalFulfillments = fulfillmentDetails.reached.length + fulfillmentDetails.near.length;

  return (
    <Note testId="explain-recommendation">
      We’re recommending you the {recommendPlanName} space because{' '}
      {fulfillmentDetails.reached.length > 0 && (
        <>you’ve reached the {joinWithAnd(fulfillmentDetails.reached).toLowerCase()}</>
      )}
      {fulfillmentDetails.near.length > 0 && (
        <>
          {fulfillmentDetails.reached.length > 0 && ' and are '}
          {fulfillmentDetails.reached.length === 0 && ' you’re '}
          near the {joinWithAnd(fulfillmentDetails.near).toLowerCase()}
        </>
      )}{' '}
      limit{totalFulfillments > 1 ? 's' : ''} for your current space plan.
    </Note>
  );
}

ExplainRecommendation.propTypes = {
  currentPlan: PropTypes.object.isRequired,
  recommendedPlan: PropTypes.object.isRequired,
  resources: PropTypes.array.isRequired,
};
