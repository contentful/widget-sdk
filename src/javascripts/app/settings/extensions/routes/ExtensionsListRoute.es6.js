import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import ExtensionsForbiddenPage from '../ExtensionsForbiddenPage.es6';
import ExtensionsList, { ExtensionListShell } from '../ExtensionsList.es6';
import { toInternalFieldType } from 'widgets/FieldTypes.es6';

import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

// Takes API Extension entity and prepares it for the view.
const prepareExtension = ({ sys, extension, parameters }) => {
  const fieldTypes = (extension.fieldTypes || []).map(toInternalFieldType);
  return {
    id: sys.id,
    name: extension.name,
    fieldTypes: fieldTypes.length > 0 ? fieldTypes.join(', ') : 'none',
    hosting: typeof extension.srcdoc === 'string' ? 'Contentful' : 'self-hosted',
    parameterCounts: {
      instanceDefinitions: get(extension, ['parameters', 'instance', 'length']),
      installationDefinitions: get(extension, ['parameters', 'installation', 'length']),
      installationValues: Object.keys(parameters || {}).length
    }
  };
};

const extensionNameComparator = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase());

const ExtensionsFetcher = createFetcherComponent(async () => {
  const { items } = await spaceContext.cma.getExtensions();

  return (items || []).map(prepareExtension).sort(extensionNameComparator);
});

class ExtensionsListRoute extends React.Component {
  static propTypes = {
    extensionUrl: PropTypes.string,
    extensionUrlReferrer: PropTypes.string
  };

  render() {
    return (
      <AdminOnly
        render={StateRedirect => {
          if (this.props.extensionUrl) {
            return <ExtensionsForbiddenPage extensionUrl={this.props.extensionUrl} />;
          }
          return <StateRedirect to="spaces.detail.entries.list" />;
        }}>
        <ExtensionsFetcher>
          {({ isLoading, isError, data, fetch }) => {
            if (isLoading) {
              return <ExtensionListShell />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }
            return (
              <ExtensionsList
                extensionUrl={this.props.extensionUrl}
                extensionUrlReferrer={this.props.extensionUrlReferrer}
                extensions={data}
                refresh={fetch}
              />
            );
          }}
        </ExtensionsFetcher>
      </AdminOnly>
    );
  }
}

export default ExtensionsListRoute;
