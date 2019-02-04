import React from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import ExtensionsForbiddenPage from '../ExtensionsForbiddenPage.es6';
import ExtensionsList, { ExtensionListShell } from '../ExtensionsList.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

const ExtensionsFetcher = createFetcherComponent(() => {
  return spaceContext.widgets.refresh().then(widgets => {
    return widgets.extension.sort((a, b) => {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  });
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
