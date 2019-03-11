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

const ExtensionsFetcher = createFetcherComponent(async ({ cma }) => {
  const { items } = await cma.getExtensions();

  return (items || []).map(prepareExtension).sort(extensionNameComparator);
});

class ExtensionsListRoute extends React.Component {
  static propTypes = {
    extensionUrl: PropTypes.string,
    extensionUrlReferrer: PropTypes.string,
    cma: PropTypes.shape({ getExtensions: PropTypes.func.isRequired }).isRequired
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
    );
  }
}

export default ExtensionsListRoute;
