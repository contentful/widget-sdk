import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import ExtensionsForbiddenPage from '../ExtensionsForbiddenPage.es6';
import ExtensionsList, { ExtensionListShell } from '../ExtensionsList.es6';
import { toInternalFieldType } from 'widgets/FieldTypes.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

// Takes API Extension entity and prepares it for the view.
const prepareExtension = definitionsThatAreApps => ({
  sys,
  extension,
  extensionDefinition,
  parameters
}) => {
  const fieldTypes = (extension.fieldTypes || []).map(toInternalFieldType);
  const extensionDefinitionId = get(extensionDefinition, ['sys', 'id']);

  return {
    id: sys.id,
    name: extension.name,
    fieldTypes: fieldTypes.length > 0 ? fieldTypes.join(', ') : 'none',
    hosting: typeof sys.srcdocSha256 === 'string' ? 'Contentful' : 'self-hosted',
    isBasedOnDefinition: !!extensionDefinitionId,
    isApp: extensionDefinitionId && definitionsThatAreApps.includes(extensionDefinitionId),
    parameterCounts: {
      instanceDefinitions: get(extension, ['parameters', 'instance', 'length']),
      installationDefinitions: get(extension, ['parameters', 'installation', 'length']),
      installationValues: Object.keys(parameters || {}).length
    }
  };
};

const ExtensionsFetcher = createFetcherComponent(async ({ extensionLoader, appsRepo }) => {
  const [extensions, definitionsThatAreApps] = await Promise.all([
    extensionLoader.getAllExtensionsForListing(),
    appsRepo.getDefinitionIdsOfApps()
  ]);

  return (extensions || [])
    .map(prepareExtension(definitionsThatAreApps))
    .filter(extension => !extension.isApp);
});

class ExtensionsListRoute extends React.Component {
  static propTypes = {
    extensionUrl: PropTypes.string,
    extensionUrlReferrer: PropTypes.string,
    extensionLoader: PropTypes.shape({
      getAllExtensionsForListing: PropTypes.func.isRequired
    }).isRequired,
    appsRepo: PropTypes.shape({
      getDefinitionIdsOfApps: PropTypes.func.isRequired
    })
  };

  render() {
    if (!getSectionVisibility()['extensions']) {
      if (this.props.extensionUrl) {
        return <ExtensionsForbiddenPage extensionUrl={this.props.extensionUrl} />;
      }
      return <ForbiddenPage />;
    }

    return (
      <ExtensionsFetcher
        extensionLoader={this.props.extensionLoader}
        appsRepo={this.props.appsRepo}>
        {({ isLoading, isError, data, fetch }) => {
          if (isLoading) {
            return <ExtensionListShell />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }
          return (
            <React.Fragment>
              <DocumentTitle title="Extensions" />
              <ExtensionsList
                extensionUrl={this.props.extensionUrl}
                extensionUrlReferrer={this.props.extensionUrlReferrer}
                extensions={data}
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
