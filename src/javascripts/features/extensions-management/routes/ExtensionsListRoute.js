import React from 'react';
import { get } from 'lodash';
import { ReactRouterRedirect } from 'core/react-routing';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { ExtensionsForbiddenPage } from '../ExtensionsForbiddenPage';
import { ExtensionsList } from '../ExtensionsList';
import { ExtensionListSkeleton } from '../skeletons/ExtensionListSkeleton';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { getSectionVisibility } from 'access_control/AccessChecker';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';

// Takes API Extension entity and prepares it for the view.
const prepareExtension = ({ sys, extension, parameters }) => {
  const fieldTypes = (extension.fieldTypes || []).map(toInternalFieldType);

  return {
    id: sys.id,
    name: extension.name,
    fieldTypes: fieldTypes.length > 0 ? fieldTypes.join(', ') : 'none',
    hosting: typeof sys.srcdocSha256 === 'string' ? 'Contentful' : 'self-hosted',
    parameterCounts: {
      instanceDefinitions: get(extension, ['parameters', 'instance', 'length']),
      installationDefinitions: get(extension, ['parameters', 'installation', 'length']),
      installationValues: Object.keys(parameters || {}).length,
    },
  };
};

const ExtensionsFetcher = createFetcherComponent(async ({ cma }) => {
  const { items: extensions } = await cma.getExtensionsForListing();

  return extensions.map(prepareExtension);
});

export function ExtensionsListRoute() {
  const { client: cma } = useCurrentSpaceAPIClient();

  if (!getSectionVisibility()['extensions']) {
    return <ExtensionsForbiddenPage />;
  }

  return (
    <ExtensionsFetcher cma={cma}>
      {({ isLoading, isError, data, fetch }) => {
        if (isLoading) {
          return <ExtensionListSkeleton />;
        }
        if (isError) {
          return <ReactRouterRedirect route={{ path: 'entries.list' }} />;
        }
        return (
          <React.Fragment>
            <DocumentTitle title="Extensions" />
            <ExtensionsList extensions={data} cma={cma} refresh={fetch} />
          </React.Fragment>
        );
      }}
    </ExtensionsFetcher>
  );
}
