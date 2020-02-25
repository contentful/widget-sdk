import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import StateRedirect from 'app/common/StateRedirect';
import createFetcherComponent from 'app/common/createFetcherComponent';
import ExtensionsForbiddenPage from '../ExtensionsForbiddenPage';
import ExtensionsList from '../ExtensionsList';
import { ExtensionListSkeleton } from '../skeletons/ExtensionListSkeleton';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';

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
      installationValues: Object.keys(parameters || {}).length
    }
  };
};

const ExtensionsFetcher = createFetcherComponent(async ({ cma }) => {
  const { items: extensions } = await cma.getExtensionsForListing();

  return extensions.map(prepareExtension);
});

class ExtensionsListRoute extends React.Component {
  static propTypes = {
    extensionUrl: PropTypes.string,
    extensionUrlReferrer: PropTypes.string,
    cma: PropTypes.shape({
      getExtensionsForListing: PropTypes.func.isRequired
    }).isRequired
  };

  render() {
    if (!getSectionVisibility()['extensions']) {
      if (this.props.extensionUrl) {
        return <ExtensionsForbiddenPage extensionUrl={this.props.extensionUrl} />;
      }
      return <ForbiddenPage />;
    }

    return (
      <ExtensionsFetcher cma={this.props.cma}>
        {({ isLoading, isError, data, fetch }) => {
          if (isLoading) {
            return <ExtensionListSkeleton />;
          }
          if (isError) {
            return <StateRedirect path="spaces.detail.entries.list" />;
          }
          return (
            <React.Fragment>
              <DocumentTitle title="Extensions" />
              <ExtensionsList
                extensionUrl={this.props.extensionUrl}
                extensionUrlReferrer={this.props.extensionUrlReferrer}
                extensions={data}
                cma={this.props.cma}
                refresh={fetch}
              />
            </React.Fragment>
          );
        }}
      </ExtensionsFetcher>
    );
  }
}

export default ExtensionsListRoute;
