import React from 'react';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ContentTypeListPage } from './ContentTypeList/ContentTypeListPage';
import { LocationProvider } from 'core/services/LocationContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import type { Organization } from 'classes/spaceContextTypes';

export function ContentTypesPage() {
  const {
    currentOrganization,
    currentOrganizationId,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpaceId: spaceId,
  } = useSpaceEnvContext();
  return (
    <>
      <DocumentTitle title="Content Model" />
      <LocationProvider>
        <ContentTypeListPage
          spaceId={spaceId as string}
          environmentId={currentEnvironmentAliasId || currentEnvironmentId}
          currentOrganization={currentOrganization as Organization}
          currentOrganizationId={currentOrganizationId as string}
        />
      </LocationProvider>
    </>
  );
}
