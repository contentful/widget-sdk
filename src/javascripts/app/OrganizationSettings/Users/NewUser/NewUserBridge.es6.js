import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getVariation } from 'LaunchDarkly.es6';
import NewUser from './NewUser.es6';
import AngularComponent from 'ui/Framework/AngularComponent.es6';

export default function NewUserBridge({ onReady, context, orgId }) {
  const [variation, setVariation] = useState(null);

  useEffect(() => {
    getVariation('feature-bv-05-2019-new-invitation-flow')
      .then(variation => setVariation(variation))
      .catch(() => setVariation(false));
  }, []);

  if (variation) {
    return <NewUser onReady={onReady} orgId={orgId} />;
  } else if (variation === false) {
    const scope = { properties: { context, orgId } };
    return (
      <AngularComponent
        template={'<cf-new-organization-membership properties="properties" />'}
        scope={scope}
      />
    );
  } else {
    return null;
  }
}

NewUserBridge.propTypes = {
  onReady: PropTypes.func.isRequired,
  context: PropTypes.object.isRequired,
  orgId: PropTypes.string.isRequired
};
