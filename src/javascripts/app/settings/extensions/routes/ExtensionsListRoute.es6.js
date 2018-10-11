import React from 'react';
import { sortBy, filter, flow } from 'lodash/fp';
import PropTypes from 'prop-types';
import spaceContext from 'spaceContext';
import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import ExtensionsForbiddenPage from '../ExtensionsForbiddenPage.es6';
import ExtensionsList from '../ExtensionsList.es6';

const ExtensionsFetcher = createFetcherComponent(() => {
  return spaceContext.widgets.refresh().then(widgets => {
    return flow(
      filter('custom'),
      sortBy('name')
    )(widgets);
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
              return <FetcherLoading message="Loading extensions..." />;
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
