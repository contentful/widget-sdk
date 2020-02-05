import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';
import useAsync from 'app/common/hooks/useAsync';

import { getOrganization } from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';

import NewUser from './NewUser';

export default function NewUserRoute({ onReady, orgId }) {
  useEffect(onReady, [onReady]);

  const { isLoading, error, data: componentProps } = useAsync(
    useCallback(async () => {
      const [org, hasTeamsFeature] = await Promise.all([
        getOrganization(orgId),
        getOrgFeature(orgId, 'teams')
      ]);

      const isOwner = isOrgOwner(org);
      const hasSsoEnabled = org.hasSsoEnabled;

      return {
        hasSsoEnabled,
        hasTeamsFeature,
        isOwner
      };
    }, [orgId])
  );

  return (
    <>
      {isLoading && <LoadingState loadingText="Loading…" />}
      {!isLoading && error && <ErrorState />}
      {!isLoading && !error && <NewUser orgId={orgId} {...componentProps} />}
    </>
  );
}

NewUserRoute.propTypes = {
  onReady: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired
};
