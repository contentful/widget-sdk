import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getVariation } from 'LaunchDarkly.es6';
import NewUser from './NewUser.es6';
import AngularComponent from 'ui/Framework/AngularComponent.es6';
import { getOrganization } from 'services/TokenStore.es6';
import { isOwner } from 'services/OrganizationRoles.es6';

export default function NewUserBridge({ onReady, context, orgId }) {
  const [variation, setVariation] = useState(null);
  const [org, setOrg] = useState(null);

  useEffect(() => {
    Promise.all([getVariation('feature-bv-05-2019-new-invitation-flow'), getOrganization(orgId)])
      .then(([variation, organization]) => {
        setOrg(organization);
        setVariation(variation);
      })
      .catch(() => setVariation(false));
  }, [orgId]);

  if (variation && org) {
    return (
      <NewUser
        onReady={onReady}
        orgId={orgId}
        hasSsoEnabled={org.hasSsoEnabled}
        isOwner={isOwner(org)}
      />
    );
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
