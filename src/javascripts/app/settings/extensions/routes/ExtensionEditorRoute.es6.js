import React from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import ExtensionEditor from '../ExtensionEditor.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

const ExtensionFetcher = createFetcherComponent(props => {
  return spaceContext.cma.getExtension(props.extensionId);
});

export class ExtensionEditorRoute extends React.Component {
  static propTypes = {
    extensionId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <ExtensionFetcher extensionId={this.props.extensionId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading extension..." />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            return (
              <ExtensionEditor
                entity={data}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
              />
            );
          }}
        </ExtensionFetcher>
      </AdminOnly>
    );
  }
}

export default ExtensionEditorRoute;
