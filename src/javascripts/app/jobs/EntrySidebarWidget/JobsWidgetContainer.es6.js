import React from 'react';
import PropTypes from 'prop-types';

import JobsWidget from './JobsWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';

export default function JobsWidgetContainer({ spaceId, environmentId, userId, entity }) {
  if (!spaceId) {
    return null;
  }

  return (
    <ErrorHandler>
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
        <JobsWidget
          spaceId={spaceId}
          environmentId={environmentId}
          userId={userId}
          entity={entity}
        />
      </BooleanFeatureFlag>
    </ErrorHandler>
  );
}

JobsWidgetContainer.propTypes = {
  spaceId: PropTypes.string,
  environmentId: PropTypes.string,
  userId: PropTypes.string,
  entity: PropTypes.object
};
