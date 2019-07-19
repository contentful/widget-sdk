import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getVariation } from 'LaunchDarkly.es6';
import NewUser from './NewUser.es6';
import AngularComponent from 'ui/Framework/AngularComponent.es6';
import { getOrganization } from 'services/TokenStore.es6';

export default function NewUserBridge({ onReady, context, orgId }) {
  const [variation, setVariation] = useState(null);
  const [hasSsoEnabled, setHasSsoEnabled] = useState(false);

  useEffect(() => {
    Promise.all([getVariation('feature-bv-05-2019-new-invitation-flow'), getOrganization(orgId)])
      .then(([variation, organization]) => {
        setVariation(variation);
        setHasSsoEnabled(organization.hasSsoEnabled);
      })
      .catch(() => setVariation(false));
  }, [orgId]);

  if (variation) {
    return <NewUser onReady={onReady} orgId={orgId} hasSsoEnabled={hasSsoEnabled} />;
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
