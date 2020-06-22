import React from 'react';
import PropTypes from 'prop-types';

import { explanationReasonText } from './utils';

import { Note } from '@contentful/forma-36-react-components';

export default function ExplainRecommendation({ recommendedPlan, resources }) {
  const explanation = explanationReasonText(resources);

  if (explanation === '') {
    return null;
  }

  const recommendPlanName = recommendedPlan.name;

  return (
    <Note testId="explain-recommendation">
      We’re recommending you a <em>{recommendPlanName}</em> space because {explanation}.
    </Note>
  );
}

ExplainRecommendation.propTypes = {
  recommendedPlan: PropTypes.object.isRequired,
  resources: PropTypes.array.isRequired,
};
