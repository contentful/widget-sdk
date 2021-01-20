import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ContentTypeListPage } from './ContentTypeListPage';
import { LocationProvider } from 'core/services/LocationContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

export function ContentTypesPage({ spaceId }) {
  const {
    currentOrganization,
    currentOrganizationId,
    currentEnvironmentId,
    currentEnvironmentAliasId,
  } = useSpaceEnvContext();
  return (
    <>
      <DocumentTitle title="Content Model" />
      <LocationProvider>
        <ContentTypeListPage
          spaceId={spaceId}
          environmentId={currentEnvironmentAliasId || currentEnvironmentId}
          currentOrganization={currentOrganization}
          currentOrganizationId={currentOrganizationId}
        />
      </LocationProvider>
    </>
  );
}

ContentTypesPage.propTypes = {
  spaceId: PropTypes.string,
};
